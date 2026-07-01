import { User } from "@prisma/client";
import { prisma } from "../../config/database";
import { CreateUserData, IUserRepository } from "../../interfaces/user-repository.interface";

export class UsersRepository implements IUserRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }
}
