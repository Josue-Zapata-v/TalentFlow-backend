import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { login, logout, me, refresh, register } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.dto";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario (RECLUTADOR o POSTULANTE)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre: { type: string, example: "Juan Pérez" }
 *               email: { type: string, example: "juan@example.com" }
 *               password: { type: string, example: "password123" }
 *               rol: { type: string, enum: [RECLUTADOR, POSTULANTE], example: "POSTULANTE" }
 *     responses:
 *       201: { description: Usuario creado correctamente }
 *       400: { description: Error de validación }
 *       409: { description: El email ya está registrado }
 */
router.post("/register", authRateLimiter, validate(registerSchema), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "juan@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200: { description: Login exitoso, devuelve accessToken y setea refreshToken en cookie httpOnly }
 *       401: { description: Credenciales inválidas }
 */
router.post("/login", authRateLimiter, validate(loginSchema), login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Renovar el accessToken usando el refreshToken (cookie httpOnly)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token renovado correctamente }
 *       401: { description: Refresh token ausente, inválido o expirado }
 */
router.post("/refresh", refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión (limpia la cookie del refresh token)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Sesión cerrada }
 */
router.post("/logout", logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil del usuario autenticado }
 *       401: { description: No autenticado }
 */
router.get("/me", authMiddleware, me);

export { router as authRoutes };
