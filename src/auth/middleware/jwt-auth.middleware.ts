
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {

    console.log('Incoming cookies:', req.cookies);
console.log('Raw cookie header:', req.headers.cookie);

    if (
      req.originalUrl.startsWith('/auth/login') ||
      req.originalUrl.startsWith('/auth/register') ||
      req.originalUrl.startsWith('/auth/refresh')
    ) {
      return next();
    }

    console.log('JwtMiddleware running on:', req.path);

    const token = req.cookies?.['access_token'];
    if (!token) {
      req['user'] = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req['user'] = decoded;
    } catch (err) {
      req['user'] = null;
    }

    next();
  }
}
