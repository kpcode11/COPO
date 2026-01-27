import { prisma } from './prisma'

export const createAudit = async (userId: string, action: string, entity: string, entityId: string, details?: string) => {
  return prisma.auditLog.create({ data: { userId, action, entity, entityId, details } })
}
