import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { config } from "@shared/config/index"
import { FastifyRequest } from "fastify"
import { IS_INTERNAL_KEY } from "../../../decorators/isInternal.decorator"
import { IS_PUBLIC_KEY } from "../../../decorators/public.decorator"
import { UserService } from "../../user/user.service"

interface AuthenticatedRequest extends FastifyRequest {
  user?: IUser
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler()
    const classRef = context.getClass()
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    // Check if the route is marked as Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      classRef,
    ])
    if (isPublic) return true

    // INTERNAL BYPASS CHECK
    const allowInternal = this.reflector.getAllAndOverride<boolean>(
      IS_INTERNAL_KEY,
      [handler, classRef],
    )

    if (allowInternal) {
      const internalHeader = request.headers["x-internal-secret"]
      if (internalHeader === config.INTERNAL_SERVICE_SECRET) {
        return true
      }
    }

    if (isPublic) {
      return true
    }

    // extract request
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException("Missing auth token")
    }

    let payload: IUserPayload | null = null
    try {
      // Verify token
      payload = await this.jwtService.verifyAsync<IUserPayload>(token, {
        secret: config.JWT_ACCESS_SECRET,
      })
    } catch {
      throw new UnauthorizedException("Invalid auth token")
    }

    const user = await this.userService.get_user(payload?.sub)

    request["user"] = user

    return true
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : undefined
  }
}
