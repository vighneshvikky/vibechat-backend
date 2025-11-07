import { User } from "../schemas/user.schema";
import { UserResponse } from "../service/interface/IUser-service.interface";

  export function mapToResponse(user: User): UserResponse {
    return {
      _id: user._id?.toString() || '',
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }