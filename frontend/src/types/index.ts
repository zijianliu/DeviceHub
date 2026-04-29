export enum DeviceStatus {
  AVAILABLE = 'available',
  LENT = 'lent',
  MAINTENANCE = 'maintenance',
  DISABLED = 'disabled',
}

export enum DeviceCategory {
  LAPTOP = 'laptop',
  PROJECTOR = 'projector',
  TEST_DEVICE = 'test_device',
  CAMERA = 'camera',
  OTHER = 'other',
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  BORROW = 'borrow',
  RETURN = 'return',
  MAINTENANCE = 'maintenance',
  DISABLE = 'disable',
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface Device {
  id: string
  code: string
  name: string
  category: DeviceCategory
  categoryLabel: string
  status: DeviceStatus
  statusLabel: string
  location: string | null
  responsiblePerson: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  isOverdue: boolean
  overdueDays: number
  activeBorrow: BorrowRecord | null
  borrowRecords: BorrowRecord[]
  operationLogs: OperationLog[]
}

export interface BorrowRecord {
  id: string
  deviceId: string
  borrowerName: string
  borrowTime: string
  expectedReturnTime: string
  actualReturnTime: string | null
  returnerName: string | null
  isReturned: boolean
  isDamaged: boolean
  purpose: string | null
  returnRemark: string | null
  createdAt: string
  updatedAt: string
  isOverdue?: boolean
  overdueDays?: number
}

export interface OperationLog {
  id: string
  deviceId: string
  operationType: OperationType
  fromStatus: DeviceStatus | null
  toStatus: DeviceStatus | null
  operator: string | null
  description: string | null
  details: Record<string, any> | null
  createdAt: string
}

export interface PagedDevices {
  devices: Device[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DeviceFilters {
  category?: DeviceCategory
  status?: DeviceStatus
  isOverdue?: boolean
  keyword?: string
}

export interface BorrowRequest {
  deviceId: string
  borrowerName: string
  borrowTime: string
  expectedReturnTime: string
  purpose?: string
}

export interface ReturnRequest {
  deviceId: string
  returnerName: string
  isDamaged: boolean
  returnRemark?: string
}

export const DeviceStatusLabels: Record<DeviceStatus, string> = {
  [DeviceStatus.AVAILABLE]: '可借',
  [DeviceStatus.LENT]: '借出中',
  [DeviceStatus.MAINTENANCE]: '维修中',
  [DeviceStatus.DISABLED]: '停用中',
}

export const DeviceCategoryLabels: Record<DeviceCategory, string> = {
  [DeviceCategory.LAPTOP]: '笔记本',
  [DeviceCategory.PROJECTOR]: '投影仪',
  [DeviceCategory.TEST_DEVICE]: '测试机',
  [DeviceCategory.CAMERA]: '相机',
  [DeviceCategory.OTHER]: '其他',
}

export const OperationTypeLabels: Record<OperationType, string> = {
  [OperationType.CREATE]: '创建',
  [OperationType.UPDATE]: '更新',
  [OperationType.BORROW]: '借出',
  [OperationType.RETURN]: '归还',
  [OperationType.MAINTENANCE]: '维修',
  [OperationType.DISABLE]: '停用',
}
