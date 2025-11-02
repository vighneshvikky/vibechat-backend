import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @Get('all')
  async findAll(@Req() req: Request) {
    const user = req['user'];
    console.log('Decoded JWT payload:', user);
    const userId = user.sub;
    console.log('userId', userId);
    return this._userService.findAll();
  }

  @Get('userDetails')
  async getUserDetails(@Req() req: Request) {
    const user = req['user'];
    console.log('user from email');
    return this._userService.findByEmail(user.email);
  }
}
