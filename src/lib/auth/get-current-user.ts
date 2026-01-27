import { getSessionByToken } from './session'

export const getCurrentUser = async (req: Request) => {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|; )session=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  const session = await getSessionByToken(token)
  if (!session) return null
  return session.user
}
