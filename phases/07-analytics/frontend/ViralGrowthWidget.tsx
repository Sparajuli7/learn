/**
 * Viral Growth Widget
 * Interactive referral system, social sharing, and viral challenges
 */

import React, { useState, useEffect } from 'react';

interface ViralGrowthWidgetProps {
  userId: string;
  apiBaseUrl?: string;
  onShare?: (platform: string, content: any) => void;
}

interface ReferralData {
  referral_code: string;
  reward_amount: number;
  referrals_made: number;
  successful_referrals: number;
  total_earnings: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  participants: number;
  progress: number;
  completed: boolean;
}

const ViralGrowthWidget: React.FC<ViralGrowthWidgetProps> = ({ 
  userId, 
  apiBaseUrl = 'http://localhost:8001',
  onShare 
}) => {
  const [activeTab, setActiveTab] = useState('referrals');
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [socialShareContent, setSocialShareContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
    fetchAchievements();
    fetchChallenges();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      // Simulate API call - in real implementation, this would fetch actual referral data
      const mockData: ReferralData = {
        referral_code: 'SKILL2024',
        reward_amount: 10.0,
        referrals_made: 8,
        successful_referrals: 5,
        total_earnings: 50.0
      };
      
      setReferralData(mockData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Analysis',
          description: 'Complete your first video analysis',
          icon: '🎯',
          unlocked: true,
          progress: 1,
          target: 1
        },
        {
          id: '2',
          title: 'Skill Master',
          description: 'Analyze videos in 3 different skill categories',
          icon: '🏆',
          unlocked: true,
          progress: 3,
          target: 3
        },
        {
          id: '3',
          title: 'Expert Comparison',
          description: 'Compare yourself to 5 different experts',
          icon: '⭐',
          unlocked: false,
          progress: 3,
          target: 5
        },
        {
          id: '4',
          title: 'Referral Champion',
          description: 'Refer 10 friends successfully',
          icon: '🚀',
          unlocked: false,
          progress: 5,
          target: 10
        },
        {
          id: '5',
          title: 'Cross-Domain Explorer',
          description: 'Try skill transfer between different domains',
          icon: '🔄',
          unlocked: true,
          progress: 2,
          target: 2
        }
      ];
      
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const mockChallenges: Challenge[] = [
        {
          id: '1',
          title: 'January Skill Challenge',
          description: 'Complete 10 video analyses this month',
          reward: '1 month premium upgrade',
          deadline: '2024-01-31',
          participants: 342,
          progress: 7,
          completed: false
        },
        {
          id: '2',
          title: 'Referral Rally',
          description: 'Refer 3 friends in the next 7 days',
          reward: '$25 bonus reward',
          deadline: '2024-01-25',
          participants: 128,
          progress: 1,
          completed: false
        },
        {
          id: '3',
          title: 'Expert Comparison Streak',
          description: 'Compare to experts 5 days in a row',
          reward: 'Exclusive expert insights',
          deadline: '2024-01-28',
          participants: 89,
          progress: 3,
          completed: false
        }
      ];
      
      setChallenges(mockChallenges);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/referrals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer_id: userId,
          reward_amount: 10.0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(prev => prev ? {...prev, referral_code: data.referral_code} : null);
      }
    } catch (error) {
      console.error('Error creating referral code:', error);
    }
  };

  const shareOnSocial = (platform: string) => {
    const content = generateShareContent(platform);
    
    if (onShare) {
      onShare(platform, content);
    } else {
      // Default sharing behavior
      const url = encodeURIComponent(content.url);
      const text = encodeURIComponent(content.text);
      
      let shareUrl = '';
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        default:
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    }
  };

  const generateShareContent = (platform: string) => {
    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}?ref=${referralData?.referral_code}`;
    
    const contents = {
      twitter: {
        text: `🚀 I'm improving my skills with SkillMirror! Get AI-powered feedback on your videos and compare to experts. Join me and get $${referralData?.reward_amount} off!`,
        url: referralUrl,
        hashtags: ['SkillMirror', 'AI', 'SkillDevelopment']
      },
      facebook: {
        text: `Check out this amazing skill development platform! SkillMirror uses AI to analyze your videos and help you improve. Sign up with my link and save $${referralData?.reward_amount}!`,
        url: referralUrl
      },
      linkedin: {
        text: `Professional development just got smarter with SkillMirror! AI-powered video analysis and expert comparisons. Use my referral for $${referralData?.reward_amount} off your first month.`,
        url: referralUrl
      }
    };
    
    return contents[platform as keyof typeof contents] || contents.twitter;
  };

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}?ref=${referralData?.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    alert('Referral link copied to clipboard!');
  };

  const generateAchievementGraphic = (achievement: Achievement) => {
    // Generate a shareable achievement graphic
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Achievement content
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(achievement.icon, 300, 150);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillText(achievement.title, 300, 220);
    
    ctx.font = '24px Arial';
    ctx.fillText('Unlocked on SkillMirror!', 300, 260);
    
    ctx.font = '20px Arial';
    ctx.fillText(achievement.description, 300, 300);

    return canvas.toDataURL();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {['referrals', 'achievements', 'challenges', 'social'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Referrals Tab */}
        {activeTab === 'referrals' && referralData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Referral Program</h3>
              <p className="text-gray-600">Earn ${referralData.reward_amount} for each successful referral!</p>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{referralData.referrals_made}</div>
                <div className="text-sm text-gray-600">Referrals Made</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{referralData.successful_referrals}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">${referralData.total_earnings}</div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">Your Referral Code</div>
                  <div className="text-2xl font-bold text-blue-600">{referralData.referral_code}</div>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => shareOnSocial('twitter')}
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 flex items-center"
              >
                <span className="mr-2">🐦</span> Twitter
              </button>
              <button
                onClick={() => shareOnSocial('facebook')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <span className="mr-2">📘</span> Facebook
              </button>
              <button
                onClick={() => shareOnSocial('linkedin')}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center"
              >
                <span className="mr-2">💼</span> LinkedIn
              </button>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Achievements</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 border rounded-lg ${
                    achievement.unlocked 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">{achievement.icon}</div>
                      <div>
                        <div className={`font-medium ${
                          achievement.unlocked ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {achievement.title}
                        </div>
                        <div className="text-sm text-gray-600">{achievement.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Progress: {achievement.progress}/{achievement.target}
                        </div>
                      </div>
                    </div>
                    
                    {achievement.unlocked && (
                      <button
                        onClick={() => {
                          const graphic = generateAchievementGraphic(achievement);
                          // Share achievement graphic
                          setSocialShareContent(graphic);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Share
                      </button>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Challenges</h3>
            
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {challenge.participants} participating
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reward: {challenge.reward}</span>
                      <span className="text-gray-600">
                        Deadline: {new Date(challenge.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(challenge.progress / 10) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress: {challenge.progress}/10</span>
                      <span>{Math.round((challenge.progress / 10) * 100)}% complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Sharing</h3>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Share Your Progress</h4>
              <p className="text-sm text-blue-700 mb-4">
                Share your SkillMirror journey with friends and earn rewards for referrals!
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => shareOnSocial('twitter')}
                  className="p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-center"
                >
                  <div className="text-2xl mb-1">🐦</div>
                  <div className="text-sm">Twitter</div>
                </button>
                <button
                  onClick={() => shareOnSocial('facebook')}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  <div className="text-2xl mb-1">📘</div>
                  <div className="text-sm">Facebook</div>
                </button>
                <button
                  onClick={() => shareOnSocial('linkedin')}
                  className="p-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 text-center"
                >
                  <div className="text-2xl mb-1">💼</div>
                  <div className="text-sm">LinkedIn</div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Viral Growth Tips</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Share your achievements and progress regularly</li>
                <li>• Tag friends who might be interested in skill development</li>
                <li>• Create video testimonials about your improvement</li>
                <li>• Join community challenges to increase visibility</li>
                <li>• Share before/after comparisons of your skills</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViralGrowthWidget;