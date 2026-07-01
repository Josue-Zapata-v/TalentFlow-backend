import { EstadoPostulacion, Postulacion, Prisma } from "@prisma/client";

export const postulacionInclude = {
  vacante: { select: { id: true, titulo: true, slug: true, estado: true, reclutadorId: true } },
  postulante: { select: { id: true, nombre: true, email: true } },
} satisfies Prisma.PostulacionInclude;

export const historialInclude = {
  cambiadoPor: { select: { id: true, nombre: true, email: true, rol: true } },
} satisfies Prisma.HistorialEstadoInclude;

export type PostulacionWithRelations = Prisma.PostulacionGetPayload<{ include: typeof postulacionInclude }>;
export type HistorialEstadoWithUser = Prisma.HistorialEstadoGetPayload<{ include: typeof historialInclude }>;

export interface CreatePostulacionData {
  vacanteId: string;
  postulanteId: string;
  cvUrl?: string;
  observaciones?: string;
}

export interface IPostulacionRepository {
  findById(id: string): Promise<PostulacionWithRelations | null>;
  findByVacanteAndPostulante(vacanteId: string, postulanteId: string): Promise<Postulacion | null>;
  findManyByPostulante(postulanteId: string): Promise<PostulacionWithRelations[]>;
  findManyByVacante(vacanteId: string): Promise<PostulacionWithRelations[]>;
  createWithHistorial(data: CreatePostulacionData): Promise<PostulacionWithRelations>;
  updateEstadoWithHistorial(
    id: string,
    estadoAnterior: EstadoPostulacion,
    estadoNuevo: EstadoPostulacion,
    cambiadoPorId: string,
  ): Promise<PostulacionWithRelations>;
  findHistorial(postulacionId: string): Promise<HistorialEstadoWithUser[]>;
}
