import { z } from "zod";

const rolEnum = z.enum(["ADMIN", "RECLUTADOR", "POSTULANTE"]);

export const listUsersQuerySchema = z.object({
  rol: rolEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// El rol se excluye intencionalmente: un usuario nunca puede auto-asignarse un rol distinto.
export const updateMeSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
});

export const updateUserSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  rol: rolEnum.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
