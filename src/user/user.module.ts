import { Module } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { IUSERSERVICE } from './service/interface/IUser-service.interface';
import { IUSERREPOSITORY } from './repository/interface/IUser-repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    {
      provide: IUSERSERVICE,
      useClass: UserService
    }, {
      provide: IUSERREPOSITORY,
      useClass: UserRepository
    }],
  controllers: [UserController],
  exports: [    {
      provide: IUSERSERVICE,
      useClass: UserService
    }, {
      provide: IUSERREPOSITORY,
      useClass: UserRepository
    }, MongooseModule],
})
export class UserModule {}
