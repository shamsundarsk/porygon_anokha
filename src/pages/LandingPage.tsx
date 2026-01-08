import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Truck, 
  Shield, 
  DollarSign, 
  Clock, 
  Users, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  MapPin,
  Smartphone
} from 'lucide-react'

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <DollarSign className="h-8 w-8 text-primary-600" />,
      title: "Transparent Pricing",
      description: "Every rupee explained. No hidden charges, no algorithmic surprises."
    },
    {
      icon: <Shield className="h-8 w-8 text-success-600" />,
      title: "Driver Protection",
      description: "Fuel adjustments, waiting time pay, cancellation protection built-in."
    },
    {
      icon: <Clock className="h-8 w-8 text-warning-600" />,
      title: "Auto Waiting Time",
      description: "Timer starts automatically. Drivers get paid for every minute."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      title: "Business Analytics",
      description: "Real-time insights, route optimization, and SLA tracking."
    },
    {
      icon: <MapPin className="h-8 w-8 text-blue-600" />,
      title: "Live Tracking",
      description: "Real-time GPS tracking with MapMyIndia integration."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-600" />,
      title: "Voice Commands",
      description: "Hands-free operation with intelligent voice assistance."
    }
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "5,000+", label: "Delivery Partners" },
    { number: "50,000+", label: "Deliveries Completed" },
    { number: "4.8★", label: "Average Rating" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">FairLoad</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/auth" 
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/auth" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Logistics that doesn't
                <span className="text-primary-600 block">exploit people</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                India's first fair-by-design logistics platform where rules are explicit, 
                money flows transparently, and trust is engineered — not assumed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/auth" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Start Shipping Fair</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link 
                  to="/auth" 
                  className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Truck className="h-5 w-5" />
                  <span>Drive & Earn Fair</span>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Delivery Confirmed</h3>
                    <p className="text-gray-600 text-sm">Partner assigned in 2 minutes</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Base Fare</span>
                    <span className="font-medium">₹50</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Distance (5.2 km)</span>
                    <span className="font-medium">₹62</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Fuel Adjustment</span>
                    <span className="font-medium text-warning-600">+₹9</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Platform Fee (12%)</span>
                    <span className="font-medium text-red-600">-₹15</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-primary-50 px-4 rounded-lg">
                    <span className="font-semibold text-primary-900">Total</span>
                    <span className="font-bold text-primary-600 text-lg">₹121</span>
                  </div>
                  <div className="bg-success-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-success-800 font-medium">Driver Earnings</span>
                      <span className="text-success-800 font-bold">₹106</span>
                    </div>
                    <p className="text-success-700 text-xs mt-1">100% transparent - no hidden cuts</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why FairLoad is Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for fairness, transparency, and long-term sustainability. 
              Experience logistics the way it should be.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Powered by Advanced Technology
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <MapPin className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">MapMyIndia Integration</h3>
                    <p className="text-gray-600">Accurate Indian maps with real-time traffic and route optimization.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Smartphone className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Voice Commands</h3>
                    <p className="text-gray-600">Hands-free operation with intelligent voice recognition in multiple languages.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
                    <p className="text-gray-600">Live tracking, performance metrics, and business intelligence.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Mobile-First Design</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>React Native compatibility</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Offline mode support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Push notifications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>GPS background tracking</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready for Fair Logistics?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of customers and drivers who believe logistics should be fair for everyone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/auth" 
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Join as Customer</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/auth" 
                className="bg-primary-700 hover:bg-primary-800 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Truck className="h-5 w-5" />
                <span>Become a Partner</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Truck className="h-6 w-6 text-primary-400" />
                <span className="text-xl font-bold">FairLoad</span>
              </div>
              <p className="text-gray-400 mb-4">
                Fair logistics for everyone. Transparent, reliable, and sustainable.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">For Customers</a></li>
                <li><a href="#" className="hover:text-white">For Drivers</a></li>
                <li><a href="#" className="hover:text-white">For Business</a></li>
                <li><a href="#" className="hover:text-white">API Access</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Safety</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FairLoad. All rights reserved. Built with fairness in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage