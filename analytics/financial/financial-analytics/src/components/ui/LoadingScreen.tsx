import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Financial Analytics
        </h1>
        
        {/* Subtitle */}
        <p className="text-primary-100 text-lg mb-8">
          Loading your financial dashboard...
        </p>

        {/* Loading progress */}
        <div className="w-64 mx-auto">
          <div className="bg-primary-800 rounded-full h-2 overflow-hidden">
            <div className="bg-white h-full rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading steps */}
        <div className="mt-8 text-sm text-primary-200">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
              <span>Initializing...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  )
}

export default LoadingScreen