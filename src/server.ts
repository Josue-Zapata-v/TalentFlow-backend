import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

app.listen(env.PORT, () => {
  logger.info(`TalentFlow API escuchando en http://localhost:${env.PORT}`);
  logger.info(`Documentación Swagger disponible en http://localhost:${env.PORT}/api/docs`);
});
