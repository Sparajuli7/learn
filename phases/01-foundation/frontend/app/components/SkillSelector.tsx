'use client'

import { useState, useEffect } from 'react'
import { FiMic, FiMusic, FiTrendingUp, FiCoffee, FiActivity, FiChevronDown } from 'react-icons/fi'

interface Skill {
  id: number
  name: string
  category: string
  expert_patterns: string
}

interface SkillSelectorProps {
  selectedSkill: string
  onSkillChange: (skill: string) => void
}

const skillIcons: { [key: string]: React.ComponentType<any> } = {
  'Public Speaking': FiMic,
  'Dance/Fitness': FiActivity,
  'Cooking': FiCoffee,
  'Music/Instrument': FiMusic,
  'Sports/Athletics': FiTrendingUp,
}

export default function SkillSelector({ selectedSkill, onSkillChange }: SkillSelectorProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills/')
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      } else {
        // Fallback skills if API is not available
        setSkills([
          { id: 1, name: 'Public Speaking', category: 'communication', expert_patterns: '{}' },
          { id: 2, name: 'Dance/Fitness', category: 'movement', expert_patterns: '{}' },
          { id: 3, name: 'Cooking', category: 'technique', expert_patterns: '{}' },
          { id: 4, name: 'Music/Instrument', category: 'creative', expert_patterns: '{}' },
          { id: 5, name: 'Sports/Athletics', category: 'physical', expert_patterns: '{}' },
        ])
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
      // Use fallback skills
      setSkills([
        { id: 1, name: 'Public Speaking', category: 'communication', expert_patterns: '{}' },
        { id: 2, name: 'Dance/Fitness', category: 'movement', expert_patterns: '{}' },
        { id: 3, name: 'Cooking', category: 'technique', expert_patterns: '{}' },
        { id: 4, name: 'Music/Instrument', category: 'creative', expert_patterns: '{}' },
        { id: 5, name: 'Sports/Athletics', category: 'physical', expert_patterns: '{}' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSkillSelect = (skillName: string) => {
    onSkillChange(skillName)
    setIsDropdownOpen(false)
  }

  const selectedSkillData = skills.find(skill => skill.name === selectedSkill)
  const SelectedIcon = selectedSkillData ? skillIcons[selectedSkillData.name] || FiActivity : FiActivity

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Your Skill
      </label>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <SelectedIcon className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{selectedSkill}</span>
        </div>
        <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="py-2">
            {skills.map((skill) => {
              const IconComponent = skillIcons[skill.name] || FiActivity
              return (
                <button
                  key={skill.id}
                  onClick={() => handleSkillSelect(skill.name)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedSkill === skill.name ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedSkill === skill.name ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${
                      selectedSkill === skill.name ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{skill.category}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Skill Description */}
      {selectedSkillData && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {getSkillDescription(selectedSkillData.name)}
          </p>
        </div>
      )}
    </div>
  )
}

function getSkillDescription(skillName: string): string {
  const descriptions: { [key: string]: string } = {
    'Public Speaking': 'Analyze your confidence, posture, speech pace, and presentation delivery for professional communication.',
    'Dance/Fitness': 'Track your movement coordination, rhythm, and form for improved fitness and dance technique.',
    'Cooking': 'Evaluate your technique, timing, and efficiency to master culinary skills and kitchen confidence.',
    'Music/Instrument': 'Assess your rhythm, technique, and musical expression for enhanced performance quality.',
    'Sports/Athletics': 'Monitor your form, balance, and athletic performance to optimize your sports technique.',
  }
  
  return descriptions[skillName] || 'Comprehensive analysis to help you improve your selected skill.'
}