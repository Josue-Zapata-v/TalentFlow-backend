import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  apply,
  changeEstado,
  getById,
  getHistorial,
  listByVacante,
  listMine,
} from "./postulaciones.controller";
import { changeEstadoSchema, createPostulacionSchema } from "./postulaciones.dto";

const router = Router();

/**
 * @openapi
 * /postulaciones:
 *   post:
 *     summary: Postular a una vacante (solo POSTULANTE)
 *     tags: [Postulaciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vacanteId]
 *             properties:
 *               vacanteId: { type: string, format: uuid }
 *               cvUrl: { type: string, example: "https://ejemplo.com/cv.pdf" }
 *               observaciones: { type: string }
 *     responses:
 *       201: { description: Postulación registrada correctamente }
 *       401: { description: No autenticado }
 *       403: { description: Rol sin permisos }
 *       404: { description: Vacante no encontrada }
 *       409: { description: Vacante cerrada o ya postulaste antes }
 */
router.post("/", authMiddleware, roleMiddleware("POSTULANTE"), validate(createPostulacionSchema), apply);

/**
 * @openapi
 * /postulaciones/mias:
 *   get:
 *     summary: Listar mis postulaciones (POSTULANTE)
 *     tags: [Postulaciones]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Postulaciones del usuario autenticado }
 *       401: { description: No autenticado }
 */
router.get("/mias", authMiddleware, roleMiddleware("POSTULANTE"), listMine);

/**
 * @openapi
 * /postulaciones/vacante/{vacanteId}:
 *   get:
 *     summary: Listar postulaciones de una vacante (vista Kanban del reclutador)
 *     tags: [Postulaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vacanteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Postulaciones de la vacante }
 *       403: { description: No es dueño de la vacante }
 *       404: { description: Vacante no encontrada }
 */
router.get("/vacante/:vacanteId", authMiddleware, roleMiddleware("ADMIN", "RECLUTADOR"), listByVacante);

/**
 * @openapi
 * /postulaciones/{id}:
 *   get:
 *     summary: Obtener el detalle de una postulación
 *     tags: [Postulaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Postulación obtenida }
 *       403: { description: Sin permisos sobre esta postulación }
 *       404: { description: Postulación no encontrada }
 */
router.get("/:id", authMiddleware, getById);

/**
 * @openapi
 * /postulaciones/{id}/historial:
 *   get:
 *     summary: Obtener la trazabilidad de cambios de estado de una postulación
 *     tags: [Postulaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Historial de estados obtenido }
 *       403: { description: Sin permisos sobre esta postulación }
 *       404: { description: Postulación no encontrada }
 */
router.get("/:id/historial", authMiddleware, getHistorial);

/**
 * @openapi
 * /postulaciones/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de una postulación (ADMIN o RECLUTADOR dueño de la vacante)
 *     tags: [Postulaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [POSTULADO, EN_REVISION, ENTREVISTA, OFERTA, RECHAZADO, CONTRATADO]
 *     responses:
 *       200: { description: Estado actualizado correctamente, se registra en el historial }
 *       400: { description: La postulación ya tiene ese estado }
 *       403: { description: No es dueño de la vacante }
 *       404: { description: Postulación no encontrada }
 */
router.patch(
  "/:id/estado",
  authMiddleware,
  roleMiddleware("ADMIN", "RECLUTADOR"),
  validate(changeEstadoSchema),
  changeEstado,
);

export { router as postulacionesRoutes };
