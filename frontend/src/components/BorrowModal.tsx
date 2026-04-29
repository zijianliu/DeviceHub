import { Modal, Form, Input, DatePicker, message } from 'antd'
import dayjs from 'dayjs'
import { borrowApi } from '../services/api'
import { Device } from '../types'

const { TextArea } = Input

interface BorrowModalProps {
  open: boolean
  device: Device | null
  onClose: () => void
  onSuccess: () => void
}

const BorrowModal: React.FC<BorrowModalProps> = ({ open, device, onClose, onSuccess }) => {
  const [form] = Form.useForm()

  const handleBorrow = async (values: any) => {
    if (!device) return

    try {
      const response = await borrowApi.borrow({
        deviceId: device.id,
        borrowerName: values.borrowerName,
        borrowTime: values.borrowTime.toISOString(),
        expectedReturnTime: values.expectedReturnTime.toISOString(),
        purpose: values.purpose || undefined,
      })

      if (response.success) {
        message.success('借用成功')
        onClose()
        form.resetFields()
        onSuccess()
      } else {
        message.error(response.message || '借用失败')
      }
    } catch (error) {
      message.error('借用失败')
    }
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={`借用设备 - ${device?.name || ''}`}
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="确认借用"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleBorrow}
        initialValues={{
          borrowTime: dayjs(),
          expectedReturnTime: dayjs().add(1, 'day'),
        }}
      >
        <Form.Item label="设备编号">
          <Input value={device?.code} disabled />
        </Form.Item>

        <Form.Item label="设备名称">
          <Input value={device?.name} disabled />
        </Form.Item>

        <Form.Item
          name="borrowerName"
          label="借用人"
          rules={[{ required: true, message: '请输入借用人姓名' }]}
        >
          <Input placeholder="请输入借用人姓名" />
        </Form.Item>

        <Form.Item
          name="borrowTime"
          label="借用时间"
          rules={[{ required: true, message: '请选择借用时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder="请选择借用时间"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          name="expectedReturnTime"
          label="预计归还时间"
          rules={[{ required: true, message: '请选择预计归还时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder="请选择预计归还时间"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item name="purpose" label="用途说明">
          <TextArea rows={3} placeholder="请输入用途说明（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default BorrowModal
