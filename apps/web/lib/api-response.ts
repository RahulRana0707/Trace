import { NextResponse } from "next/server"

import { ServerResponseType, type ServerResponse } from "@/types/server"

/** JSON body shape for successful Route Handler responses. */
export type ApiSuccessBody<T> = {
  status: typeof ServerResponseType.SUCCESS
  data: T
}

/** JSON body shape for failed Route Handler responses (matches `ServerResponse`). */
export type ApiErrorBody = ServerResponse & {
  status: typeof ServerResponseType.ERROR
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      status: ServerResponseType.SUCCESS,
      data,
    } satisfies ApiSuccessBody<T>,
    init
  )
}

export function jsonServerError(
  errorMessage: string,
  httpStatus: number,
  data: unknown = null
) {
  return NextResponse.json(
    {
      status: ServerResponseType.ERROR,
      data,
      errorMessage,
    } satisfies ApiErrorBody,
    { status: httpStatus }
  )
}
