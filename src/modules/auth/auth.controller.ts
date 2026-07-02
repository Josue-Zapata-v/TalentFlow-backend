import { Request, Response } from "express";
import ms from "ms";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../shared/errors";
import { usersService } from "../users/users.service";
import { toPublicUser } from "../users/users.types";
import { authService } from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: ms(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export async function register(req: Request, res: Response) {
  const { refreshToken, ...result } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ success: true, data: result, message: "Usuario registrado correctamente" });
}

export async function login(req: Request, res: Response) {
  const { refreshToken, ...result } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: result, message: "Inicio de sesión exitoso" });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedError("Refresh token no proporcionado");
  }

  const { refreshToken, ...result } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: result, message: "Token renovado" });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
  });
  res.status(200).json({ success: true, data: null, message: "Sesión cerrada" });
}

export async function me(req: Request, res: Response) {
  const user = await usersService.findById(req.user!.sub);
  if (!user) {
    throw new UnauthorizedError("El usuario ya no existe");
  }

  res.status(200).json({ success: true, data: { user: toPublicUser(user) }, message: "Usuario autenticado" });
}
