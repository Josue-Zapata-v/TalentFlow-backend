import { Request, Response } from "express";
import { UserFilters } from "../../interfaces/user-repository.interface";
import { usersService } from "./users.service";

export async function list(req: Request, res: Response) {
  const result = await usersService.list(req.query as unknown as UserFilters);
  res.status(200).json({
    success: true,
    data: {
      users: result.data,
      pagination: { total: result.total, page: result.page, limit: result.limit },
    },
    message: "Usuarios obtenidos",
  });
}

export async function getById(req: Request, res: Response) {
  const user = await usersService.getPublicById(req.params.id as string);
  res.status(200).json({ success: true, data: { user }, message: "Usuario obtenido" });
}

export async function updateMe(req: Request, res: Response) {
  const user = await usersService.updateOwnProfile(req.user!.sub, req.body);
  res.status(200).json({ success: true, data: { user }, message: "Perfil actualizado correctamente" });
}

export async function updateUser(req: Request, res: Response) {
  const user = await usersService.updateAsAdmin(req.params.id as string, req.body);
  res.status(200).json({ success: true, data: { user }, message: "Usuario actualizado correctamente" });
}

export async function remove(req: Request, res: Response) {
  await usersService.remove(req.params.id as string);
  res.status(200).json({ success: true, data: null, message: "Usuario eliminado correctamente" });
}
