import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import { AppDataSource } from './data-source'
import deviceRoutes from './routes/devices'
import borrowRoutes from './routes/borrows'
import { errorHandler } from './middleware/errorHandler'
import { successResponse } from './utils/response'

const app = express()
const PORT = process.env.PORT || 8000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/devices', deviceRoutes)
app.use('/api/borrows', borrowRoutes)

app.use(errorHandler)

AppDataSource.initialize()
  .then(() => {
    console.log('数据库连接成功')
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`)
      console.log(`API 文档: http://localhost:${PORT}/api/health`)
    })
  })
  .catch((error) => {
    console.error('数据库连接失败:', error)
    process.exit(1)
  })
