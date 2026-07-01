import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors";
import { JwtPayload } from "../shared/utils/jwt.util";

export function roleMiddleware(...allowedRoles: JwtPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}
