import { authClient } from "@/lib/auth-client"
import { ServerResponseType, type ServerResponse } from "@/types/server"

// Plain client-side helpers (not Server Actions) — auth now lives cross-origin
// in packages/backend, so these must run in the browser and let authClient's
// own fetch send/receive the cross-origin session cookie directly. Calling
// these from a Server Action would make the request from the Next.js server
// instead of the browser, which never receives the resulting Set-Cookie.

export type SignInInput = {
  email: string
  password: string
}

export type SignUpInput = {
  name: string
  email: string
  password: string
}

export async function signIn(input: SignInInput): Promise<ServerResponse> {
  try {
    const email = input.email?.trim() ?? ""
    const password = input.password ?? ""

    if (!email || !password) {
      return {
        status: ServerResponseType.ERROR,
        data: null,
        errorMessage: "Email and password are required.",
      }
    }

    const result = await authClient.signIn.email({ email, password })

    if (result.error) {
      return {
        status: ServerResponseType.ERROR,
        data: null,
        errorMessage: result.error.message ?? "Could not sign you in.",
      }
    }

    return {
      status: ServerResponseType.SUCCESS,
      data: result.data,
    }
  } catch (error) {
    console.error("signIn", error)
    return {
      status: ServerResponseType.ERROR,
      data: null,
      errorMessage: "Something went wrong. Please try again.",
    }
  }
}

export async function signUp(input: SignUpInput): Promise<ServerResponse> {
  try {
    const name = input.name?.trim() ?? ""
    const email = input.email?.trim() ?? ""
    const password = input.password ?? ""

    if (!name || !email || !password) {
      return {
        status: ServerResponseType.ERROR,
        data: null,
        errorMessage: "Name, email, and password are required.",
      }
    }

    const result = await authClient.signUp.email({ name, email, password })

    if (result.error) {
      return {
        status: ServerResponseType.ERROR,
        data: null,
        errorMessage: result.error.message ?? "Could not create your account.",
      }
    }

    return {
      status: ServerResponseType.SUCCESS,
      data: result.data,
    }
  } catch (error) {
    console.error("signUp", error)
    return {
      status: ServerResponseType.ERROR,
      data: null,
      errorMessage: "Something went wrong. Please try again.",
    }
  }
}

export async function signOut(): Promise<ServerResponse> {
  try {
    const result = await authClient.signOut()

    if (result.error) {
      return {
        status: ServerResponseType.ERROR,
        data: null,
        errorMessage: result.error.message ?? "Could not sign out.",
      }
    }

    return {
      status: ServerResponseType.SUCCESS,
      data: null,
    }
  } catch (error) {
    console.error("signOut", error)
    return {
      status: ServerResponseType.ERROR,
      data: null,
      errorMessage: "Something went wrong. Please try again.",
    }
  }
}
