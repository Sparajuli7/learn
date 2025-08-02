'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, dateFns } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar as CalendarIcon,
  Clock,
  User,
  DollarSign,
  Video,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface Expert {
  id: number
  name: string
  specialization: string
  hourly_rate: number
  rating: number
  total_sessions: number
  bio: string
  skills: string[]
  availability: string[]
}

interface ExpertBooking {
  booking_id: number
  expert_id: number
  expert_name?: string
  booking_date: string
  duration_minutes: number
  amount: number
  status: string
  meeting_url?: string
  notes: string
}

// Mock expert data - in production this would come from API
const MOCK_EXPERTS: Expert[] = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialization: "Public Speaking",
    hourly_rate: 150,
    rating: 4.9,
    total_sessions: 247,
    bio: "Former TED speaker coach with 15+ years experience helping professionals overcome stage fright and deliver compelling presentations.",
    skills: ["Public Speaking", "Presentation Design", "Executive Communication"],
    availability: ["Monday", "Tuesday", "Wednesday", "Friday"]
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    specialization: "Dance & Movement",
    hourly_rate: 120,
    rating: 4.8,
    total_sessions: 189,
    bio: "Professional choreographer and movement coach, former principal dancer with American Ballet Theatre.",
    skills: ["Dance Technique", "Movement Analysis", "Performance Coaching"],
    availability: ["Tuesday", "Wednesday", "Thursday", "Saturday"]
  },
  {
    id: 3,
    name: "Chef Antoine Dubois",
    specialization: "Culinary Arts",
    hourly_rate: 180,
    rating: 4.9,
    total_sessions: 156,
    bio: "Michelin-starred chef and culinary instructor, expert in French cuisine and advanced cooking techniques.",
    skills: ["Knife Skills", "Sauce Making", "Plating & Presentation", "Menu Development"],
    availability: ["Monday", "Wednesday", "Friday", "Sunday"]
  },
  {
    id: 4,
    name: "James Parker",
    specialization: "Music Performance",
    hourly_rate: 135,
    rating: 4.7,
    total_sessions: 203,
    bio: "Concert pianist and music educator, specializing in performance anxiety and stage presence.",
    skills: ["Piano Performance", "Stage Presence", "Music Theory", "Performance Psychology"],
    availability: ["Monday", "Tuesday", "Thursday", "Saturday"]
  }
]

export default function ExpertBookingDashboard() {
  const [activeTab, setActiveTab] = useState<'browse' | 'book' | 'bookings'>('browse')
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [bookings, setBookings] = useState<ExpertBooking[]>([])
  const [loading, setLoading] = useState(false)
  
  // Booking form state
  const [bookingDate, setBookingDate] = useState<Date>()
  const [duration, setDuration] = useState<string>('60')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/expert-bookings', {
        headers: {
          Authorization: `Bearer user_1`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const handleBookExpert = async () => {
    if (!selectedExpert || !bookingDate) {
      alert('Please select an expert and booking date')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/payments/expert-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer user_1`
        },
        body: JSON.stringify({
          expert_id: selectedExpert.id,
          booking_date: bookingDate.toISOString(),
          duration_minutes: parseInt(duration),
          notes: notes
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // In production, this would redirect to Stripe Checkout
        alert(`Booking created! Payment required: $${data.amount.toFixed(2)}`)
        
        // Reset form
        setSelectedExpert(null)
        setBookingDate(undefined)
        setNotes('')
        setActiveTab('bookings')
        
        // Refresh bookings
        await fetchBookings()
      } else {
        throw new Error('Booking failed')
      }
    } catch (error) {
      console.error('Booking failed:', error)
      alert('Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
      case 'pending_payment':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending':
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateBookingCost = () => {
    if (!selectedExpert) return 0
    const hours = parseInt(duration) / 60
    return selectedExpert.hourly_rate * hours
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Coaching</h1>
        <p className="text-gray-600">Book 1-on-1 sessions with industry experts to accelerate your skill development</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'browse'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Browse Experts
        </button>
        <button
          onClick={() => setActiveTab('book')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'book'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Book Session
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bookings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Bookings
        </button>
      </div>

      {/* Browse Experts Tab */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_EXPERTS.map((expert) => (
            <Card key={expert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{expert.name}</span>
                    </CardTitle>
                    <CardDescription className="font-medium text-blue-600">
                      {expert.specialization}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{expert.rating}</span>
                    </div>
                    <p className="text-sm text-gray-500">{expert.total_sessions} sessions</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">{expert.bio}</p>
                
                <div>
                  <h4 className="font-medium mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {expert.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-lg">${expert.hourly_rate}/hour</span>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setSelectedExpert(expert)
                      setActiveTab('book')
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Book Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Book Session Tab */}
      {activeTab === 'book' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Book Expert Session</CardTitle>
              <CardDescription>
                Schedule a 1-on-1 coaching session with a SkillMirror expert
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Expert Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Expert</label>
                <Select 
                  value={selectedExpert?.id.toString() || ''} 
                  onValueChange={(value) => {
                    const expert = MOCK_EXPERTS.find(e => e.id === parseInt(value))
                    setSelectedExpert(expert || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an expert..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_EXPERTS.map((expert) => (
                      <SelectItem key={expert.id} value={expert.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{expert.name} - {expert.specialization}</span>
                          <span className="ml-4 text-green-600 font-medium">
                            ${expert.hourly_rate}/hr
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExpert && (
                <>
                  {/* Selected Expert Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{selectedExpert.name}</h4>
                        <p className="text-sm text-blue-600">{selectedExpert.specialization}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{selectedExpert.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{selectedExpert.bio}</p>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Date & Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {bookingDate ? format(bookingDate, 'PPP') : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Duration Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Duration</label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Session Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="What would you like to focus on in this session? Any specific goals or challenges?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Session Cost</p>
                        <p className="text-sm text-gray-600">
                          {parseInt(duration)} minutes @ ${selectedExpert.hourly_rate}/hour
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${calculateBookingCost().toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Platform fee included
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    onClick={handleBookExpert}
                    disabled={loading || !bookingDate}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Book & Pay ${calculateBookingCost().toFixed(2)}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {bookings.length > 0 ? (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <Card key={booking.booking_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>Expert Session #{booking.booking_id}</span>
                        </CardTitle>
                        <CardDescription>
                          {booking.expert_name || `Expert ${booking.expert_id}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className="text-sm text-gray-600">{booking.duration_minutes} minutes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Cost</p>
                          <p className="text-sm text-gray-600">${booking.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Meeting</p>
                          <p className="text-sm text-gray-600">
                            {booking.meeting_url ? 'Video Call' : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Session Notes</p>
                          <p className="text-sm text-gray-600">{booking.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {booking.meeting_url && (
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => window.open(booking.meeting_url, '_blank')}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Join Meeting
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Expert Sessions Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Book your first 1-on-1 coaching session to get personalized guidance
                </p>
                <Button 
                  onClick={() => setActiveTab('browse')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Experts
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}