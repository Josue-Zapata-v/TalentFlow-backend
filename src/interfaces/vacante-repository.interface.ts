import { EstadoVacante, ModalidadVacante, Vacante } from "@prisma/client";
import { PaginatedResult } from "../shared/types/pagination";

export type { PaginatedResult };

export interface VacanteFilters {
  ubicacion?: string;
  modalidad?: ModalidadVacante;
  categoria?: string;
  estado?: EstadoVacante;
  reclutadorId?: string;
  page: number;
  limit: number;
}

export type CreateVacanteData = Pick<
  Vacante,
  "titulo" | "slug" | "descripcion" | "requisitos" | "ubicacion" | "modalidad" | "estado" | "reclutadorId"
> &
  Partial<Pick<Vacante, "salarioRango" | "categoria">>;

export type UpdateVacanteData = Partial<
  Pick<
    Vacante,
    | "titulo"
    | "descripcion"
    | "requisitos"
    | "ubicacion"
    | "modalidad"
    | "estado"
    | "salarioRango"
    | "categoria"
  >
>;

export interface IVacanteRepository {
  findPublicMany(filters: Omit<VacanteFilters, "estado" | "reclutadorId">): Promise<PaginatedResult<Vacante>>;
  findPublicBySlug(slug: string): Promise<Vacante | null>;
  findManageMany(filters: VacanteFilters): Promise<PaginatedResult<Vacante>>;
  findById(id: string): Promise<Vacante | null>;
  existsBySlug(slug: string): Promise<boolean>;
  create(data: CreateVacanteData): Promise<Vacante>;
  update(id: string, data: UpdateVacanteData): Promise<Vacante>;
  delete(id: string): Promise<void>;
  countPostulaciones(vacanteId: string): Promise<number>;
}
