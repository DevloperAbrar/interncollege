import React from 'react'
import { Check, Clock, AlertCircle } from 'lucide-react'

const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <div className="py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${stepIdx < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                </div>
              )}
              
              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                {stepIdx < currentStep ? (
                  // Completed Step
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                ) : stepIdx === currentStep ? (
                  // Current Step
                  <div className="h-8 w-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  </div>
                ) : (
                  // Future Step
                  <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  </div>
                )}
                
                {/* Step Label */}
                <span className={`ml-4 text-sm font-medium ${
                  stepIdx <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}

// Status Badge Component
export const StatusBadge = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800'
        }
      case 'approved':
        return {
          icon: Check,
          text: 'Approved',
          className: 'bg-green-100 text-green-800'
        }
      case 'rejected':
        return {
          icon: AlertCircle,
          text: 'Rejected',
          className: 'bg-red-100 text-red-800'
        }
      case 'completed':
        return {
          icon: Check,
          text: 'Completed',
          className: 'bg-blue-100 text-blue-800'
        }
      default:
        return {
          icon: Clock,
          text: status,
          className: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </span>
  )
}

export default ProgressIndicator