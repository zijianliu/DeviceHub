import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { DeviceStatus, DeviceCategory } from '../constants'
import { BorrowRecord } from './BorrowRecord'
import { OperationLog } from './OperationLog'

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, type: 'varchar' })
  code: string

  @Column({ type: 'varchar' })
  name: string

  @Column({
    type: 'simple-enum',
    enum: DeviceCategory,
    default: DeviceCategory.OTHER,
  })
  category: DeviceCategory

  @Column({
    type: 'simple-enum',
    enum: DeviceStatus,
    default: DeviceStatus.AVAILABLE,
  })
  status: DeviceStatus

  @Column({ nullable: true, type: 'varchar' })
  location: string | null

  @Column({ nullable: true, type: 'varchar' })
  responsiblePerson: string | null

  @Column({ nullable: true, type: 'text' })
  description: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => BorrowRecord, (record) => record.device)
  borrowRecords: BorrowRecord[]

  @OneToMany(() => OperationLog, (log) => log.device)
  operationLogs: OperationLog[]
}
