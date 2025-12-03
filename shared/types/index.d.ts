export interface Service {
  Address: string
  ServiceAddress: string
  ServicePort: number
  ServiceID: string
  ServiceName: string
  ServiceTags: string[]
}

export interface IError extends Error {
  status: false
  message: string
  status_code: number
  is_operational?: boolean
  validation?: any
}
