import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common"
import { UsersService } from "./users.service"
import { ConsulService } from "../../consul/consul.service"

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly consulService: ConsulService,
  ) {}

  // --- NEW LOGIN ENDPOINT ---
  @Post("/login")
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() body: any) {
    // This forwards the user's credentials (e.g., email and password)
    // to the downstream Laravel service. That service is responsible for
    // validating the credentials and returning a JWT token.

    // IMPORTANT: You MUST confirm the exact login path with the Laravel developer.
    // It might be "/api/v1/login", "/api/v1/auth/token", or something else.
    const loginPath = "/api/v1/auth/login"

    return await this.usersService.forwardToUserService("POST", loginPath, body)
  }
  // --- END OF NEW ENDPOINT ---

  @Post("/")
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: any) {
    const res = await this.usersService.forwardToUserService(
      "POST",
      "/api/v1/auth/register",
      body,
    )

    return {
      success: res?.success ?? true,
      data: res?.data || null,
      message: res?.message || "User created",
    }
  }

  @Patch("/:id")
  async updateUser(@Param("id") id: string, @Body() body: any) {
    const res = await this.usersService.forwardToUserService(
      "PATCH",
      `/api/v1/user/${id}`,
      body,
    )

    return {
      success: res?.success ?? true,
      data: res?.data || null,
      message: res?.message || "User updated",
    }
  }

  @Delete("/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param("id") id: string) {
    await this.usersService.forwardToUserService(
      "DELETE",
      `/api/v1/users/${id}`,
      undefined,
    )
  }
}
