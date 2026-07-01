import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const modulesGlob = path.join(__dirname, "..", "modules", "**", "*.routes.{ts,js}");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TalentFlow API",
      version: "1.0.0",
      description: "API REST del sistema de reclutamiento (ATS) TalentFlow",
    },
    servers: [{ url: "/api", description: "Base path de la API" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [modulesGlob],
});

export { swaggerSpec };
