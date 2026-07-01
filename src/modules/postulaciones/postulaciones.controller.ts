import { Request, Response } from "express";
import { postulacionesService } from "./postulaciones.service";

export async function apply(req: Request, res: Response) {
  const postulacion = await postulacionesService.apply(req.body, req.user!);
  res.status(201).json({ success: true, data: { postulacion }, message: "Postulación registrada correctamente" });
}

export async function listMine(req: Request, res: Response) {
  const postulaciones = await postulacionesService.listMine(req.user!);
  res.status(200).json({ success: true, data: { postulaciones }, message: "Postulaciones obtenidas" });
}

export async function listByVacante(req: Request, res: Response) {
  const postulaciones = await postulacionesService.listByVacante(req.params.vacanteId as string, req.user!);
  res.status(200).json({ success: true, data: { postulaciones }, message: "Postulaciones obtenidas" });
}

export async function getById(req: Request, res: Response) {
  const postulacion = await postulacionesService.getById(req.params.id as string, req.user!);
  res.status(200).json({ success: true, data: { postulacion }, message: "Postulación obtenida" });
}

export async function getHistorial(req: Request, res: Response) {
  const historial = await postulacionesService.getHistorial(req.params.id as string, req.user!);
  res.status(200).json({ success: true, data: { historial }, message: "Historial obtenido" });
}

export async function changeEstado(req: Request, res: Response) {
  const postulacion = await postulacionesService.changeEstado(req.params.id as string, req.body, req.user!);
  res.status(200).json({ success: true, data: { postulacion }, message: "Estado actualizado correctamente" });
}
