import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { getById, list, remove, updateMe, updateUser } from "./users.controller";
import { listUsersQuerySchema, updateMeSchema, updateUserSchema } from "./users.dto";

const router = Router();
const adminOnly = [authMiddleware, roleMiddleware("ADMIN")];

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Listar usuarios (solo ADMIN)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema: { type: string, enum: [ADMIN, RECLUTADOR, POSTULANTE] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Listado paginado de usuarios }
 *       403: { description: Rol sin permisos }
 */
router.get("/", ...adminOnly, validate(listUsersQuerySchema, "query"), list);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Actualizar el propio perfil (nombre)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string, example: "Juan Pérez" }
 *     responses:
 *       200: { description: Perfil actualizado correctamente }
 *       401: { description: No autenticado }
 */
router.patch("/me", authMiddleware, validate(updateMeSchema), updateMe);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario por id (solo ADMIN)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario obtenido }
 *       403: { description: Rol sin permisos }
 *       404: { description: Usuario no encontrado }
 *   patch:
 *     summary: Actualizar nombre y/o rol de un usuario (solo ADMIN)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario actualizado correctamente }
 *       403: { description: Rol sin permisos }
 *       404: { description: Usuario no encontrado }
 *   delete:
 *     summary: Eliminar un usuario sin actividad registrada (solo ADMIN)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario eliminado correctamente }
 *       403: { description: Rol sin permisos }
 *       404: { description: Usuario no encontrado }
 *       409: { description: El usuario tiene vacantes, postulaciones o historial asociado }
 */
router.get("/:id", ...adminOnly, getById);
router.patch("/:id", ...adminOnly, validate(updateUserSchema), updateUser);
router.delete("/:id", ...adminOnly, remove);

export { router as usersRoutes };
