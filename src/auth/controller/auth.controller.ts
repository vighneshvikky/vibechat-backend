import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Response } from 'express';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    console.log('body for register', body);
    return this._authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    const data = await this._authService.login(body.email, body.password, res);
    return res.status(200).json(data);

  }
 @Get('refresh')
  async refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    console.log('Incoming cookies:', req.cookies);


    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const result =  await this._authService.refreshTokens(refreshToken, res);

    console.log('data', result);
    return res.json(result);
  }
}
