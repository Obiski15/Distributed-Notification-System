import { config } from "@dns/shared/config/index"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
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
    const class_ref = context.getClass()
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    // Check if the route is marked as Public
    const is_public = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      class_ref,
    ])
    if (is_public) return true

    // INTERNAL BYPASS CHECK
    const allow_internal = this.reflector.getAllAndOverride<boolean>(
      IS_INTERNAL_KEY,
      [handler, class_ref],
    )

    if (allow_internal) {
      const internal_header = request.headers["x-internal-secret"]
      if (internal_header === config.INTERNAL_SERVICE_SECRET) {
        return true
      }
    }

    if (is_public) {
      return true
    }

    // extract request
    const token = this.extract_token_from_header(request)

    if (!token) {
      throw new UnauthorizedException(SYSTEM_MESSAGES.MISSING_AUTH_TOKEN)
    }

    let payload: IUserPayload | null = null
    try {
      // Verify token
      payload = await this.jwtService.verifyAsync<IUserPayload>(token, {
        secret: config.JWT_ACCESS_SECRET,
      })
    } catch {
      throw new UnauthorizedException(SYSTEM_MESSAGES.INVALID_AUTH_TOKEN)
    }

    const user = await this.userService.get_user(payload?.sub)

    request["user"] = user

    return true
  }

  private extract_token_from_header(
    request: FastifyRequest,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : undefined
  }
}
