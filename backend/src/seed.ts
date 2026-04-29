import 'reflect-metadata'
import { AppDataSource } from './data-source'
import { Device } from './entities/Device'
import { BorrowRecord } from './entities/BorrowRecord'
import { OperationLog, OperationType } from './entities/OperationLog'
import { DeviceStatus, DeviceCategory } from './constants'

const seedData = async () => {
  await AppDataSource.initialize()
  console.log('数据库连接成功，开始初始化数据...')

  const deviceRepository = AppDataSource.getRepository(Device)
  const borrowRepository = AppDataSource.getRepository(BorrowRecord)
  const logRepository = AppDataSource.getRepository(OperationLog)

  const existingDevices = await deviceRepository.find()
  if (existingDevices.length > 0) {
    console.log('数据库已有数据，跳过初始化')
    await AppDataSource.destroy()
    return
  }

  const now = new Date()

  const devices = [
    {
      code: 'LAP-001',
      name: 'MacBook Pro 14寸',
      category: DeviceCategory.LAPTOP,
      status: DeviceStatus.AVAILABLE,
      location: '设备仓库A区',
      responsiblePerson: '张小明',
      description: 'M3 Pro芯片，16GB内存，用于开发测试',
    },
    {
      code: 'LAP-002',
      name: 'ThinkPad X1 Carbon',
      category: DeviceCategory.LAPTOP,
      status: DeviceStatus.LENT,
      location: '',
      responsiblePerson: '李小红',
      description: 'i7处理器，用于演示和会议',
    },
    {
      code: 'PRO-001',
      name: 'Epson CB-X50 投影仪',
      category: DeviceCategory.PROJECTOR,
      status: DeviceStatus.AVAILABLE,
      location: '设备仓库B区',
      responsiblePerson: '王大伟',
      description: '3600流明，支持无线投屏',
    },
    {
      code: 'PRO-002',
      name: 'Sony VPL-CH378 投影仪',
      category: DeviceCategory.PROJECTOR,
      status: DeviceStatus.MAINTENANCE,
      location: '维修室',
      responsiblePerson: '赵小丽',
      description: '5000流明，灯泡更换中',
    },
    {
      code: 'TES-001',
      name: 'iPhone 15 Pro',
      category: DeviceCategory.TEST_DEVICE,
      status: DeviceStatus.AVAILABLE,
      location: '测试设备柜',
      responsiblePerson: '周小杰',
      description: '测试机，256GB，系统版本17.0',
    },
    {
      code: 'TES-002',
      name: 'Samsung Galaxy S24',
      category: DeviceCategory.TEST_DEVICE,
      status: DeviceStatus.LENT,
      location: '',
      responsiblePerson: '吴小芳',
      description: '测试机，512GB，系统版本14',
    },
    {
      code: 'TES-003',
      name: 'iPad Pro 12.9寸',
      category: DeviceCategory.TEST_DEVICE,
      status: DeviceStatus.AVAILABLE,
      location: '测试设备柜',
      responsiblePerson: '郑大强',
      description: '测试机，M2芯片，1TB',
    },
    {
      code: 'CAM-001',
      name: 'Canon EOS R5',
      category: DeviceCategory.CAMERA,
      status: DeviceStatus.AVAILABLE,
      location: '设备仓库C区',
      responsiblePerson: '林小美',
      description: '全画幅微单，8K视频',
    },
    {
      code: 'CAM-002',
      name: 'Sony A7S III',
      category: DeviceCategory.CAMERA,
      status: DeviceStatus.DISABLED,
      location: '设备仓库C区',
      responsiblePerson: '黄小华',
      description: '已损坏，待报废处理',
    },
    {
      code: 'OTH-001',
      name: 'DJI Osmo Mobile 6',
      category: DeviceCategory.OTHER,
      status: DeviceStatus.AVAILABLE,
      location: '设备仓库D区',
      responsiblePerson: '何小强',
      description: '手机云台稳定器',
    },
  ]

  const savedDevices = await deviceRepository.save(
    devices.map((d) => deviceRepository.create(d))
  )
  console.log(`创建设备: ${savedDevices.length} 台`)

  const laptop2 = savedDevices.find((d) => d.code === 'LAP-002')
  if (laptop2) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const activeBorrow1 = borrowRepository.create({
      deviceId: laptop2.id,
      borrowerName: '李小红',
      borrowTime: yesterday,
      expectedReturnTime: tomorrow,
      isReturned: false,
      purpose: '客户演示使用',
    })
    await borrowRepository.save(activeBorrow1)
    console.log('创建 MacBook Pro 借用记录')
  }

  const tes2 = savedDevices.find((d) => d.code === 'TES-002')
  if (tes2) {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const overdueBorrow = borrowRepository.create({
      deviceId: tes2.id,
      borrowerName: '吴小芳',
      borrowTime: twoDaysAgo,
      expectedReturnTime: oneDayAgo,
      isReturned: false,
      purpose: 'App测试使用',
    })
    await borrowRepository.save(overdueBorrow)
    console.log('创建 Samsung 逾期借用记录')
  }

  const completedDevice = savedDevices.find((d) => d.code === 'LAP-001')
  if (completedDevice) {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    const completedBorrow = borrowRepository.create({
      deviceId: completedDevice.id,
      borrowerName: '陈经理',
      borrowTime: threeDaysAgo,
      expectedReturnTime: twoDaysAgo,
      actualReturnTime: twoDaysAgo,
      returnerName: '陈经理',
      isReturned: true,
      isDamaged: false,
      purpose: '出差使用',
      returnRemark: '设备完好',
    })
    await borrowRepository.save(completedBorrow)
    console.log('创建已完成借用记录')
  }

  for (const device of savedDevices) {
    const log = logRepository.create({
      deviceId: device.id,
      operationType: OperationType.CREATE,
      fromStatus: null,
      toStatus: device.status,
      operator: '系统',
      description: '系统初始化创建设备',
      details: {
        code: device.code,
        name: device.name,
        category: device.category,
      },
    })
    await logRepository.save(log)
  }
  console.log(`创建操作日志: ${savedDevices.length} 条`)

  console.log('')
  console.log('========================================')
  console.log('数据初始化完成！')
  console.log('========================================')
  console.log('')
  console.log('初始化设备状态汇总:')
  console.log(`- 可借: ${savedDevices.filter((d) => d.status === DeviceStatus.AVAILABLE).length} 台`)
  console.log(`- 借出中: ${savedDevices.filter((d) => d.status === DeviceStatus.LENT).length} 台 (含1台逾期)`)
  console.log(`- 维修中: ${savedDevices.filter((d) => d.status === DeviceStatus.MAINTENANCE).length} 台`)
  console.log(`- 停用中: ${savedDevices.filter((d) => d.status === DeviceStatus.DISABLED).length} 台`)
  console.log('')
  console.log('可用于测试的设备:')
  console.log('- MacBook Pro 14寸 (可借) - 可测试借用流程')
  console.log('- ThinkPad X1 Carbon (借出中) - 可测试归还流程')
  console.log('- Samsung Galaxy S24 (借出中-逾期) - 可测试逾期状态')
  console.log('- Sony VPL-CH378 (维修中) - 可测试不可借用状态')
  console.log('')

  await AppDataSource.destroy()
}

seedData().catch((error) => {
  console.error('初始化数据失败:', error)
  process.exit(1)
})
