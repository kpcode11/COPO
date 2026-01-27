import { z } from 'zod'

export const createAuditSchema = z.object({
  userId: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  details: z.string().optional(),
})
