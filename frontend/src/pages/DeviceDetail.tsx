import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Table,
  Timeline,
  Empty,
  message,
  Row,
  Col,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  StopOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { deviceApi } from '../services/api'
import { Device, DeviceStatus, OperationType, OperationTypeLabels } from '../types'
import BorrowModal from '../components/BorrowModal'
import ReturnModal from '../components/ReturnModal'

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState<Device | null>(null)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  const fetchDevice = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await deviceApi.getDevice(id)
      if (response.success && response.data) {
        setDevice(response.data)
      } else {
        message.error(response.message || '获取设备详情失败')
        navigate('/')
      }
    } catch (error) {
      message.error('获取设备详情失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevice()
  }, [id])

  const getStatusTag = (status: DeviceStatus, isOverdue: boolean) => {
    let color = 'default'
    let text = device?.statusLabel || status

    switch (status) {
      case DeviceStatus.AVAILABLE:
        color = 'success'
        break
      case DeviceStatus.LENT:
        color = isOverdue ? 'error' : 'orange'
        break
      case DeviceStatus.MAINTENANCE:
        color = 'warning'
        break
      case DeviceStatus.DISABLED:
        color = 'default'
        break
    }

    return (
      <Tag color={color} icon={isOverdue ? <ExclamationCircleOutlined /> : undefined}>
        {text}
        {isOverdue && ' (逾期)'}
      </Tag>
    )
  }

  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case OperationType.CREATE:
        return <PlusOutlined />
      case OperationType.UPDATE:
        return <EditOutlined />
      case OperationType.BORROW:
        return <ArrowUpOutlined />
      case OperationType.RETURN:
        return <ArrowDownOutlined />
      case OperationType.MAINTENANCE:
        return <ToolOutlined />
      case OperationType.DISABLE:
        return <StopOutlined />
      default:
        return <ClockCircleOutlined />
    }
  }

  const getOperationColor = (type: OperationType) => {
    switch (type) {
      case OperationType.BORROW:
        return 'blue'
      case OperationType.RETURN:
        return 'green'
      case OperationType.MAINTENANCE:
        return 'orange'
      case OperationType.DISABLE:
        return 'red'
      default:
        return 'gray'
    }
  }

  const borrowRecordColumns = [
    {
      title: '借用人',
      dataIndex: 'borrowerName',
      key: 'borrowerName',
    },
    {
      title: '借用时间',
      dataIndex: 'borrowTime',
      key: 'borrowTime',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '预计归还时间',
      dataIndex: 'expectedReturnTime',
      key: 'expectedReturnTime',
      render: (text: string, record: any) => (
        <Space>
          <span>{dayjs(text).format('YYYY-MM-DD HH:mm')}</span>
          {!record.isReturned && record.isOverdue && (
            <Tag color="error" icon={<ExclamationCircleOutlined />}>
              逾期 {record.overdueDays} 天
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '实际归还时间',
      dataIndex: 'actualReturnTime',
      key: 'actualReturnTime',
      render: (text: string | null) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '归还人',
      dataIndex: 'returnerName',
      key: 'returnerName',
      render: (text: string | null) => text || '-',
    },
    {
      title: '状态',
      key: 'recordStatus',
      render: (_: any, record: any) => (
        <Space>
          {record.isReturned ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              已归还
            </Tag>
          ) : record.isOverdue ? (
            <Tag color="error" icon={<ExclamationCircleOutlined />}>
              借用中(逾期)
            </Tag>
          ) : (
            <Tag color="blue" icon={<ClockCircleOutlined />}>
              借用中
            </Tag>
          )}
          {record.isDamaged && <Tag color="warning">损坏</Tag>}
        </Space>
      ),
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (text: string | null) => text || '-',
    },
  ]

  if (!device && !loading) {
    return <Empty description="设备不存在" />
  }

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回设备列表
      </Button>

      <Card loading={loading} extra={
        <Space>
          {device?.status === DeviceStatus.AVAILABLE && (
            <Button type="primary" icon={<ArrowUpOutlined />} onClick={() => setIsBorrowModalOpen(true)}>
              借用设备
            </Button>
          )}
          {device?.status === DeviceStatus.LENT && (
            <Button
              type="primary"
              danger={device?.isOverdue}
              icon={<ArrowDownOutlined />}
              onClick={() => setIsReturnModalOpen(true)}
            >
              归还设备
            </Button>
          )}
        </Space>
      }>
        <Descriptions title="设备基本信息" bordered column={2}>
          <Descriptions.Item label="设备编号">{device?.code}</Descriptions.Item>
          <Descriptions.Item label="设备名称">{device?.name}</Descriptions.Item>
          <Descriptions.Item label="设备分类">
            <Tag>{device?.categoryLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {device && getStatusTag(device.status, device.isOverdue)}
          </Descriptions.Item>
          <Descriptions.Item label="存放位置">{device?.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="负责人">{device?.responsiblePerson || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {device?.createdAt ? dayjs(device.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {device?.updatedAt ? dayjs(device.updatedAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="设备描述" span={2}>
            {device?.description || '-'}
          </Descriptions.Item>
        </Descriptions>

        {device?.activeBorrow && (
          <>
            <Divider />
            <Descriptions title="当前借用信息" bordered column={2}>
              <Descriptions.Item label="借用人">{device.activeBorrow.borrowerName}</Descriptions.Item>
              <Descriptions.Item label="借用时间">
                {dayjs(device.activeBorrow.borrowTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="预计归还时间">
                <Space>
                  <span>{dayjs(device.activeBorrow.expectedReturnTime).format('YYYY-MM-DD HH:mm')}</span>
                  {device.isOverdue && (
                    <Tag color="error" icon={<ExclamationCircleOutlined />}>
                      已逾期 {device.overdueDays} 天
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="用途">{device.activeBorrow.purpose || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="借用记录" loading={loading}>
            {device?.borrowRecords && device.borrowRecords.length > 0 ? (
              <Table
                columns={borrowRecordColumns}
                dataSource={device.borrowRecords}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无借用记录" />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="操作时间线" loading={loading}>
            {device?.operationLogs && device.operationLogs.length > 0 ? (
              <Timeline
                mode="left"
                items={device.operationLogs.map((log) => ({
                  color: getOperationColor(log.operationType),
                  dot: getOperationIcon(log.operationType),
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        <Tag color={getOperationColor(log.operationType)}>
                          {OperationTypeLabels[log.operationType]}
                        </Tag>
                        {log.operator && <span style={{ marginLeft: 8 }}>操作人：{log.operator}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {log.description || '-'}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无操作记录" />
            )}
          </Card>
        </Col>
      </Row>

      <BorrowModal
        open={isBorrowModalOpen}
        device={device}
        onClose={() => setIsBorrowModalOpen(false)}
        onSuccess={fetchDevice}
      />

      <ReturnModal
        open={isReturnModalOpen}
        device={device}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={fetchDevice}
      />
    </div>
  )
}

export default DeviceDetail
