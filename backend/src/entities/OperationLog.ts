import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Device } from './Device'
import { DeviceStatus } from '../constants'

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  BORROW = 'borrow',
  RETURN = 'return',
  MAINTENANCE = 'maintenance',
  DISABLE = 'disable',
}

@Entity()
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  deviceId: string

  @Column({
    type: 'simple-enum',
    enum: OperationType,
  })
  operationType: OperationType

  @Column({ nullable: true, type: 'simple-enum', enum: DeviceStatus })
  fromStatus: DeviceStatus | null

  @Column({ nullable: true, type: 'simple-enum', enum: DeviceStatus })
  toStatus: DeviceStatus | null

  @Column({ nullable: true, type: 'varchar' })
  operator: string | null

  @Column({ nullable: true, type: 'text' })
  description: string | null

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any> | null

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Device, (device) => device.operationLogs)
  @JoinColumn({ name: 'deviceId' })
  device: Device
}
