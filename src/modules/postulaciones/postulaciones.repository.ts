import { EstadoPostulacion, Postulacion } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreatePostulacionData,
  historialInclude,
  HistorialEstadoWithUser,
  IPostulacionRepository,
  postulacionInclude,
  PostulacionWithRelations,
} from "../../interfaces/postulacion-repository.interface";

export class PostulacionesRepository implements IPostulacionRepository {
  findById(id: string): Promise<PostulacionWithRelations | null> {
    return prisma.postulacion.findUnique({ where: { id }, include: postulacionInclude });
  }

  findByVacanteAndPostulante(vacanteId: string, postulanteId: string): Promise<Postulacion | null> {
    return prisma.postulacion.findUnique({
      where: { vacanteId_postulanteId: { vacanteId, postulanteId } },
    });
  }

  findManyByPostulante(postulanteId: string): Promise<PostulacionWithRelations[]> {
    return prisma.postulacion.findMany({
      where: { postulanteId },
      include: postulacionInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  findManyByVacante(vacanteId: string): Promise<PostulacionWithRelations[]> {
    return prisma.postulacion.findMany({
      where: { vacanteId },
      include: postulacionInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  createWithHistorial(data: CreatePostulacionData): Promise<PostulacionWithRelations> {
    return prisma.$transaction(async (tx) => {
      const postulacion = await tx.postulacion.create({ data, include: postulacionInclude });
      await tx.historialEstado.create({
        data: {
          postulacionId: postulacion.id,
          estadoAnterior: null,
          estadoNuevo: postulacion.estado,
          cambiadoPorId: data.postulanteId,
        },
      });
      return postulacion;
    });
  }

  updateEstadoWithHistorial(
    id: string,
    estadoAnterior: EstadoPostulacion,
    estadoNuevo: EstadoPostulacion,
    cambiadoPorId: string,
  ): Promise<PostulacionWithRelations> {
    return prisma.$transaction(async (tx) => {
      const postulacion = await tx.postulacion.update({
        where: { id },
        data: { estado: estadoNuevo },
        include: postulacionInclude,
      });
      await tx.historialEstado.create({
        data: { postulacionId: id, estadoAnterior, estadoNuevo, cambiadoPorId },
      });
      return postulacion;
    });
  }

  findHistorial(postulacionId: string): Promise<HistorialEstadoWithUser[]> {
    return prisma.historialEstado.findMany({
      where: { postulacionId },
      include: historialInclude,
      orderBy: { fecha: "asc" },
    });
  }
}
