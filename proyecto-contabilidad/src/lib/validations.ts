import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre es muy largo')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'El nombre solo puede contener letras y espacios'),
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
  date: z.string().min(1, 'La fecha es requerida'),
  performed_by: z.string().min(1, 'El usuario que realizó la transacción es requerido'),
})

export const incomeSchema = z.object({
  description: z.string().optional(),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  category: z.string().min(1, 'La categoría es requerida'),
  income_date: z.string().min(1, 'La fecha es requerida'),
  performed_by: z.string().min(1, 'El usuario que realizó la transacción es requerido'),
}).refine((data) => {
  if (data.category === 'Otros') {
    return data.description && data.description.trim().length > 0
  }
  return true
}, {
  message: 'La descripción es requerida cuando la categoría es "Otros"',
  path: ['description'],
})

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  expense_date: z.string().min(1, 'La fecha es requerida'),
  performed_by: z.string().min(1, 'El usuario que realizó la transacción es requerido'),
}).refine((data) => {
  if (data.category === 'Otros') {
    return data.description && data.description.trim().length > 0
  }
  // Para otras categorías, la descripción sigue siendo requerida
  return data.description && data.description.trim().length > 0
}, {
  message: 'La descripción es requerida',
  path: ['description'],
})

export const joinProjectSchema = z.object({
  inviteCode: z.string().length(8, 'El código de invitación debe tener 8 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type BalanceFormData = z.infer<typeof balanceSchema>
export type IncomeFormData = z.infer<typeof incomeSchema>
export type ExpenseFormData = z.infer<typeof expenseSchema>
export type JoinProjectFormData = z.infer<typeof joinProjectSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
