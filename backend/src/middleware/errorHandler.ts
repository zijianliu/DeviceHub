import { Request, Response, NextFunction } from 'express'
import { errorResponse } from '../utils/response'

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message)

  if (err.message === '设备不存在' || err.message === '资源不存在') {
    return errorResponse(res, err.message, 404)
  }

  if (err.message === '设备编号已存在') {
    return errorResponse(res, err.message, 400)
  }

  if (
    err.message.includes('不可借用') ||
    err.message.includes('不可归还') ||
    err.message.includes('已有未完成的借用记录') ||
    err.message.includes('预计归还时间必须晚于借用时间')
  ) {
    return errorResponse(res, err.message, 400)
  }

  return errorResponse(res, '服务器内部错误', 500)
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
