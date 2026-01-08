import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Truck, 
  Shield, 
  DollarSign, 
  Clock, 
  Users, 
  BarChart3,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

const Home: React.FC = () => {
  const { user } = useAuth()

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
    }
  ]

  const differentiators = []

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Logistics that doesn't exploit
              <span className="text-primary-600 block">the people who move your goods</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              India's first fair-by-design logistics platform where rules are explicit, 
              money flows transparently, and trust is engineered — not assumed.
            </p>
            <div className="flex justify-center space-x-4">
              {user ? (
                user.userType === 'customer' ? (
                  <Link to="/book" className="btn-primary text-lg px-8 py-3">
                    Book Your First Fair Ride
                  </Link>
                ) : (
                  <Link to={`/${user.userType}-dashboard`} className="btn-primary text-lg px-8 py-3">
                    Go to Dashboard
                  </Link>
                )
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why FairLoad is Different
            </h2>
            <p className="text-lg text-gray-600">
              Built for fairness, transparency, and long-term sustainability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready for Fair Logistics?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join drivers and businesses who believe logistics should be fair for everyone.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Join as Customer</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Become a Partner</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home