import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Device } from './Device'

@Entity()
export class BorrowRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  deviceId: string

  @Column({ type: 'varchar' })
  borrowerName: string

  @Column({ type: 'datetime' })
  borrowTime: Date

  @Column({ type: 'datetime' })
  expectedReturnTime: Date

  @Column({ nullable: true, type: 'datetime' })
  actualReturnTime: Date | null

  @Column({ nullable: true, type: 'varchar' })
  returnerName: string | null

  @Column({ type: 'boolean', default: false })
  isReturned: boolean

  @Column({ type: 'boolean', default: false })
  isDamaged: boolean

  @Column({ nullable: true, type: 'text' })
  purpose: string | null

  @Column({ nullable: true, type: 'text' })
  returnRemark: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Device, (device) => device.borrowRecords)
  @JoinColumn({ name: 'deviceId' })
  device: Device

  isOverdue(): boolean {
    if (this.isReturned || !this.expectedReturnTime) {
      return false
    }
    const now = new Date()
    return now > this.expectedReturnTime
  }

  getOverdueDays(): number {
    if (!this.isOverdue()) {
      return 0
    }
    const now = new Date()
    const diff = now.getTime() - this.expectedReturnTime!.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
}
