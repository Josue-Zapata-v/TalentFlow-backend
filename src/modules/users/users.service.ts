import { User } from "@prisma/client";
import { CreateUserData, IUserRepository } from "../../interfaces/user-repository.interface";
import { UsersRepository } from "./users.repository";

export class UsersService {
  constructor(private readonly userRepository: IUserRepository = new UsersRepository()) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  createUser(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }
}

export const usersService = new UsersService();
