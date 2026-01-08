import React, { useState } from 'react'
import { AlertCircle, Database, ExternalLink, X } from 'lucide-react'

const DatabaseSetupNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Database className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">Database Setup Required</h3>
          <p className="text-sm text-blue-700 mt-1">
            To enable full functionality, please set up your Supabase database.
          </p>
          <div className="mt-3 flex items-center space-x-2">
            <a
              href="https://supabase.com/dashboard/project/qflkxzqpuvtggzdpqfho"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Open Supabase
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <span className="text-blue-500">•</span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default DatabaseSetupNotice