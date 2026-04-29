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

export const BORROWABLE_STATUSES = [DeviceStatus.AVAILABLE]

export const RETURNABLE_STATUSES = [DeviceStatus.LENT]

export const StatusTransitionRules: Record<DeviceStatus, DeviceStatus[]> = {
  [DeviceStatus.AVAILABLE]: [DeviceStatus.LENT, DeviceStatus.MAINTENANCE, DeviceStatus.DISABLED],
  [DeviceStatus.LENT]: [DeviceStatus.AVAILABLE, DeviceStatus.MAINTENANCE],
  [DeviceStatus.MAINTENANCE]: [DeviceStatus.AVAILABLE, DeviceStatus.DISABLED],
  [DeviceStatus.DISABLED]: [DeviceStatus.MAINTENANCE],
}
