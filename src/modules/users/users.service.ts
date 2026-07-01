import { User } from "@prisma/client";
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserFilters,
} from "../../interfaces/user-repository.interface";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { PaginatedResult } from "../../shared/types/pagination";
import { UsersRepository } from "./users.repository";
import { PublicUser, toPublicUser } from "./users.types";

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

  list(filters: UserFilters): Promise<PaginatedResult<PublicUser>> {
    return this.userRepository.findMany(filters);
  }

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }
    return toPublicUser(user);
  }

  async updateOwnProfile(userId: string, data: Pick<UpdateUserData, "nombre">): Promise<PublicUser> {
    const updated = await this.userRepository.update(userId, data);
    return toPublicUser(updated);
  }

  async updateAsAdmin(id: string, data: UpdateUserData): Promise<PublicUser> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Usuario no encontrado");
    }
    const updated = await this.userRepository.update(id, data);
    return toPublicUser(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const relatedCount = await this.userRepository.countRelatedRecords(id);
    if (relatedCount > 0) {
      throw new ConflictError(
        "No se puede eliminar un usuario con actividad registrada (vacantes, postulaciones o cambios de historial)",
      );
    }

    await this.userRepository.delete(id);
  }
}

export const usersService = new UsersService();
