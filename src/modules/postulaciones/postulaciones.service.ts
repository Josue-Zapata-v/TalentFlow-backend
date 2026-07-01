import {
  HistorialEstadoWithUser,
  IPostulacionRepository,
  PostulacionWithRelations,
} from "../../interfaces/postulacion-repository.interface";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors";
import { JwtPayload } from "../../shared/utils/jwt.util";
import { vacantesService, VacantesService } from "../vacantes/vacantes.service";
import { ChangeEstadoInput, CreatePostulacionInput } from "./postulaciones.dto";
import { PostulacionesRepository } from "./postulaciones.repository";

export class PostulacionesService {
  constructor(
    private readonly repo: IPostulacionRepository = new PostulacionesRepository(),
    private readonly vacantesSvc: VacantesService = vacantesService,
  ) {}

  async apply(input: CreatePostulacionInput, user: JwtPayload): Promise<PostulacionWithRelations> {
    const vacante = await this.vacantesSvc.getById(input.vacanteId);

    if (vacante.estado !== "ABIERTA") {
      throw new ConflictError("Esta vacante no está abierta para recibir postulaciones");
    }

    const existing = await this.repo.findByVacanteAndPostulante(input.vacanteId, user.sub);
    if (existing) {
      throw new ConflictError("Ya postulaste a esta vacante");
    }

    return this.repo.createWithHistorial({
      vacanteId: input.vacanteId,
      postulanteId: user.sub,
      cvUrl: input.cvUrl,
      observaciones: input.observaciones,
    });
  }

  listMine(user: JwtPayload): Promise<PostulacionWithRelations[]> {
    return this.repo.findManyByPostulante(user.sub);
  }

  async listByVacante(vacanteId: string, user: JwtPayload): Promise<PostulacionWithRelations[]> {
    const vacante = await this.vacantesSvc.getById(vacanteId);
    this.assertVacanteOwnership(vacante.reclutadorId, user);
    return this.repo.findManyByVacante(vacanteId);
  }

  async getById(id: string, user: JwtPayload): Promise<PostulacionWithRelations> {
    const postulacion = await this.repo.findById(id);
    if (!postulacion) {
      throw new NotFoundError("Postulación no encontrada");
    }
    this.assertAccess(postulacion, user);
    return postulacion;
  }

  async getHistorial(id: string, user: JwtPayload): Promise<HistorialEstadoWithUser[]> {
    await this.getById(id, user);
    return this.repo.findHistorial(id);
  }

  async changeEstado(
    id: string,
    input: ChangeEstadoInput,
    user: JwtPayload,
  ): Promise<PostulacionWithRelations> {
    const postulacion = await this.repo.findById(id);
    if (!postulacion) {
      throw new NotFoundError("Postulación no encontrada");
    }

    this.assertVacanteOwnership(postulacion.vacante.reclutadorId, user);

    if (postulacion.estado === input.estado) {
      throw new ValidationError("La postulación ya se encuentra en ese estado");
    }

    return this.repo.updateEstadoWithHistorial(id, postulacion.estado, input.estado, user.sub);
  }

  private assertVacanteOwnership(reclutadorId: string, user: JwtPayload) {
    if (user.role === "RECLUTADOR" && reclutadorId !== user.sub) {
      throw new ForbiddenError("No tienes permisos sobre esta vacante");
    }
  }

  private assertAccess(postulacion: PostulacionWithRelations, user: JwtPayload) {
    if (user.role === "POSTULANTE" && postulacion.postulanteId !== user.sub) {
      throw new ForbiddenError("No tienes permisos sobre esta postulación");
    }

    if (user.role === "RECLUTADOR" && postulacion.vacante.reclutadorId !== user.sub) {
      throw new ForbiddenError("No tienes permisos sobre esta postulación");
    }
  }
}

export const postulacionesService = new PostulacionesService();
