import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  userType: 'B2C' | 'B2B' | 'DRIVER' | 'OWNER'
  companyName?: string
  vehicleType?: string
  vehicleNumber?: string
  fleetSize?: string
  isVerified: boolean
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  userType: 'B2C' | 'B2B' | 'DRIVER' | 'OWNER'
  companyName?: string
  vehicleType?: string
  vehicleNumber?: string
  fleetSize?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          // Get user data from Supabase
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', firebaseUser.uid)
            .single()

          if (data && !error) {
            setUser({
              id: data.id,
              email: data.email,
              name: data.name,
              phone: data.phone,
              userType: data.user_type,
              companyName: data.company_name,
              vehicleType: data.vehicle_type,
              vehicleNumber: data.vehicle_number,
              isVerified: data.is_verified
            })
          } else if (error && error.code === 'PGRST116') {
            // Table doesn't exist yet - use demo mode with stored user type
            console.log('Database not set up yet, using demo mode')
            const storedUserType = localStorage.getItem(`userType_${firebaseUser.uid}`) as 'B2C' | 'B2B' | 'DRIVER' || 'B2C'
            const storedUserData = localStorage.getItem(`userData_${firebaseUser.uid}`)
            
            let userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Demo User',
              phone: '',
              userType: storedUserType,
              isVerified: false
            }

            // If we have stored user data from registration, use it
            if (storedUserData) {
              try {
                const parsedData = JSON.parse(storedUserData)
                userData = {
                  ...userData,
                  name: parsedData.name || userData.name,
                  phone: parsedData.phone || userData.phone,
                  companyName: parsedData.companyName,
                  vehicleType: parsedData.vehicleType,
                  vehicleNumber: parsedData.vehicleNumber
                }
              } catch (e) {
                console.log('Error parsing stored user data:', e)
              }
            }

            setUser(userData)
          }
        } catch (error) {
          console.log('Database connection issue, using demo mode:', error)
          // Fallback to demo mode if database is not available
          const storedUserType = localStorage.getItem(`userType_${firebaseUser.uid}`) as 'B2C' | 'B2B' | 'DRIVER' || 'B2C'
          const storedUserData = localStorage.getItem(`userData_${firebaseUser.uid}`)
          
          let userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Demo User',
            phone: '',
            userType: storedUserType,
            isVerified: false
          }

          if (storedUserData) {
            try {
              const parsedData = JSON.parse(storedUserData)
              userData = {
                ...userData,
                name: parsedData.name || userData.name,
                phone: parsedData.phone || userData.phone,
                companyName: parsedData.companyName,
                vehicleType: parsedData.vehicleType,
                vehicleNumber: parsedData.vehicleNumber
              }
            } catch (e) {
              console.log('Error parsing stored user data:', e)
            }
          }

          setUser(userData)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true)
      
      // Create Firebase user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      )

      // Store user type and data in localStorage for demo mode
      localStorage.setItem(`userType_${firebaseUser.uid}`, userData.userType)
      localStorage.setItem(`userData_${firebaseUser.uid}`, JSON.stringify({
        name: userData.name,
        phone: userData.phone,
        companyName: userData.companyName,
        vehicleType: userData.vehicleType,
        vehicleNumber: userData.vehicleNumber
      }))

      try {
        // Try to create user record in Supabase
        const { error } = await supabase
          .from('users')
          .insert([
            {
              firebase_uid: firebaseUser.uid,
              email: userData.email,
              name: userData.name,
              phone: userData.phone,
              user_type: userData.userType,
              company_name: userData.companyName,
              vehicle_type: userData.vehicleType,
              vehicle_number: userData.vehicleNumber,
              is_verified: false,
              created_at: new Date().toISOString()
            }
          ])

        if (error && error.code !== 'PGRST116') {
          // Only throw if it's not a "table doesn't exist" error
          throw new Error(error.message)
        }
      } catch (dbError: any) {
        // Database not set up yet, continue with Firebase auth only
        console.log('Database not available, using Firebase auth only:', dbError.message)
      }

      toast.success('Account created successfully!')
      
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead.')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters long.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else {
        toast.error(error.message || 'Registration failed')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Login successful!')
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please register first.')
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.')
      } else {
        toast.error(error.message || 'Login failed')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        // Clear stored user data
        localStorage.removeItem(`userType_${currentUser.uid}`)
        localStorage.removeItem(`userData_${currentUser.uid}`)
      }
      
      await signOut(auth)
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Logout failed')
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else {
        toast.error(error.message || 'Failed to send reset email')
      }
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      login,
      register,
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}