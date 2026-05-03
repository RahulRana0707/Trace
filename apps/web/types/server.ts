export enum ServerResponseType {
  SUCCESS = "success",
  ERROR = "error",
}

export type ServerResponse = {
  status: ServerResponseType
  data: unknown
  errorMessage?: string
}
