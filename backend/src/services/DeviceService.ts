import { Repository, In, Like } from 'typeorm'
import { Device } from '../entities/Device'
import { DeviceStatus, DeviceCategory, BORROWABLE_STATUSES, StatusTransitionRules } from '../constants'
import { AppDataSource } from '../data-source'
import { OperationLog, OperationType } from '../entities/OperationLog'

export class DeviceService {
  private deviceRepository: Repository<Device>
  private logRepository: Repository<OperationLog>

  constructor() {
    this.deviceRepository = AppDataSource.getRepository(Device)
    this.logRepository = AppDataSource.getRepository(OperationLog)
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      category?: DeviceCategory
      status?: DeviceStatus
      isOverdue?: boolean
      keyword?: string
    }
  ): Promise<{ devices: Device[]; total: number; page: number; pageSize: number }> {
    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.borrowRecords', 'borrowRecords')
      .leftJoinAndSelect('device.operationLogs', 'operationLogs')

    if (filters?.category) {
      queryBuilder.andWhere('device.category = :category', { category: filters.category })
    }

    if (filters?.status) {
      queryBuilder.andWhere('device.status = :status', { status: filters.status })
    }

    if (filters?.keyword) {
      queryBuilder.andWhere('(device.name LIKE :keyword OR device.code LIKE :keyword)', {
        keyword: `%${filters.keyword}%`,
      })
    }

    const [devices, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('device.createdAt', 'DESC')
      .getManyAndCount()

    return {
      devices,
      total,
      page,
      pageSize,
    }
  }

  async findById(id: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { id },
      relations: ['borrowRecords', 'operationLogs'],
      order: {
        borrowRecords: { createdAt: 'DESC' },
        operationLogs: { createdAt: 'DESC' },
      },
    })
  }

  async findByCode(code: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { code },
      relations: ['borrowRecords', 'operationLogs'],
    })
  }

  async create(deviceData: {
    code: string
    name: string
    category: DeviceCategory
    location?: string
    responsiblePerson?: string
    description?: string
  }): Promise<Device> {
    const existingDevice = await this.findByCode(deviceData.code)
    if (existingDevice) {
      throw new Error('设备编号已存在')
    }

    const device = this.deviceRepository.create({
      ...deviceData,
      status: DeviceStatus.AVAILABLE,
    })

    const savedDevice = await this.deviceRepository.save(device)

    await this.createOperationLog(
      savedDevice.id,
      OperationType.CREATE,
      null,
      DeviceStatus.AVAILABLE,
      '系统',
      '创建设备',
      { deviceData }
    )

    return savedDevice
  }

  async update(
    id: string,
    deviceData: Partial<{
      name: string
      category: DeviceCategory
      location: string
      responsiblePerson: string
      description: string
    }>
  ): Promise<Device> {
    const device = await this.findById(id)
    if (!device) {
      throw new Error('设备不存在')
    }

    const updatedDevice = await this.deviceRepository.save({
      ...device,
      ...deviceData,
    })

    await this.createOperationLog(
      device.id,
      OperationType.UPDATE,
      device.status,
      device.status,
      '系统',
      '更新设备信息',
      { deviceData }
    )

    return updatedDevice
  }

  async canTransitionStatus(device: Device, newStatus: DeviceStatus): Promise<boolean> {
    const allowedTransitions = StatusTransitionRules[device.status] || []
    return allowedTransitions.includes(newStatus)
  }

  private async createOperationLog(
    deviceId: string,
    operationType: OperationType,
    fromStatus: DeviceStatus | null,
    toStatus: DeviceStatus | null,
    operator: string | null,
    description: string | null,
    details?: Record<string, any>
  ): Promise<OperationLog> {
    const log = this.logRepository.create({
      deviceId,
      operationType,
      fromStatus,
      toStatus,
      operator,
      description,
      details,
    })
    return this.logRepository.save(log)
  }

  async logOperation(
    deviceId: string,
    operationType: OperationType,
    fromStatus: DeviceStatus | null,
    toStatus: DeviceStatus | null,
    operator: string | null,
    description: string | null,
    details?: Record<string, any>
  ): Promise<OperationLog> {
    return this.createOperationLog(deviceId, operationType, fromStatus, toStatus, operator, description, details)
  }
}
