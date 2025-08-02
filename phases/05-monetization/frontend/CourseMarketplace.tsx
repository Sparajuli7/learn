'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen,
  Star,
  Clock,
  DollarSign,
  Users,
  Play,
  ShoppingCart,
  Filter,
  Search,
  Award,
  TrendingUp
} from 'lucide-react'

interface Course {
  course_id: number
  title: string
  description: string
  price: number
  skill_category: string
  difficulty_level: string
  duration_hours: number
  average_rating: number
  total_sales: number
  is_featured: boolean
  creator_name?: string
  modules?: number
  lessons?: number
}

interface CoursePurchase {
  purchase_id: number
  course_id: number
  course_title: string
  amount: number
  purchase_date: string
  completion_percentage: number
  access_granted: boolean
}

// Mock course data
const MOCK_COURSES: Course[] = [
  {
    course_id: 1,
    title: "Mastering Public Speaking: From Fear to Confidence",
    description: "Transform your public speaking skills with proven techniques used by top speakers. Learn to overcome anxiety, structure compelling presentations, and captivate any audience.",
    price: 99.99,
    skill_category: "public_speaking",
    difficulty_level: "beginner",
    duration_hours: 8.5,
    average_rating: 4.8,
    total_sales: 1247,
    is_featured: true,
    creator_name: "Dr. Sarah Chen",
    modules: 6,
    lessons: 32
  },
  {
    course_id: 2,
    title: "Advanced Dance Choreography Techniques",
    description: "Elevate your dance skills with advanced choreography principles, movement dynamics, and performance techniques from professional dancers.",
    price: 149.99,
    skill_category: "dance",
    difficulty_level: "advanced",
    duration_hours: 12.0,
    average_rating: 4.9,
    total_sales: 743,
    is_featured: true,
    creator_name: "Marcus Rodriguez",
    modules: 8,
    lessons: 45
  },
  {
    course_id: 3,
    title: "Professional Cooking Fundamentals",
    description: "Master the essential skills every professional chef needs. From knife techniques to flavor development, learn the foundations of culinary excellence.",
    price: 129.99,
    skill_category: "cooking",
    difficulty_level: "intermediate",
    duration_hours: 15.5,
    average_rating: 4.7,
    total_sales: 892,
    is_featured: false,
    creator_name: "Chef Antoine Dubois",
    modules: 10,
    lessons: 58
  },
  {
    course_id: 4,
    title: "Music Theory for Performers",
    description: "Understand the theory behind great performances. Essential music theory concepts that will enhance your musical expression and stage presence.",
    price: 79.99,
    skill_category: "music",
    difficulty_level: "beginner",
    duration_hours: 6.0,
    average_rating: 4.6,
    total_sales: 445,
    is_featured: false,
    creator_name: "James Parker",
    modules: 5,
    lessons: 28
  },
  {
    course_id: 5,
    title: "Sports Performance Psychology",
    description: "Develop the mental game that separates good athletes from great ones. Learn visualization, focus techniques, and performance optimization strategies.",
    price: 119.99,
    skill_category: "sports",
    difficulty_level: "intermediate",
    duration_hours: 10.0,
    average_rating: 4.5,
    total_sales: 298,
    is_featured: false,
    creator_name: "Coach Sarah Williams",
    modules: 7,
    lessons: 38
  }
]

export default function CourseMarketplace() {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES)
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(MOCK_COURSES)
  const [purchases, setPurchases] = useState<CoursePurchase[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPurchases()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [searchTerm, categoryFilter, difficultyFilter, sortBy])

  const fetchPurchases = async () => {
    // Mock purchases data - in production this would come from API
    const mockPurchases: CoursePurchase[] = [
      {
        purchase_id: 1,
        course_id: 1,
        course_title: "Mastering Public Speaking: From Fear to Confidence",
        amount: 99.99,
        purchase_date: "2024-01-15T10:30:00Z",
        completion_percentage: 65,
        access_granted: true
      }
    ]
    setPurchases(mockPurchases)
  }

  const filterCourses = () => {
    let filtered = [...courses]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.skill_category === categoryFilter)
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === difficultyFilter)
    }

    // Sort
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
        break
      case 'rating':
        filtered.sort((a, b) => b.average_rating - a.average_rating)
        break
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        filtered.sort((a, b) => b.total_sales - a.total_sales)
        break
    }

    setFilteredCourses(filtered)
  }

  const handlePurchaseCourse = async (courseId: number) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/courses/${courseId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer user_1`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // In production, this would redirect to Stripe Checkout
        alert(`Course purchase initiated! Payment required: $${data.amount.toFixed(2)}`)
        
        // Refresh purchases
        await fetchPurchases()
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Purchase failed')
      }
    } catch (error) {
      console.error('Course purchase failed:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isPurchased = (courseId: number) => {
    return purchases.some(p => p.course_id === courseId && p.access_granted)
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'public_speaking': return '🎤'
      case 'dance': return '💃'
      case 'cooking': return '👨‍🍳'
      case 'music': return '🎵'
      case 'sports': return '⚽'
      default: return '📚'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Marketplace</h1>
        <p className="text-gray-600">Learn from industry experts with comprehensive video courses</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Courses</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
        </TabsList>

        {/* Browse Courses Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="public_speaking">Public Speaking</SelectItem>
                    <SelectItem value="dance">Dance</SelectItem>
                    <SelectItem value="cooking">Cooking</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.course_id} className="hover:shadow-lg transition-shadow">
                {course.is_featured && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-sm font-medium">
                    <Award className="inline h-4 w-4 mr-1" />
                    Featured Course
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getCategoryIcon(course.skill_category)}</span>
                      <Badge className={getDifficultyColor(course.difficulty_level)}>
                        {course.difficulty_level}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{course.average_rating}</span>
                    </div>
                  </div>
                  
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                  
                  <div className="text-sm text-gray-600">
                    by {course.creator_name}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{course.duration_hours}h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{course.total_sales.toLocaleString()} enrolled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4 text-gray-500" />
                      <span>{course.modules} modules</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      ${course.price}
                    </div>
                    
                    {isPurchased(course.course_id) ? (
                      <Button variant="secondary" disabled>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Purchased
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handlePurchaseCourse(course.course_id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy Course
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or browse all courses
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Courses Tab */}
        <TabsContent value="my-courses" className="space-y-6">
          {purchases.length > 0 ? (
            <div className="grid gap-6">
              {purchases.map((purchase) => {
                const course = courses.find(c => c.course_id === purchase.course_id)
                
                return (
                  <Card key={purchase.purchase_id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <BookOpen className="h-5 w-5" />
                            <span>{purchase.course_title}</span>
                          </CardTitle>
                          <CardDescription>
                            Purchased on {new Date(purchase.purchase_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${purchase.amount.toFixed(2)}
                          </div>
                          <Badge variant={purchase.access_granted ? 'default' : 'secondary'}>
                            {purchase.access_granted ? 'Active' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{purchase.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${purchase.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {course && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{course.duration_hours}h total</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <span>{course.lessons} lessons</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-gray-500" />
                            <span>{course.average_rating} rating</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4 text-gray-500" />
                            <span>{course.modules} modules</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          disabled={!purchase.access_granted}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Continue Learning
                        </Button>
                        
                        <Button variant="outline">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Course Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Courses Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Browse our marketplace to find courses that match your learning goals
                </p>
                <Button 
                  onClick={() => {
                    const browseTab = document.querySelector('[value="browse"]') as HTMLElement
                    browseTab?.click()
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}