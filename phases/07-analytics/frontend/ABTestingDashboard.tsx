/**
 * A/B Testing Dashboard
 * Advanced experiment management and results analysis
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ABTestingDashboardProps {
  apiBaseUrl?: string;
}

interface Experiment {
  id: string;
  name: string;
  variants: string[];
  hypothesis: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  start_date?: string;
  end_date?: string;
  participants: number;
  conversion_rate?: number;
  confidence?: number;
  statistical_significance?: boolean;
}

interface ExperimentResults {
  variant: string;
  participants: number;
  conversions: number;
  conversion_rate: number;
  confidence_interval: [number, number];
}

const ABTestingDashboard: React.FC<ABTestingDashboardProps> = ({ 
  apiBaseUrl = 'http://localhost:8001' 
}) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults[]>([]);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    hypothesis: '',
    variants: ['Control', 'Variant A'],
    success_metric: '',
    target_improvement: 0.1,
    duration_days: 14,
    sample_size: 1000
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      // Simulate fetching experiments - in real implementation, this would be an API call
      const mockExperiments: Experiment[] = [
        {
          id: '1',
          name: 'Onboarding Flow Optimization',
          variants: ['current_flow', 'simplified_flow'],
          hypothesis: 'Simplified 3-step onboarding will increase completion rate by 25%',
          status: 'active',
          start_date: '2024-01-15',
          participants: 1245,
          conversion_rate: 0.34,
          confidence: 85,
          statistical_significance: false
        },
        {
          id: '2',
          name: 'Call-to-Action Button Color',
          variants: ['blue_button', 'green_button', 'red_button'],
          hypothesis: 'Green CTA buttons will increase click-through rate by 15%',
          status: 'completed',
          start_date: '2024-01-01',
          end_date: '2024-01-14',
          participants: 2156,
          conversion_rate: 0.28,
          confidence: 95,
          statistical_significance: true
        },
        {
          id: '3',
          name: 'Pricing Page Layout',
          variants: ['current_layout', 'feature_focused'],
          hypothesis: 'Feature-focused pricing layout will increase conversion by 20%',
          status: 'draft',
          participants: 0
        }
      ];

      setExperiments(mockExperiments);
      if (mockExperiments.length > 0) {
        setSelectedExperiment(mockExperiments[0]);
        fetchExperimentResults(mockExperiments[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      setLoading(false);
    }
  };

  const fetchExperimentResults = async (experimentId: string) => {
    try {
      // Simulate fetching experiment results
      const mockResults: ExperimentResults[] = [
        {
          variant: 'Control',
          participants: 623,
          conversions: 189,
          conversion_rate: 0.303,
          confidence_interval: [0.265, 0.341]
        },
        {
          variant: 'Variant A',
          participants: 622,
          conversions: 231,
          conversion_rate: 0.371,
          confidence_interval: [0.333, 0.409]
        }
      ];

      setExperimentResults(mockResults);
    } catch (error) {
      console.error('Error fetching experiment results:', error);
    }
  };

  const createExperiment = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/experiments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_name: newExperiment.name,
          variants: newExperiment.variants,
          description: newExperiment.hypothesis
        })
      });

      if (response.ok) {
        alert('Experiment created successfully!');
        setShowCreateForm(false);
        fetchExperiments();
        
        // Reset form
        setNewExperiment({
          name: '',
          hypothesis: '',
          variants: ['Control', 'Variant A'],
          success_metric: '',
          target_improvement: 0.1,
          duration_days: 14,
          sample_size: 1000
        });
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Failed to create experiment');
    }
  };

  const calculateStatisticalSignificance = (results: ExperimentResults[]) => {
    if (results.length < 2) return false;
    
    const [control, variant] = results;
    const p1 = control.conversion_rate;
    const p2 = variant.conversion_rate;
    const n1 = control.participants;
    const n2 = variant.participants;
    
    // Simple z-test calculation
    const pooled_p = (control.conversions + variant.conversions) / (n1 + n2);
    const se = Math.sqrt(pooled_p * (1 - pooled_p) * (1/n1 + 1/n2));
    const z = Math.abs(p2 - p1) / se;
    
    // Z-score > 1.96 indicates 95% confidence
    return z > 1.96;
  };

  const calculateLift = (results: ExperimentResults[]) => {
    if (results.length < 2) return 0;
    
    const [control, variant] = results;
    return ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100;
  };

  const formatResultsData = () => {
    return experimentResults.map(result => ({
      variant: result.variant,
      conversion_rate: (result.conversion_rate * 100).toFixed(1),
      participants: result.participants,
      conversions: result.conversions
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Experiment
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Experiments List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiments</h2>
            
            <div className="space-y-4">
              {experiments.map((experiment) => (
                <div
                  key={experiment.id}
                  onClick={() => {
                    setSelectedExperiment(experiment);
                    fetchExperimentResults(experiment.id);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedExperiment?.id === experiment.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{experiment.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      experiment.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : experiment.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : experiment.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {experiment.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{experiment.hypothesis}</p>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{experiment.participants.toLocaleString()} participants</span>
                    {experiment.conversion_rate && (
                      <span>{(experiment.conversion_rate * 100).toFixed(1)}% conversion</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment Details */}
          <div className="col-span-2 space-y-6">
            {selectedExperiment ? (
              <>
                {/* Experiment Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedExperiment.name}</h2>
                      <p className="text-gray-600 mt-2">{selectedExperiment.hypothesis}</p>
                    </div>
                    
                    {selectedExperiment.status === 'active' && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedExperiment.confidence || 0}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                    )}
                  </div>

                  {/* Experiment Metrics */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedExperiment.participants.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedExperiment.variants.length}
                      </div>
                      <div className="text-sm text-gray-600">Variants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {calculateLift(experimentResults).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Lift</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        calculateStatisticalSignificance(experimentResults) 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {calculateStatisticalSignificance(experimentResults) ? 'Yes' : 'No'}
                      </div>
                      <div className="text-sm text-gray-600">Significant</div>
                    </div>
                  </div>
                </div>

                {/* Results Visualization */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formatResultsData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="variant" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [`${value}%`, 'Conversion Rate']} />
                          <Bar dataKey="conversion_rate" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      {experimentResults.map((result, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">{result.variant}</h4>
                            <span className="text-lg font-bold text-blue-600">
                              {(result.conversion_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Participants: {result.participants.toLocaleString()}</div>
                            <div>Conversions: {result.conversions.toLocaleString()}</div>
                            <div>
                              95% CI: {(result.confidence_interval[0] * 100).toFixed(1)}% - {(result.confidence_interval[1] * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-gray-400 text-lg">Select an experiment to view details</div>
              </div>
            )}
          </div>
        </div>

        {/* Create Experiment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Experiment</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experiment Name
                  </label>
                  <input
                    type="text"
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment({...newExperiment, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Homepage Hero Button Test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hypothesis
                  </label>
                  <textarea
                    value={newExperiment.hypothesis}
                    onChange={(e) => setNewExperiment({...newExperiment, hypothesis: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="e.g., Changing the button color to green will increase clicks by 15%"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Success Metric
                    </label>
                    <input
                      type="text"
                      value={newExperiment.success_metric}
                      onChange={(e) => setNewExperiment({...newExperiment, success_metric: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., click_through_rate"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={newExperiment.duration_days}
                      onChange={(e) => setNewExperiment({...newExperiment, duration_days: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variants (one per line)
                  </label>
                  <textarea
                    value={newExperiment.variants.join('\n')}
                    onChange={(e) => setNewExperiment({...newExperiment, variants: e.target.value.split('\n').filter(v => v.trim())})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Control&#10;Variant A&#10;Variant B"
                  />
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createExperiment}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Experiment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestingDashboard;