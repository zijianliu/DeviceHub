import { Response } from 'express'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export const successResponse = <T>(res: Response, data: T, message?: string): Response => {
  return res.status(200).json({
    success: true,
    data,
    message,
  })
}

export const errorResponse = (res: Response, message: string, statusCode: number = 400, errors?: string[]): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  })
}

export const notFoundResponse = (res: Response, message: string = '资源不存在'): Response => {
  return errorResponse(res, message, 404)
}

export const validationErrorResponse = (res: Response, errors: string[]): Response => {
  return errorResponse(res, '参数校验失败', 400, errors)
}
