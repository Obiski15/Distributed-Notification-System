import { HttpService } from "@nestjs/axios"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { config } from "@shared/config/index"
import { AxiosResponse } from "axios"
import { FastifyRequest } from "fastify"
import { firstValueFrom } from "rxjs"
import { Breaker } from "src/common/breaker"
import { Discover } from "../../../common/discover"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator"

interface AuthenticatedRequest extends FastifyRequest {
  user?: IUser
}

@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
  private service: Service

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly reflector: Reflector,
  ) {}

  async onModuleInit() {
    this.service = await new Discover().discover(config.USER_SERVICE)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    // extract request
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException("Missing auth token")
    }

    let payload: IUser | null = null
    try {
      // Verify token
      payload = await this.jwtService.verifyAsync<IUser>(token, {
        secret: config.JWT_ACCESS_SECRET,
      })
    } catch {
      throw new UnauthorizedException("Invalid auth token")
    }

    const user = await this.validateUser(payload?.sub, request)

    request["user"] = user

    return true
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : undefined
  }

  private async validateUser(user_id: string, request: FastifyRequest) {
    const cacheKey = `user:${user_id}`

    const cachedStatus = (await this.cache.get(cacheKey)) as IUser

    if (cachedStatus !== undefined && cachedStatus !== null) {
      return cachedStatus
    }

    const targetUrl = `http://${
      this.service.ServiceAddress || this.service.Address
    }:${this.service.ServicePort}/api/v1/users`

    const res = await new Breaker<AxiosResponse<{ status: true; data: IUser }>>(
      () =>
        firstValueFrom(
          this.httpService.request({
            url: targetUrl,
            method: "GET",
            headers: {
              "x-user-id": user_id,
              ...request.headers,
            },
          }),
        ),
      config.USER_SERVICE,
    ).fire()

    await this.cache.set(cacheKey, res.data.data)

    return res.data.data
  }
}
