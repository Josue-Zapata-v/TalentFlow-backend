import { User } from "@prisma/client";

export interface CreateUserData {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: User["rol"];
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
