import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Space,
  Card,
  Row,
  Col,
  Modal,
  Form,
  message,
  Popconfirm,
  DatePicker,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { deviceApi, borrowApi } from '../services/api'
import {
  Device,
  DeviceStatus,
  DeviceCategory,
  DeviceFilters,
  DeviceStatusLabels,
  DeviceCategoryLabels,
} from '../types'
import BorrowModal from '../components/BorrowModal'
import ReturnModal from '../components/ReturnModal'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const DeviceList: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<DeviceFilters>({})
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [statuses, setStatuses] = useState<{ value: string; label: string }[]>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await deviceApi.getDevices(page, pageSize, filters)
      if (response.success && response.data) {
        setDevices(response.data.devices)
        setTotal(response.data.total)
      } else {
        message.error(response.message || '获取设备列表失败')
      }
    } catch (error) {
      message.error('获取设备列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await deviceApi.getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('获取分类失败')
    }
  }

  const fetchStatuses = async () => {
    try {
      const response = await deviceApi.getStatuses()
      if (response.success && response.data) {
        setStatuses(response.data)
      }
    } catch (error) {
      console.error('获取状态失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, filters])

  useEffect(() => {
    fetchCategories()
    fetchStatuses()
  }, [])

  const handleSearch = (value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, keyword: value || undefined }))
  }

  const handleCategoryChange = (value: DeviceCategory | undefined) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, category: value }))
  }

  const handleStatusChange = (value: DeviceStatus | undefined) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, status: value }))
  }

  const handleOverdueChange = (value: boolean | undefined) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, isOverdue: value }))
  }

  const handleReset = () => {
    setPage(1)
    setFilters({})
  }

  const handleCreateDevice = async (values: any) => {
    try {
      const response = await deviceApi.createDevice({
        ...values,
        location: values.location || undefined,
        responsiblePerson: values.responsiblePerson || undefined,
        description: values.description || undefined,
      })
      if (response.success) {
        message.success('设备创建成功')
        setIsCreateModalOpen(false)
        form.resetFields()
        fetchData()
      } else {
        message.error(response.message || '创建设备失败')
      }
    } catch (error) {
      message.error('创建设备失败')
    }
  }

  const handleEditDevice = async (values: any) => {
    if (!selectedDevice) return

    try {
      const response = await deviceApi.updateDevice(selectedDevice.id, {
        ...values,
        location: values.location || undefined,
        responsiblePerson: values.responsiblePerson || undefined,
        description: values.description || undefined,
      })
      if (response.success) {
        message.success('设备更新成功')
        setIsEditModalOpen(false)
        form.resetFields()
        setSelectedDevice(null)
        fetchData()
      } else {
        message.error(response.message || '更新设备失败')
      }
    } catch (error) {
      message.error('更新设备失败')
    }
  }

  const openEditModal = (device: Device) => {
    setSelectedDevice(device)
    form.setFieldsValue({
      name: device.name,
      category: device.category,
      location: device.location,
      responsiblePerson: device.responsiblePerson,
      description: device.description,
    })
    setIsEditModalOpen(true)
  }

  const openBorrowModal = (device: Device) => {
    setSelectedDevice(device)
    setIsBorrowModalOpen(true)
  }

  const openReturnModal = (device: Device) => {
    setSelectedDevice(device)
    setIsReturnModalOpen(true)
  }

  const getStatusTag = (status: DeviceStatus, isOverdue: boolean) => {
    let color = 'default'
    let text = DeviceStatusLabels[status]

    switch (status) {
      case DeviceStatus.AVAILABLE:
        color = 'success'
        break
      case DeviceStatus.LENT:
        color = isOverdue ? 'error' : 'orange'
        text = isOverdue ? '逾期' : text
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

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '分类',
      dataIndex: 'categoryLabel',
      key: 'categoryLabel',
      width: 100,
      render: (text: string, record: Device) => (
        <Tag>{text}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: DeviceStatus, record: Device) => getStatusTag(status, record.isOverdue),
    },
    {
      title: '当前位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (text: string | null) => text || '-',
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 100,
      render: (text: string | null) => text || '-',
    },
    {
      title: '当前借用人',
      key: 'borrower',
      width: 100,
      render: (_: any, record: Device) => record.activeBorrow?.borrowerName || '-',
    },
    {
      title: '预计归还时间',
      key: 'expectedReturnTime',
      width: 170,
      render: (_: any, record: Device) =>
        record.activeBorrow
          ? dayjs(record.activeBorrow.expectedReturnTime).format('YYYY-MM-DD HH:mm')
          : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_: any, record: Device) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/devices/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          {record.status === DeviceStatus.AVAILABLE && (
            <Button
              type="primary"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => openBorrowModal(record)}
            >
              借用
            </Button>
          )}
          {record.status === DeviceStatus.LENT && (
            <Button
              type="primary"
              size="small"
              danger={record.isOverdue}
              icon={<ArrowDownOutlined />}
              onClick={() => openReturnModal(record)}
            >
              归还
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Search
                placeholder="搜索设备名称或编号"
                onSearch={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="选择分类"
                style={{ width: 120 }}
                allowClear
                value={filters.category}
                onChange={handleCategoryChange}
              >
                {categories.map((cat) => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="选择状态"
                style={{ width: 120 }}
                allowClear
                value={filters.status}
                onChange={handleStatusChange}
              >
                {statuses.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="逾期状态"
                style={{ width: 120 }}
                allowClear
                value={filters.isOverdue}
                onChange={handleOverdueChange}
              >
                <Option value={true}>已逾期</Option>
                <Option value={false}>未逾期</Option>
              </Select>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
              新增设备
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="新增设备"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateDevice}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="设备编号"
                rules={[{ required: true, message: '请输入设备编号' }]}
              >
                <Input placeholder="请输入唯一编号，如：LAP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="请输入设备名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="设备分类"
                rules={[{ required: true, message: '请选择设备分类' }]}
              >
                <Select placeholder="请选择分类">
                  {categories.map((cat) => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="存放位置">
                <Input placeholder="请输入存放位置" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="responsiblePerson" label="负责人">
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="设备描述">
            <Input.TextArea rows={3} placeholder="请输入设备描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑设备"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          form.resetFields()
          setSelectedDevice(null)
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEditDevice}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="设备编号">
                <Input value={selectedDevice?.code} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="请输入设备名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="设备分类"
                rules={[{ required: true, message: '请选择设备分类' }]}
              >
                <Select placeholder="请选择分类">
                  {categories.map((cat) => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="存放位置">
                <Input placeholder="请输入存放位置" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="responsiblePerson" label="负责人">
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="设备描述">
            <Input.TextArea rows={3} placeholder="请输入设备描述" />
          </Form.Item>
        </Form>
      </Modal>

      <BorrowModal
        open={isBorrowModalOpen}
        device={selectedDevice}
        onClose={() => {
          setIsBorrowModalOpen(false)
          setSelectedDevice(null)
        }}
        onSuccess={fetchData}
      />

      <ReturnModal
        open={isReturnModalOpen}
        device={selectedDevice}
        onClose={() => {
          setIsReturnModalOpen(false)
          setSelectedDevice(null)
        }}
        onSuccess={fetchData}
      />
    </div>
  )
}

export default DeviceList
