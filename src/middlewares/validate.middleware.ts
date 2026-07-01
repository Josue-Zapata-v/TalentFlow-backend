import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[part]);

    // En Express 5, req.query es una propiedad de solo lectura (accessor),
    // por lo que no se puede reasignar con "=" como con body/params.
    if (part === "query") {
      Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
    } else {
      req[part] = parsed;
    }

    next();
  };
}
