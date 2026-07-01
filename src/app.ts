import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { apiRateLimiter } from "./middlewares/rateLimiter.middleware";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(apiRateLimiter);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
