import { z } from "zod";

export const createPostulacionSchema = z.object({
  vacanteId: z.string().uuid("vacanteId debe ser un UUID válido"),
  cvUrl: z.string().trim().url("cvUrl debe ser una URL válida").optional(),
  observaciones: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});

export const changeEstadoSchema = z.object({
  estado: z.enum(["POSTULADO", "EN_REVISION", "ENTREVISTA", "OFERTA", "RECHAZADO", "CONTRATADO"]),
});

export type CreatePostulacionInput = z.infer<typeof createPostulacionSchema>;
export type ChangeEstadoInput = z.infer<typeof changeEstadoSchema>;
