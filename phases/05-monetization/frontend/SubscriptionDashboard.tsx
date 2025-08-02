'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Crown, 
  Star, 
  Building2, 
  Check, 
  X, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Zap
} from 'lucide-react'

interface SubscriptionTier {
  id: string
  name: string
  price: number
  features: string[]
  description: string
  popular?: boolean
}

interface UserSubscription {
  subscription_id?: number
  plan_type: string
  status: string
  start_date?: string
  end_date?: string
  monthly_analyses_used: number
  features: string[]
}

interface UsageData {
  period: string
  usage_summary: Record<string, { count: number; billing_amount: number }>
  total_api_billing: number
  total_usage_events: number
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: '3 analyses per month, basic feedback',
    features: ['3 analyses per month', 'Basic feedback', 'Video upload', 'Community support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'Unlimited analyses, expert comparisons, cross-domain transfers',
    features: [
      'Unlimited analyses',
      'Expert comparisons',
      'Cross-domain transfers',
      'Advanced analytics',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'expert',
    name: 'Expert',
    price: 49,
    description: 'Personal coaching, advanced analytics, priority support',
    features: [
      'Everything in Pro',
      'Personal coaching sessions',
      'Advanced analytics dashboard',
      'Real-time feedback',
      'API access',
      'Priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    description: 'Team features, custom integrations, dedicated support',
    features: [
      'Everything in Expert',
      'Team management',
      'Custom integrations',
      'Dedicated support',
      'Advanced security',
      'Custom reporting'
    ]
  }
]

export default function SubscriptionDashboard() {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionData()
    fetchUsageData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          Authorization: `Bearer user_1` // Simplified auth for demo
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSubscription(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/analytics/usage', {
        headers: {
          Authorization: `Bearer user_1`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    }
  }

  const handleUpgrade = async (planType: string) => {
    setUpgradeLoading(planType)
    
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer user_1`
        },
        body: JSON.stringify({
          plan_type: planType,
          user_email: 'demo@skillmirror.com',
          user_name: 'Demo User'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (planType === 'free') {
          // Free plan activated immediately
          await fetchSubscriptionData()
        } else {
          // Redirect to Stripe Checkout (simplified for demo)
          console.log('Stripe integration:', data)
          alert(`Subscription created! Stripe Payment Intent: ${data.client_secret}`)
        }
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
      alert('Upgrade failed. Please try again.')
    } finally {
      setUpgradeLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      try {
        const response = await fetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: {
            Authorization: `Bearer user_1`
          }
        })
        
        if (response.ok) {
          await fetchSubscriptionData()
          alert('Subscription cancelled successfully')
        }
      } catch (error) {
        console.error('Cancellation failed:', error)
      }
    }
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free': return <Zap className="h-5 w-5" />
      case 'pro': return <Crown className="h-5 w-5" />
      case 'expert': return <Star className="h-5 w-5" />
      case 'enterprise': return <Building2 className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  const getUsageProgress = () => {
    if (!currentSubscription) return 0
    
    if (currentSubscription.plan_type === 'free') {
      return (currentSubscription.monthly_analyses_used / 3) * 100
    }
    
    return 0 // Unlimited for paid plans
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your SkillMirror subscription and billing preferences</p>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        {/* Current Subscription Tab */}
        <TabsContent value="current" className="space-y-6">
          {currentSubscription && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTierIcon(currentSubscription.plan_type)}
                    <div>
                      <CardTitle className="capitalize">
                        {currentSubscription.plan_type} Plan
                      </CardTitle>
                      <CardDescription>
                        {SUBSCRIPTION_TIERS.find(t => t.id === currentSubscription.plan_type)?.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {currentSubscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Usage Progress */}
                {currentSubscription.plan_type === 'free' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Analyses</span>
                      <span>{currentSubscription.monthly_analyses_used} / 3</span>
                    </div>
                    <Progress value={getUsageProgress()} className="h-2" />
                    <p className="text-xs text-gray-500">
                      Resets on the 1st of each month
                    </p>
                  </div>
                )}

                {/* Features List */}
                <div>
                  <h4 className="font-medium mb-3">Included Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentSubscription.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Details */}
                {currentSubscription.subscription_id && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subscription ID:</span>
                      <span className="font-mono">{currentSubscription.subscription_id}</span>
                    </div>
                    {currentSubscription.start_date && (
                      <div className="flex justify-between text-sm">
                        <span>Started:</span>
                        <span>{new Date(currentSubscription.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {currentSubscription.end_date && (
                      <div className="flex justify-between text-sm">
                        <span>Next Billing:</span>
                        <span>{new Date(currentSubscription.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  {currentSubscription.plan_type !== 'enterprise' && (
                    <Button 
                      onClick={() => handleUpgrade('enterprise')}
                      className="flex-1"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  )}
                  
                  {currentSubscription.subscription_id && (
                    <Button 
                      variant="outline" 
                      onClick={handleCancelSubscription}
                      className="flex-1"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upgrade Plans Tab */}
        <TabsContent value="upgrade" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative ${tier.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getTierIcon(tier.name)}
                  </div>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${tier.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant={currentSubscription?.plan_type === tier.id ? 'secondary' : 'default'}
                    disabled={
                      currentSubscription?.plan_type === tier.id || 
                      upgradeLoading === tier.id
                    }
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {upgradeLoading === tier.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : currentSubscription?.plan_type === tier.id ? (
                      'Current Plan'
                    ) : (
                      `Choose ${tier.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          {usageData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Usage Summary Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageData.total_usage_events}</div>
                  <p className="text-xs text-muted-foreground">
                    In {usageData.period}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Billing</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${usageData.total_api_billing.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              {/* Feature Usage Breakdown */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Feature Usage Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(usageData.usage_summary).map(([feature, data]) => (
                      <div key={feature} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium capitalize">
                            {feature.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {data.count} uses
                          </span>
                        </div>
                        <span className="font-bold">
                          ${data.billing_amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No usage data available for this period</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Your payment and billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No billing history available</p>
                <p className="text-sm text-gray-500 mt-2">
                  Payment history will appear here once you make your first payment
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}