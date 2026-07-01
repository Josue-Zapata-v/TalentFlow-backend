import { z } from "zod";

const modalidadEnum = z.enum(["REMOTO", "PRESENCIAL", "HIBRIDO"]);
const estadoEnum = z.enum(["ABIERTA", "CERRADA", "BORRADOR"]);

export const createVacanteSchema = z.object({
  titulo: z.string().trim().min(5, "El título debe tener al menos 5 caracteres"),
  descripcion: z.string().trim().min(20, "La descripción debe tener al menos 20 caracteres"),
  requisitos: z.string().trim().min(10, "Los requisitos deben tener al menos 10 caracteres"),
  ubicacion: z.string().trim().min(2, "La ubicación es obligatoria"),
  modalidad: modalidadEnum,
  salarioRango: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
  estado: estadoEnum.default("BORRADOR"),
});

export const updateVacanteSchema = createVacanteSchema.partial();

export const publicListQuerySchema = z.object({
  ubicacion: z.string().trim().optional(),
  modalidad: modalidadEnum.optional(),
  categoria: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const manageListQuerySchema = publicListQuerySchema.extend({
  estado: estadoEnum.optional(),
});

export type CreateVacanteInput = z.infer<typeof createVacanteSchema>;
export type UpdateVacanteInput = z.infer<typeof updateVacanteSchema>;
export type PublicListQuery = z.infer<typeof publicListQuerySchema>;
export type ManageListQuery = z.infer<typeof manageListQuerySchema>;
