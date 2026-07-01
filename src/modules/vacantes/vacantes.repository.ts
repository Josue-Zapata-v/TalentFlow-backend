import { Prisma, Vacante } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreateVacanteData,
  IVacanteRepository,
  PaginatedResult,
  UpdateVacanteData,
  VacanteFilters,
} from "../../interfaces/vacante-repository.interface";

export class VacantesRepository implements IVacanteRepository {
  async findPublicMany(
    filters: Omit<VacanteFilters, "estado" | "reclutadorId">,
  ): Promise<PaginatedResult<Vacante>> {
    return this.findMany({ ...filters, estado: "ABIERTA" });
  }

  findPublicBySlug(slug: string): Promise<Vacante | null> {
    return prisma.vacante.findFirst({ where: { slug, estado: "ABIERTA" } });
  }

  findManageMany(filters: VacanteFilters): Promise<PaginatedResult<Vacante>> {
    return this.findMany(filters);
  }

  findById(id: string): Promise<Vacante | null> {
    return prisma.vacante.findUnique({ where: { id } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await prisma.vacante.count({ where: { slug } });
    return count > 0;
  }

  create(data: CreateVacanteData): Promise<Vacante> {
    return prisma.vacante.create({ data });
  }

  update(id: string, data: UpdateVacanteData): Promise<Vacante> {
    return prisma.vacante.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.vacante.delete({ where: { id } });
  }

  countPostulaciones(vacanteId: string): Promise<number> {
    return prisma.postulacion.count({ where: { vacanteId } });
  }

  private async findMany(filters: VacanteFilters): Promise<PaginatedResult<Vacante>> {
    const where: Prisma.VacanteWhereInput = {
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.reclutadorId && { reclutadorId: filters.reclutadorId }),
      ...(filters.modalidad && { modalidad: filters.modalidad }),
      ...(filters.ubicacion && { ubicacion: { contains: filters.ubicacion, mode: "insensitive" } }),
      ...(filters.categoria && { categoria: { contains: filters.categoria, mode: "insensitive" } }),
    };

    const [data, total] = await Promise.all([
      prisma.vacante.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.vacante.count({ where }),
    ]);

    return { data, total, page: filters.page, limit: filters.limit };
  }
}
