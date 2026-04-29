import { Modal, Form, Input, Radio, message } from 'antd'
import { borrowApi } from '../services/api'
import { Device } from '../types'

const { TextArea } = Input

interface ReturnModalProps {
  open: boolean
  device: Device | null
  onClose: () => void
  onSuccess: () => void
}

const ReturnModal: React.FC<ReturnModalProps> = ({ open, device, onClose, onSuccess }) => {
  const [form] = Form.useForm()

  const handleReturn = async (values: any) => {
    if (!device) return

    try {
      const response = await borrowApi.return({
        deviceId: device.id,
        returnerName: values.returnerName,
        isDamaged: values.isDamaged,
        returnRemark: values.returnRemark || undefined,
      })

      if (response.success) {
        if (values.isDamaged) {
          message.success('设备已归还，因损坏转入维修状态')
        } else {
          message.success('归还成功')
        }
        onClose()
        form.resetFields()
        onSuccess()
      } else {
        message.error(response.message || '归还失败')
      }
    } catch (error) {
      message.error('归还失败')
    }
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={`归还设备 - ${device?.name || ''}`}
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="确认归还"
      cancelText="取消"
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleReturn}>
        <Form.Item label="设备编号">
          <Input value={device?.code} disabled />
        </Form.Item>

        <Form.Item label="设备名称">
          <Input value={device?.name} disabled />
        </Form.Item>

        <Form.Item
          name="returnerName"
          label="归还人"
          rules={[{ required: true, message: '请输入归还人姓名' }]}
        >
          <Input placeholder="请输入归还人姓名" />
        </Form.Item>

        <Form.Item
          name="isDamaged"
          label="设备状态"
          rules={[{ required: true, message: '请选择设备状态' }]}
          initialValue={false}
        >
          <Radio.Group>
            <Radio value={false}>完好</Radio>
            <Radio value={true}>损坏（将转入维修状态）</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="returnRemark" label="归还备注">
          <TextArea rows={3} placeholder="请输入归还备注（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ReturnModal
