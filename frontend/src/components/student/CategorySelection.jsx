import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Building, Code, Calendar } from 'lucide-react'

const CategorySelection = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    {
      id: 'any',
      title: 'Any Semester',
      description: 'General internship submission for any semester',
      icon: Building,
      color: 'blue',
      features: ['Basic internship details', 'Document verification', 'Simple submission process']
    },
    {
      id: '6th-sem',
      title: '6th Semester',
      description: 'Structured internship program for 6th semester students',
      icon: Calendar,
      color: 'green',
      features: ['Company registration', 'Document upload', 'Post-approval submissions']
    },
    {
      id: '7th-sem',
      title: '7th Semester',
      description: 'Comprehensive internship with detailed progress tracking',
      icon: GraduationCap,
      color: 'purple',
      features: ['Monthly progress reports', 'Mid-semester evaluations', 'Final report submission']
    },
    {
      id: '8th-sem',
      title: '8th Semester',
      description: 'Final semester with internship or project options',
      icon: Code,
      color: 'orange',
      features: ['Internship or Project choice', 'Research paper option', 'Comprehensive evaluation']
    }
  ]

  const handleProceed = () => {
    if (selectedCategory) {
      navigate(`/student/registration/${selectedCategory}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Category</h1>
          <p className="text-xl text-gray-600">Select the appropriate semester category for your submission</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 ${
                  isSelected
                    ? `border-${category.color}-500 bg-${category.color}-50 shadow-xl transform scale-105`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className={`p-4 rounded-xl ${
                      isSelected ? `bg-${category.color}-100` : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        isSelected ? `text-${category.color}-600` : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          isSelected ? `bg-${category.color}-500` : 'bg-gray-400'
                        }`}></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className={`mt-6 p-4 bg-${category.color}-100 rounded-xl border border-${category.color}-200`}>
                      <p className={`text-sm font-medium text-${category.color}-800`}>
                        ✓ {category.title} selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {selectedCategory && (
          <div className="text-center py-8">
            <button
              onClick={handleProceed}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 px-12 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Proceed with Registration
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategorySelection