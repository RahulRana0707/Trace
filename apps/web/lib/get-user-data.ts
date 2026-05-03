import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export type UserData = {
  id: string
  name: string
  email: string
  image: string | null
}

export const getUserData = async (): Promise<UserData | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

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