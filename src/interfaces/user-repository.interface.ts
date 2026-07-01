import { User } from "@prisma/client";
import { PaginatedResult } from "../shared/types/pagination";
import { PublicUser } from "../modules/users/users.types";

export interface CreateUserData {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: User["rol"];
}

export interface UpdateUserData {
  nombre?: string;
  rol?: User["rol"];
}

export interface UserFilters {
  rol?: User["rol"];
  page: number;
  limit: number;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  findMany(filters: UserFilters): Promise<PaginatedResult<PublicUser>>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  countRelatedRecords(userId: string): Promise<number>;
}
