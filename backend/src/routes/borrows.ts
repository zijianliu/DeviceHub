import { Router, Request, Response } from 'express'
import { body, param, validationResult } from 'express-validator'
import { DeviceService } from '../services/DeviceService'
import { BorrowService } from '../services/BorrowService'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'
import { DeviceStatusLabels } from '../constants'

const router = Router()
const deviceService = new DeviceService()
const borrowService = new BorrowService()

router.post(
  '/borrow',
  [
    body('deviceId').isUUID().withMessage('无效的设备ID'),
    body('borrowerName').isString().trim().notEmpty().withMessage('借用人不能为空'),
    body('borrowTime').isISO8601().withMessage('借用时间格式无效'),
    body('expectedReturnTime').isISO8601().withMessage('预计归还时间格式无效'),
    body('purpose').optional().isString().trim(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { deviceId, borrowerName, borrowTime, expectedReturnTime, purpose } = req.body

    try {
      const result = await borrowService.borrow(
        deviceId,
        borrowerName,
        new Date(borrowTime),
        new Date(expectedReturnTime),
        purpose
      )

      return successResponse(
        res,
        {
          record: result.record,
          device: {
            ...result.device,
            statusLabel: DeviceStatusLabels[result.device.status],
          },
        },
        '借用成功'
      )
    } catch (error: any) {
      if (error.message === '设备不存在') {
        return notFoundResponse(res, error.message)
      }
      return errorResponse(res, error.message, 400)
    }
  })
)

router.post(
  '/return',
  [
    body('deviceId').isUUID().withMessage('无效的设备ID'),
    body('returnerName').isString().trim().notEmpty().withMessage('归还人不能为空'),
    body('isDamaged').isBoolean().withMessage('设备损坏状态必须是布尔值'),
    body('returnRemark').optional().isString().trim(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { deviceId, returnerName, isDamaged, returnRemark } = req.body

    try {
      const result = await borrowService.return(deviceId, returnerName, isDamaged, returnRemark)

      return successResponse(
        res,
        {
          record: result.record,
          device: {
            ...result.device,
            statusLabel: DeviceStatusLabels[result.device.status],
          },
        },
        isDamaged ? '设备归还，已转入维修状态' : '归还成功'
      )
    } catch (error: any) {
      if (error.message === '设备不存在') {
        return notFoundResponse(res, error.message)
      }
      return errorResponse(res, error.message, 400)
    }
  })
)

router.get(
  '/check-borrowable/:deviceId',
  [param('deviceId').isUUID().withMessage('无效的设备ID')],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { deviceId } = req.params
    const device = await deviceService.findById(deviceId)

    if (!device) {
      return notFoundResponse(res, '设备不存在')
    }

    const result = await borrowService.canBorrow(device)
    return successResponse(res, result)
  })
)

router.get(
  '/check-returnable/:deviceId',
  [param('deviceId').isUUID().withMessage('无效的设备ID')],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { deviceId } = req.params
    const device = await deviceService.findById(deviceId)

    if (!device) {
      return notFoundResponse(res, '设备不存在')
    }

    const result = await borrowService.canReturn(device)
    return successResponse(res, {
      can: result.can,
      reason: result.reason,
      activeBorrow: result.activeBorrow
        ? {
            ...result.activeBorrow,
            isOverdue: await borrowService.isOverdue(result.activeBorrow),
            overdueDays: await borrowService.getOverdueDays(result.activeBorrow),
          }
        : null,
    })
  })
)

router.get(
  '/active/:deviceId',
  [param('deviceId').isUUID().withMessage('无效的设备ID')],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { deviceId } = req.params
    const record = await borrowService.findActiveBorrowByDeviceId(deviceId)

    if (!record) {
      return successResponse(res, null, '该设备没有未完成的借用记录')
    }

    return successResponse(res, {
      ...record,
      isOverdue: await borrowService.isOverdue(record),
      overdueDays: await borrowService.getOverdueDays(record),
    })
  })
)

export default router
