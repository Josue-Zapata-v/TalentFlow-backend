import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  create,
  getManageById,
  getPublicBySlug,
  listManage,
  listPublic,
  remove,
  update,
} from "./vacantes.controller";
import {
  createVacanteSchema,
  manageListQuerySchema,
  publicListQuerySchema,
  updateVacanteSchema,
} from "./vacantes.dto";

const router = Router();
const canManage = [authMiddleware, roleMiddleware("ADMIN", "RECLUTADOR")];

/**
 * @openapi
 * /vacantes:
 *   get:
 *     summary: Listar vacantes públicas (solo estado ABIERTA)
 *     tags: [Vacantes]
 *     parameters:
 *       - in: query
 *         name: ubicacion
 *         schema: { type: string }
 *       - in: query
 *         name: modalidad
 *         schema: { type: string, enum: [REMOTO, PRESENCIAL, HIBRIDO] }
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Listado paginado de vacantes abiertas }
 *   post:
 *     summary: Crear una vacante (ADMIN o RECLUTADOR)
 *     tags: [Vacantes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, descripcion, requisitos, ubicacion, modalidad]
 *             properties:
 *               titulo: { type: string, example: "Desarrollador Backend Node.js" }
 *               descripcion: { type: string }
 *               requisitos: { type: string }
 *               ubicacion: { type: string, example: "Lima, Perú" }
 *               modalidad: { type: string, enum: [REMOTO, PRESENCIAL, HIBRIDO] }
 *               salarioRango: { type: string, example: "S/ 3000 - S/ 4500" }
 *               categoria: { type: string, example: "Backend" }
 *               estado: { type: string, enum: [ABIERTA, CERRADA, BORRADOR], default: BORRADOR }
 *     responses:
 *       201: { description: Vacante creada correctamente }
 *       401: { description: No autenticado }
 *       403: { description: Rol sin permisos }
 */
router.get("/", validate(publicListQuerySchema, "query"), listPublic);
router.post("/", ...canManage, validate(createVacanteSchema), create);

/**
 * @openapi
 * /vacantes/manage/list:
 *   get:
 *     summary: Listar vacantes propias (RECLUTADOR) o todas (ADMIN), cualquier estado
 *     tags: [Vacantes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Listado paginado de vacantes }
 *       401: { description: No autenticado }
 *       403: { description: Rol sin permisos }
 */
router.get("/manage/list", ...canManage, validate(manageListQuerySchema, "query"), listManage);

/**
 * @openapi
 * /vacantes/manage/{id}:
 *   get:
 *     summary: Obtener una vacante por id (cualquier estado) para gestión
 *     tags: [Vacantes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vacante obtenida }
 *       403: { description: No es dueño de la vacante }
 *       404: { description: Vacante no encontrada }
 *   patch:
 *     summary: Actualizar una vacante propia (o cualquiera si es ADMIN)
 *     tags: [Vacantes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vacante actualizada correctamente }
 *       403: { description: No es dueño de la vacante }
 *       404: { description: Vacante no encontrada }
 *   delete:
 *     summary: Eliminar una vacante propia sin postulaciones (o cualquiera si es ADMIN)
 *     tags: [Vacantes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vacante eliminada correctamente }
 *       403: { description: No es dueño de la vacante }
 *       404: { description: Vacante no encontrada }
 *       409: { description: La vacante tiene postulaciones y no puede eliminarse }
 */
router.get("/manage/:id", ...canManage, getManageById);
router.patch("/manage/:id", ...canManage, validate(updateVacanteSchema), update);
router.delete("/manage/:id", ...canManage, remove);

/**
 * @openapi
 * /vacantes/{slug}:
 *   get:
 *     summary: Obtener el detalle público de una vacante por slug (solo ABIERTA)
 *     tags: [Vacantes]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vacante obtenida }
 *       404: { description: Vacante no encontrada }
 */
router.get("/:slug", getPublicBySlug);

export { router as vacantesRoutes };
