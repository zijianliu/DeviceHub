import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import { LaptopOutlined, HistoryOutlined } from '@ant-design/icons'
import DeviceList from './pages/DeviceList'
import DeviceDetail from './pages/DeviceDetail'

const { Header, Content, Sider } = Layout

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={200} theme="dark">
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 18 }}>设备借用系统</h2>
          </div>
          <Menu
            mode="inline"
            theme="dark"
            defaultSelectedKeys={['1']}
            items={[
              {
                key: '1',
                icon: <LaptopOutlined />,
                label: <Link to="/">设备管理</Link>,
              },
            ]}
          />
        </Sider>
        <Layout>
          <Header style={{ padding: 0, background: colorBgContainer }} />
          <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Routes>
              <Route path="/" element={<DeviceList />} />
              <Route path="/devices/:id" element={<DeviceDetail />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App
