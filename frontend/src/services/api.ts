import {
  ApiResponse,
  Device,
  PagedDevices,
  DeviceFilters,
  BorrowRequest,
  ReturnRequest,
  BorrowRecord,
} from '../types'

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  return response.json()
}

export const deviceApi = {
  getDevices: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: DeviceFilters
  ): Promise<ApiResponse<PagedDevices>> => {
    const params = new URLSearchParams()
    params.append('page', String(page))
    params.append('pageSize', String(pageSize))

    if (filters?.category) {
      params.append('category', filters.category)
    }
    if (filters?.status) {
      params.append('status', filters.status)
    }
    if (filters?.isOverdue !== undefined) {
      params.append('isOverdue', String(filters.isOverdue))
    }
    if (filters?.keyword) {
      params.append('keyword', filters.keyword)
    }

    return request<PagedDevices>(`${API_BASE}/devices?${params.toString()}`)
  },

  getDevice: async (id: string): Promise<ApiResponse<Device>> => {
    return request<Device>(`${API_BASE}/devices/${id}`)
  },

  getCategories: async (): Promise<ApiResponse<{ value: string; label: string }[]>> => {
    return request<{ value: string; label: string }[]>(`${API_BASE}/devices/categories`)
  },

  getStatuses: async (): Promise<ApiResponse<{ value: string; label: string }[]>> => {
    return request<{ value: string; label: string }[]>(`${API_BASE}/devices/statuses`)
  },

  createDevice: async (data: {
    code: string
    name: string
    category: string
    location?: string
    responsiblePerson?: string
    description?: string
  }): Promise<ApiResponse<Device>> => {
    return request<Device>(`${API_BASE}/devices`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateDevice: async (
    id: string,
    data: {
      name?: string
      category?: string
      location?: string
      responsiblePerson?: string
      description?: string
    }
  ): Promise<ApiResponse<Device>> => {
    return request<Device>(`${API_BASE}/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getBorrowRecords: async (deviceId: string): Promise<ApiResponse<BorrowRecord[]>> => {
    return request<BorrowRecord[]>(`${API_BASE}/devices/${deviceId}/borrow-records`)
  },
}

export const borrowApi = {
  borrow: async (data: BorrowRequest): Promise<ApiResponse<{ record: BorrowRecord; device: Device }>> => {
    return request<{ record: BorrowRecord; device: Device }>(`${API_BASE}/borrows/borrow`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  return: async (data: ReturnRequest): Promise<ApiResponse<{ record: BorrowRecord; device: Device }>> => {
    return request<{ record: BorrowRecord; device: Device }>(`${API_BASE}/borrows/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  checkBorrowable: async (deviceId: string): Promise<ApiResponse<{ can: boolean; reason?: string }>> => {
    return request<{ can: boolean; reason?: string }>(`${API_BASE}/borrows/check-borrowable/${deviceId}`)
  },

  checkReturnable: async (
    deviceId: string
  ): Promise<
    ApiResponse<{
      can: boolean
      reason?: string
      activeBorrow?: BorrowRecord | null
    }>
  > => {
    return request<{
      can: boolean
      reason?: string
      activeBorrow?: BorrowRecord | null
    }>(`${API_BASE}/borrows/check-returnable/${deviceId}`)
  },

  getActiveBorrow: async (deviceId: string): Promise<ApiResponse<BorrowRecord | null>> => {
    return request<BorrowRecord | null>(`${API_BASE}/borrows/active/${deviceId}`)
  },
}
