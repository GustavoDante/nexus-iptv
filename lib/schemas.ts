import { z } from "zod";

export const LoginSchema = z.object({
  dns: z.string().url({ message: "URL do servidor inválida" }),
  username: z.string().min(1, { message: "Usuário é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
  remember: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
