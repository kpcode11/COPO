import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'

export const createSession = async (userId: string, ttlHours = 24) => {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000)

  await prisma.session.create({
    data: { token, userId, expiresAt },
  })

  return { token, expiresAt }
}

export const getSessionByToken = async (token: string) => {
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
  if (!session) return null
  if (session.expiresAt < new Date()) return null
  if (!session.user || !session.user.isActive) return null
  return session
}

export const deleteSessionByToken = async (token: string) => {
  await prisma.session.deleteMany({ where: { token } })
}

export const deleteSessionsByUser = async (userId: string) => {
  await prisma.session.deleteMany({ where: { userId } })
}
