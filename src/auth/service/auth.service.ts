import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import {
  IUserRepository,
  IUSERREPOSITORY,
} from 'src/user/repository/interface/IUser-repository.interface';

@Injectable()
export class AuthService {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  constructor(
    @Inject(IUSERREPOSITORY)
    private readonly _userRepository: IUserRepository,
    private readonly _jwtService: JwtService,
  ) {}

  async register(userData: Partial<User>) {
    const existingUser = await this._userRepository.findByEmail(
      userData.email!,
    );

    if (existingUser) throw new UnauthorizedException('Email already exists');

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    console.log('hashedPassword', hashedPassword);

    const user = await this._userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return { message: 'User registered sucessfully', user };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this._userRepository.findByEmail(email);
    console.log('user', user);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('isPasswordValid', isPasswordValid);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id, email: user.email };

    const accessToken = this._jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this._jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });

    console.log('isProduction', this.isProduction);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Login successful',
      user: { email: user.email, name: user.name },
    };
  }

  async refreshTokens(refreshToken: string, res: Response) {
    const payload = this._jwtService.verify(refreshToken, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    const user = await this._userRepository.findByEmail(payload.email);
    if (!user) throw new UnauthorizedException('User not found');

    const newAccessToken = this._jwtService.sign(
      { sub: user._id, email: user.email },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '15m',
      },
    );
    console.log('newAccessToken', newAccessToken);
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    return { message: 'Token refreshed successfully' };
  }
}
