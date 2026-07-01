import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../shared/errors";
import { verifyAccessToken } from "../shared/utils/jwt.util";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token de acceso no proporcionado");
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Token de acceso inválido o expirado");
  }

  next();
}
