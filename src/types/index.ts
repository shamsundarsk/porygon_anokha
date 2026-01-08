// User Types
export type UserType = 'CUSTOMER' | 'ENTERPRISE' | 'DRIVER' | 'ADMIN'
export type BusinessType = 'B2C' | 'B2B'
export type VehicleType = 'BIKE' | 'AUTO' | 'MINI_TRUCK' | 'PICKUP'

export interface User {
  id: string
  email: string
  phone: string
  name: string
  userType: UserType
  businessType: BusinessType
  companyName?: string
  isVerified: boolean
  isActive: boolean
  avatar?: string
  createdAt: string
  
  // Driver specific fields
  vehicleType?: VehicleType
  vehicleNumber?: string
  licenseNumber?: string
  isOnline?: boolean
  currentLat?: number
  currentLng?: number
  rating?: number
  totalDeliveries?: number
  completionRate?: number
  onTimeRate?: number
  documentsVerified?: boolean
}

// Delivery Types
export type DeliveryStatus = 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
export type PackageType = 'DOCUMENT' | 'PARCEL' | 'FOOD' | 'GROCERY' | 'ELECTRONICS' | 'FRAGILE' | 'OTHER'

export interface Location {
  address: string
  lat: number
  lng: number
  contactName: string
  contactPhone: string
  instructions?: string
}

export interface Package {
  type: PackageType
  weight: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  value?: number
  description?: string
  fragile: boolean
}

export interface FareBreakdown {
  baseFare: number
  distanceCost: number
  fuelAdjustment: number
  tollCharges: number
  weightSurcharge?: number
  surgeFactor?: number
  platformCommission: number
  totalFare: number
  driverEarnings: number
  breakdown?: {
    distance: string
    duration: string
    vehicleType: string
    packageWeight: string
    isPeakHour: boolean
  }
}

export interface Delivery {
  id: string
  customerId: string
  driverId?: string
  status: DeliveryStatus
  businessType: BusinessType
  
  // Location details
  pickup: Location
  dropoff: Location
  
  // Package details
  package: Package
  
  // Pricing
  fareBreakdown: FareBreakdown
  waitingTime: number
  waitingCharges: number
  
  // Timing
  scheduledTime?: string
  acceptedAt?: string
  pickedUpAt?: string
  deliveredAt?: string
  estimatedDistance: number
  estimatedDuration: number
  actualDistance?: number
  actualDuration?: number
  
  // Additional info
  customerNotes?: string
  driverNotes?: string
  proofOfDelivery?: any
  
  createdAt: string
  updatedAt: string
  
  // Relations
  customer?: User
  driver?: User
  trackingUpdates?: TrackingUpdate[]
}

export interface TrackingUpdate {
  id: string
  deliveryId: string
  lat: number
  lng: number
  status: string
  message?: string
  timestamp: string
}

export interface Earning {
  id: string
  userId: string
  deliveryId?: string
  amount: number
  type: string
  description?: string
  date: string
}

export interface Review {
  id: string
  deliveryId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface Dispute {
  id: string
  deliveryId: string
  reporterId: string
  type: string
  description: string
  status: string
  resolution?: string
  createdAt: string
  resolvedAt?: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  data?: any
  createdAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  userType: UserType
  businessType?: BusinessType
  companyName?: string
  vehicleType?: VehicleType
  vehicleNumber?: string
  licenseNumber?: string
}

export interface DeliveryForm {
  pickup: Location
  dropoff: Location
  package: Package
  vehicleType: VehicleType
  businessType: BusinessType
  scheduledTime?: string
  customerNotes?: string
}

// Map Types
export interface MapLocation {
  lat: number
  lng: number
}

export interface RouteData {
  coordinates: [number, number][]
  distance: number
  duration: number
}

// Voice Types
export interface VoiceCommand {
  command: string
  action: string
  parameters?: any
}

// Dashboard Stats
export interface CustomerStats {
  totalDeliveries: number
  completedDeliveries: number
  totalSpent: number
  avgRating: number
  onTimeDeliveryRate: number
  avgDeliveryTime: number
}

export interface DriverStats {
  totalDeliveries: number
  rating: number
  completionRate: number
  onTimeRate: number
  avgDeliveryTime: number
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
}

export interface AdminStats {
  totalUsers: number
  activeDrivers: number
  totalDeliveries: number
  revenue: number
  completionRate: number
  avgRating: number
}