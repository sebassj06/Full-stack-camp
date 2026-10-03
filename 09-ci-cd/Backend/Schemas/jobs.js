import * as z from "zod";

const jobSchema = z.object({
  titulo: z
    .string({
      required_error: "El titulo es requerido",
    })
    .min(3, "El titulo debe tener minimo 3 caracteres")
    .max(100)
    .refine((val) => Number.isNaN(Number(val)), {
      message: "No puede ser un numero",
    }),
  empresa: z.string(),
  ubicacion: z.string(),
  descripcion: z.string().optional(),
  data: z.object({
    technology: z.array(z.string()),
    modalidad: z.string(),
    nivel: z.string(),
  }),
});

export function validateJob(input) {
  return jobSchema.safeParse(input);
}

export function validatePartialJob(input) {
  return jobSchema.partial().safeParse(input);
}
