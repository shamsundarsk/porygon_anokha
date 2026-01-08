import axios from 'axios'
import { 
  LoginForm, 
  RegisterForm, 
  User, 
  Delivery, 
  DeliveryForm,
  FareBreakdown,
  CustomerStats,
  DriverStats,
  AdminStats,
  PaginatedResponse
} from '../types'

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5004/api',
  timeout: 10000,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fairload_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fairload_token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (data: LoginForm) => 
    api.post<{ token: string; user: User }>('/auth/login', data).then(res => res.data),
  
  register: (data: RegisterForm) => 
    api.post<{ token: string; user: User }>('/auth/register', data).then(res => res.data),
  
  verify: () => 
    api.get<{ user: User }>('/auth/verify').then(res => res.data),
  
  requestOTP: (phone: string) => 
    api.post('/auth/request-otp', { phone }).then(res => res.data),
  
  verifyOTP: (phone: string, otp: string) => 
    api.post('/auth/verify-otp', { phone, otp }).then(res => res.data),
  
  logout: () => 
    api.post('/auth/logout').then(res => res.data),
}

// Delivery API
export const deliveryAPI = {
  calculateFare: (pickup: any, dropoff: any, vehicleType: string, packageWeight?: number) =>
    api.post<FareBreakdown>('/deliveries/calculate-fare', { 
      pickup, 
      dropoff, 
      vehicleType, 
      packageWeight 
    }).then(res => res.data),
  
  create: (data: DeliveryForm & { fareBreakdown: FareBreakdown }) =>
    api.post<Delivery>('/deliveries', data).then(res => res.data),
  
  getMyDeliveries: (params?: { page?: number; limit?: number; status?: string; businessType?: string }) =>
    api.get<PaginatedResponse<Delivery>>('/deliveries/my-deliveries', { params }).then(res => res.data),
  
  getCurrentDeliveries: () =>
    api.get<Delivery[]>('/deliveries/current').then(res => res.data),
  
  getAvailableDeliveries: (params?: { vehicleType?: string; maxDistance?: number }) =>
    api.get<Delivery[]>('/deliveries/available', { params }).then(res => res.data),
  
  accept: (deliveryId: string) =>
    api.post<Delivery>(`/deliveries/${deliveryId}/accept`).then(res => res.data),
  
  updateStatus: (deliveryId: string, data: { status: string; location?: any; notes?: string; waitingTime?: number }) =>
    api.put<Delivery>(`/deliveries/${deliveryId}/status`, data).then(res => res.data),
  
  cancel: (deliveryId: string, reason?: string) =>
    api.post<Delivery>(`/deliveries/${deliveryId}/cancel`, { reason }).then(res => res.data),
  
  getTracking: (deliveryId: string) =>
    api.get(`/deliveries/${deliveryId}/tracking`).then(res => res.data),
}

// Driver API
export const driverAPI = {
  getDashboard: () =>
    api.get<{
      stats: DriverStats;
      currentDelivery?: Delivery;
      isOnline: boolean;
    }>('/drivers/dashboard').then(res => res.data),
  
  toggleOnlineStatus: () =>
    api.post<{ isOnline: boolean }>('/drivers/toggle-status').then(res => res.data),
  
  updateLocation: (lat: number, lng: number) =>
    api.post('/drivers/location', { lat, lng }).then(res => res.data),
  
  getEarnings: (period?: string) =>
    api.get('/drivers/earnings', { params: { period } }).then(res => res.data),
  
  getDeliveryHistory: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Delivery>>('/drivers/deliveries', { params }).then(res => res.data),
}

// Customer API
export const customerAPI = {
  getStats: () =>
    api.get<CustomerStats>('/customers/stats').then(res => res.data),
  
  getAnalytics: (period?: string) =>
    api.get('/customers/analytics', { params: { period } }).then(res => res.data),
  
  updateProfile: (data: Partial<User>) =>
    api.put<User>('/customers/profile', data).then(res => res.data),
}

// Admin API
export const adminAPI = {
  getStats: () =>
    api.get<AdminStats>('/admin/stats').then(res => res.data),
  
  getUsers: (params?: { page?: number; limit?: number; userType?: string }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then(res => res.data),
  
  getDeliveries: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Delivery>>('/admin/deliveries', { params }).then(res => res.data),
  
  getDisputes: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/disputes', { params }).then(res => res.data),
  
  resolveDispute: (disputeId: string, resolution: string) =>
    api.post(`/admin/disputes/${disputeId}/resolve`, { resolution }).then(res => res.data),
  
  updateUser: (userId: string, data: Partial<User>) =>
    api.put<User>(`/admin/users/${userId}`, data).then(res => res.data),
}

// Maps API
export const mapsAPI = {
  geocode: (address: string) =>
    api.post('/maps/geocode', { address }).then(res => res.data),
  
  reverseGeocode: (lat: number, lng: number) =>
    api.post('/maps/reverse-geocode', { lat, lng }).then(res => res.data),
  
  getRoute: (pickup: any, dropoff: any) =>
    api.post('/maps/route', { pickup, dropoff }).then(res => res.data),
  
  getNearbyDrivers: (lat: number, lng: number, radius?: number) =>
    api.get('/maps/nearby-drivers', { params: { lat, lng, radius } }).then(res => res.data),
}

// Notifications API
export const notificationAPI = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }).then(res => res.data),
  
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`).then(res => res.data),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all').then(res => res.data),
}

export default api