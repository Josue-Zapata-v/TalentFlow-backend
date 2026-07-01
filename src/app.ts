import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { apiRateLimiter } from "./middlewares/rateLimiter.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { postulacionesRoutes } from "./modules/postulaciones/postulaciones.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { vacantesRoutes } from "./modules/vacantes/vacantes.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(apiRateLimiter);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/vacantes", vacantesRoutes);
app.use("/api/postulaciones", postulacionesRoutes);
app.use("/api/users", usersRoutes);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: "ok" }, message: "TalentFlow API operativa" });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Ruta no encontrada" },
  });
});

app.use(errorMiddleware);

export { app };
