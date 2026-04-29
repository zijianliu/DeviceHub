import { Router, Request, Response } from 'express'
import { body, query, param, validationResult } from 'express-validator'
import { DeviceService } from '../services/DeviceService'
import { DeviceCategory, DeviceStatus, DeviceStatusLabels, DeviceCategoryLabels } from '../constants'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'
import { BorrowService } from '../services/BorrowService'

const router = Router()
const deviceService = new DeviceService()
const borrowService = new BorrowService()

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category').optional().isIn(Object.values(DeviceCategory)),
    query('status').optional().isIn(Object.values(DeviceStatus)),
    query('isOverdue').optional().isBoolean().toBoolean(),
    query('keyword').optional().trim(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { page = 1, pageSize = 10, category, status, isOverdue, keyword } = req.query as any

    const result = await deviceService.findAll(page, pageSize, {
      category,
      status,
      isOverdue,
      keyword,
    })

    const devicesWithStatusInfo = await Promise.all(
      result.devices.map(async (device) => {
        const activeBorrow = await borrowService.findActiveBorrowByDeviceId(device.id)
        const isOverdue = activeBorrow ? await borrowService.isOverdue(activeBorrow) : false
        const overdueDays = activeBorrow ? await borrowService.getOverdueDays(activeBorrow) : 0

        return {
          ...device,
          statusLabel: DeviceStatusLabels[device.status],
          categoryLabel: DeviceCategoryLabels[device.category],
          isOverdue,
          overdueDays,
          activeBorrow,
        }
      })
    )

    let filteredDevices = devicesWithStatusInfo
    if (isOverdue === true) {
      filteredDevices = devicesWithStatusInfo.filter((d) => d.isOverdue)
    } else if (isOverdue === false) {
      filteredDevices = devicesWithStatusInfo.filter((d) => !d.isOverdue)
    }

    return successResponse(res, {
      devices: filteredDevices,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    })
  })
)

router.get(
  '/categories',
  asyncHandler(async (req: Request, res: Response) => {
    const categories = Object.entries(DeviceCategoryLabels).map(([value, label]) => ({
      value,
      label,
    }))
    return successResponse(res, categories)
  })
)

router.get(
  '/statuses',
  asyncHandler(async (req: Request, res: Response) => {
    const statuses = Object.entries(DeviceStatusLabels).map(([value, label]) => ({
      value,
      label,
    }))
    return successResponse(res, statuses)
  })
)

router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的设备ID')],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { id } = req.params
    const device = await deviceService.findById(id)

    if (!device) {
      return notFoundResponse(res, '设备不存在')
    }

    const activeBorrow = await borrowService.findActiveBorrowByDeviceId(device.id)
    const isOverdue = activeBorrow ? await borrowService.isOverdue(activeBorrow) : false
    const overdueDays = activeBorrow ? await borrowService.getOverdueDays(activeBorrow) : 0

    const sortedBorrowRecords = [...device.borrowRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const sortedOperationLogs = [...device.operationLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return successResponse(res, {
      ...device,
      statusLabel: DeviceStatusLabels[device.status],
      categoryLabel: DeviceCategoryLabels[device.category],
      isOverdue,
      overdueDays,
      activeBorrow,
      borrowRecords: sortedBorrowRecords,
      operationLogs: sortedOperationLogs,
    })
  })
)

router.post(
  '/',
  [
    body('code').isString().trim().notEmpty().withMessage('设备编号不能为空'),
    body('name').isString().trim().notEmpty().withMessage('设备名称不能为空'),
    body('category').isIn(Object.values(DeviceCategory)).withMessage('无效的设备分类'),
    body('location').optional().isString().trim(),
    body('responsiblePerson').optional().isString().trim(),
    body('description').optional().isString().trim(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const deviceData = req.body
    try {
      const device = await deviceService.create(deviceData)
      return successResponse(res, device, '设备创建成功')
    } catch (error: any) {
      return errorResponse(res, error.message, 400)
    }
  })
)

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('无效的设备ID'),
    body('name').optional().isString().trim().notEmpty().withMessage('设备名称不能为空'),
    body('category').optional().isIn(Object.values(DeviceCategory)).withMessage('无效的设备分类'),
    body('location').optional().isString().trim(),
    body('responsiblePerson').optional().isString().trim(),
    body('description').optional().isString().trim(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { id } = req.params
    const deviceData = req.body

    try {
      const device = await deviceService.update(id, deviceData)
      return successResponse(res, device, '设备更新成功')
    } catch (error: any) {
      if (error.message === '设备不存在') {
        return notFoundResponse(res, error.message)
      }
      return errorResponse(res, error.message, 400)
    }
  })
)

router.get(
  '/:id/borrow-records',
  [param('id').isUUID().withMessage('无效的设备ID')],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map((e) => e.msg))
    }

    const { id } = req.params
    const records = await borrowService.findByDeviceId(id)

    const recordsWithOverdueInfo = await Promise.all(
      records.map(async (record) => ({
        ...record,
        isOverdue: await borrowService.isOverdue(record),
        overdueDays: await borrowService.getOverdueDays(record),
      }))
    )

    return successResponse(res, recordsWithOverdueInfo)
  })
)

export default router
