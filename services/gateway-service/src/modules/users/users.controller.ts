import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: any) {
    return this.usersService.forwardToUserService('POST', '/api/v1/users', body);
  }

  @Patch('/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.usersService.forwardToUserService('PATCH', `/api/v1/users/${id}`, body);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    return this.usersService.forwardToUserService('DELETE', `/api/v1/users/${id}`);
  }
}
