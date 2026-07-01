import { Prisma, User } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserFilters,
} from "../../interfaces/user-repository.interface";
import { PaginatedResult } from "../../shared/types/pagination";
import { PublicUser } from "./users.types";

const publicUserSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

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

  async findMany(filters: UserFilters): Promise<PaginatedResult<PublicUser>> {
    const where: Prisma.UserWhereInput = { ...(filters.rol && { rol: filters.rol }) };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total, page: filters.page, limit: filters.limit };
  }

  update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async countRelatedRecords(userId: string): Promise<number> {
    const [vacantes, postulaciones, historial] = await Promise.all([
      prisma.vacante.count({ where: { reclutadorId: userId } }),
      prisma.postulacion.count({ where: { postulanteId: userId } }),
      prisma.historialEstado.count({ where: { cambiadoPorId: userId } }),
    ]);

    return vacantes + postulaciones + historial;
  }
}
