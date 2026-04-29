import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Device } from './entities/Device'
import { BorrowRecord } from './entities/BorrowRecord'
import { OperationLog } from './entities/OperationLog'

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './device-hub.db',
  synchronize: true,
  logging: false,
  entities: [Device, BorrowRecord, OperationLog],
  migrations: [],
  subscribers: [],
})
