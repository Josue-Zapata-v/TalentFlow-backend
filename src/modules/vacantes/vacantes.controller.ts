import { Request, Response } from "express";
import { PaginatedResult, VacanteFilters } from "../../interfaces/vacante-repository.interface";
import { vacantesService } from "./vacantes.service";

function toPaginatedResponse<T>(result: PaginatedResult<T>) {
  return {
    vacantes: result.data,
    pagination: { total: result.total, page: result.page, limit: result.limit },
  };
}

export async function listPublic(req: Request, res: Response) {
  const result = await vacantesService.listPublic(req.query as unknown as VacanteFilters);
  res.status(200).json({ success: true, data: toPaginatedResponse(result), message: "Vacantes obtenidas" });
}

export async function getPublicBySlug(req: Request, res: Response) {
  const vacante = await vacantesService.getPublicBySlug(req.params.slug as string);
  res.status(200).json({ success: true, data: { vacante }, message: "Vacante obtenida" });
}

export async function listManage(req: Request, res: Response) {
  const result = await vacantesService.listManage(req.user!, req.query as unknown as VacanteFilters);
  res.status(200).json({ success: true, data: toPaginatedResponse(result), message: "Vacantes obtenidas" });
}

export async function getManageById(req: Request, res: Response) {
  const vacante = await vacantesService.getManageById(req.params.id as string, req.user!);
  res.status(200).json({ success: true, data: { vacante }, message: "Vacante obtenida" });
}

export async function create(req: Request, res: Response) {
  const vacante = await vacantesService.create(req.body, req.user!);
  res.status(201).json({ success: true, data: { vacante }, message: "Vacante creada correctamente" });
}

export async function update(req: Request, res: Response) {
  const vacante = await vacantesService.update(req.params.id as string, req.body, req.user!);
  res.status(200).json({ success: true, data: { vacante }, message: "Vacante actualizada correctamente" });
}

export async function remove(req: Request, res: Response) {
  await vacantesService.remove(req.params.id as string, req.user!);
  res.status(200).json({ success: true, data: null, message: "Vacante eliminada correctamente" });
}
