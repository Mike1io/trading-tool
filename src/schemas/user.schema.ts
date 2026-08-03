import { z } from 'zod';
import { Role } from '@prisma/client';

export const UpdateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const UpdateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    role: z.nativeEnum(Role),
  }),
});

export const ListUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>['body'];
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>['body'];
