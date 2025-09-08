import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().optional(),
  currency: z.enum(['COP', 'AUD']).default('COP'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const projectSchema = z.object({
  name: z.string().min(2, 'El nombre del proyecto debe tener al menos 2 caracteres'),
  description: z.string().optional(),
})

export const balanceSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  description: z.string().optional(),
})

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  description: z.string().min(1, 'La descripción es requerida'),
  category: z.string().optional(),
})

export const joinProjectSchema = z.object({
  inviteCode: z.string().length(8, 'El código de invitación debe tener 8 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type BalanceFormData = z.infer<typeof balanceSchema>
export type ExpenseFormData = z.infer<typeof expenseSchema>
export type JoinProjectFormData = z.infer<typeof joinProjectSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
