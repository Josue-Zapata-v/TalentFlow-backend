import { Vacante } from "@prisma/client";
import {
  IVacanteRepository,
  PaginatedResult,
  VacanteFilters,
} from "../../interfaces/vacante-repository.interface";
import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { JwtPayload } from "../../shared/utils/jwt.util";
import { slugify } from "../../shared/utils/slugify.util";
import { CreateVacanteInput, UpdateVacanteInput } from "./vacantes.dto";
import { VacantesRepository } from "./vacantes.repository";

export class VacantesService {
  constructor(private readonly repo: IVacanteRepository = new VacantesRepository()) {}

  listPublic(filters: Omit<VacanteFilters, "estado" | "reclutadorId">): Promise<PaginatedResult<Vacante>> {
    return this.repo.findPublicMany(filters);
  }

  async getPublicBySlug(slug: string): Promise<Vacante> {
    const vacante = await this.repo.findPublicBySlug(slug);
    if (!vacante) {
      throw new NotFoundError("Vacante no encontrada");
    }
    return vacante;
  }

  listManage(user: JwtPayload, filters: VacanteFilters): Promise<PaginatedResult<Vacante>> {
    const scopedFilters = user.role === "RECLUTADOR" ? { ...filters, reclutadorId: user.sub } : filters;
    return this.repo.findManageMany(scopedFilters);
  }

  async getManageById(id: string, user: JwtPayload): Promise<Vacante> {
    const vacante = await this.repo.findById(id);
    if (!vacante) {
      throw new NotFoundError("Vacante no encontrada");
    }
    this.assertOwnership(vacante, user);
    return vacante;
  }

  async create(input: CreateVacanteInput, user: JwtPayload): Promise<Vacante> {
    const slug = await this.generateUniqueSlug(input.titulo);
    return this.repo.create({ ...input, slug, reclutadorId: user.sub });
  }

  async update(id: string, input: UpdateVacanteInput, user: JwtPayload): Promise<Vacante> {
    await this.getManageById(id, user);
    return this.repo.update(id, input);
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    await this.getManageById(id, user);

    const postulacionesCount = await this.repo.countPostulaciones(id);
    if (postulacionesCount > 0) {
      throw new ConflictError(
        "No se puede eliminar una vacante con postulaciones registradas. Ciérrala en su lugar.",
      );
    }

    await this.repo.delete(id);
  }

  private assertOwnership(vacante: Vacante, user: JwtPayload) {
    if (user.role === "RECLUTADOR" && vacante.reclutadorId !== user.sub) {
      throw new ForbiddenError("No tienes permisos sobre esta vacante");
    }
  }

  private async generateUniqueSlug(titulo: string): Promise<string> {
    const base = slugify(titulo);
    let slug = base;
    let counter = 2;

    while (await this.repo.existsBySlug(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }
}

export const vacantesService = new VacantesService();
