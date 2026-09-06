import { getServerSession } from "@/lib/get-server-session"

export type UserData = {
  id: string
  name: string
  email: string
  image: string | null
}

export const getUserData = async (): Promise<UserData | null> => {
  const session = await getServerSession()

  if (!session) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  }
}