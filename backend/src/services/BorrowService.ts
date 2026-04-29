import { Repository, QueryRunner } from 'typeorm'
import { BorrowRecord } from '../entities/BorrowRecord'
import { Device } from '../entities/Device'
import { DeviceStatus, BORROWABLE_STATUSES, RETURNABLE_STATUSES } from '../constants'
import { AppDataSource } from '../data-source'
import { OperationLog, OperationType } from '../entities/OperationLog'
import { DeviceService } from './DeviceService'

export class BorrowService {
  private borrowRepository: Repository<BorrowRecord>
  private deviceRepository: Repository<Device>
  private logRepository: Repository<OperationLog>
  private deviceService: DeviceService

  constructor() {
    this.borrowRepository = AppDataSource.getRepository(BorrowRecord)
    this.deviceRepository = AppDataSource.getRepository(Device)
    this.logRepository = AppDataSource.getRepository(OperationLog)
    this.deviceService = new DeviceService()
  }

  async findActiveBorrowByDeviceId(deviceId: string): Promise<BorrowRecord | null> {
    return this.borrowRepository.findOne({
      where: {
        deviceId,
        isReturned: false,
      },
    })
  }

  async canBorrow(device: Device): Promise<{ can: boolean; reason?: string }> {
    if (!BORROWABLE_STATUSES.includes(device.status)) {
      return { can: false, reason: `设备当前状态不可借用` }
    }

    const activeBorrow = await this.findActiveBorrowByDeviceId(device.id)
    if (activeBorrow) {
      return { can: false, reason: '该设备已有未完成的借用记录' }
    }

    return { can: true }
  }

  async borrow(
    deviceId: string,
    borrowerName: string,
    borrowTime: Date,
    expectedReturnTime: Date,
    purpose?: string
  ): Promise<{ record: BorrowRecord; device: Device }> {
    const device = await this.deviceService.findById(deviceId)
    if (!device) {
      throw new Error('设备不存在')
    }

    const canBorrowResult = await this.canBorrow(device)
    if (!canBorrowResult.can) {
      throw new Error(canBorrowResult.reason)
    }

    if (expectedReturnTime <= borrowTime) {
      throw new Error('预计归还时间必须晚于借用时间')
    }

    const originalStatus = device.status
    const actualDeviceId = device.id

    const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const borrowRecordInsertResult = await queryRunner.manager.insert(BorrowRecord, {
        deviceId: actualDeviceId,
        borrowerName: borrowerName,
        borrowTime: borrowTime,
        expectedReturnTime: expectedReturnTime,
        purpose: purpose || null,
        isReturned: false,
        isDamaged: false,
      })

      const newRecordId = borrowRecordInsertResult.identifiers[0]?.id
      const savedRecord = await queryRunner.manager.findOne(BorrowRecord, {
        where: { id: newRecordId },
      })

      if (!savedRecord) {
        throw new Error('保存借用记录失败')
      }

      device.status = DeviceStatus.LENT
      const updatedDevice = await queryRunner.manager.save(Device, device)

      await queryRunner.manager.insert(OperationLog, {
        deviceId: actualDeviceId,
        operationType: OperationType.BORROW,
        fromStatus: originalStatus,
        toStatus: DeviceStatus.LENT,
        operator: borrowerName,
        description: `设备被${borrowerName}借出`,
        details: {
          borrowTime: borrowTime.toISOString(),
          expectedReturnTime: expectedReturnTime.toISOString(),
          purpose,
        },
      })

      await queryRunner.commitTransaction()

      return { record: savedRecord, device: updatedDevice }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async canReturn(device: Device): Promise<{ can: boolean; reason?: string; activeBorrow?: BorrowRecord }> {
    if (!RETURNABLE_STATUSES.includes(device.status)) {
      return { can: false, reason: `设备当前状态不可归还` }
    }

    const activeBorrow = await this.findActiveBorrowByDeviceId(device.id)
    if (!activeBorrow) {
      return { can: false, reason: '该设备没有未完成的借用记录' }
    }

    return { can: true, activeBorrow }
  }

  async return(
    deviceId: string,
    returnerName: string,
    isDamaged: boolean,
    returnRemark?: string
  ): Promise<{ record: BorrowRecord; device: Device }> {
    const device = await this.deviceService.findById(deviceId)
    if (!device) {
      throw new Error('设备不存在')
    }

    const canReturnResult = await this.canReturn(device)
    if (!canReturnResult.can || !canReturnResult.activeBorrow) {
      throw new Error(canReturnResult.reason)
    }

    const borrowRecord = canReturnResult.activeBorrow
    const originalStatus = device.status
    const actualDeviceId = device.id

    const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      borrowRecord.isReturned = true
      borrowRecord.actualReturnTime = new Date()
      borrowRecord.returnerName = returnerName
      borrowRecord.isDamaged = isDamaged
      borrowRecord.returnRemark = returnRemark || null

      const savedRecord = await queryRunner.manager.save(BorrowRecord, borrowRecord)

      const newStatus = isDamaged ? DeviceStatus.MAINTENANCE : DeviceStatus.AVAILABLE
      device.status = newStatus
      const updatedDevice = await queryRunner.manager.save(Device, device)

      await queryRunner.manager.insert(OperationLog, {
        deviceId: actualDeviceId,
        operationType: isDamaged ? OperationType.MAINTENANCE : OperationType.RETURN,
        fromStatus: originalStatus,
        toStatus: newStatus,
        operator: returnerName,
        description: isDamaged ? `设备归还时损坏，转入维修状态` : `设备已归还`,
        details: {
          borrowRecordId: borrowRecord.id,
          returnTime: new Date().toISOString(),
          isDamaged,
          returnRemark,
        },
      })

      await queryRunner.commitTransaction()

      return { record: savedRecord, device: updatedDevice }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async findByDeviceId(deviceId: string): Promise<BorrowRecord[]> {
    return this.borrowRepository.find({
      where: { deviceId },
      order: { createdAt: 'DESC' },
    })
  }

  async isOverdue(record: BorrowRecord): Promise<boolean> {
    if (record.isReturned || !record.expectedReturnTime) {
      return false
    }
    const now = new Date()
    return now > record.expectedReturnTime
  }

  async getOverdueDays(record: BorrowRecord): Promise<number> {
    if (!(await this.isOverdue(record))) {
      return 0
    }
    const now = new Date()
    const diff = now.getTime() - record.expectedReturnTime!.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
}
