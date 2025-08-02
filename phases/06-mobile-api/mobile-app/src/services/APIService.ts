/**
 * API Service for SkillMirror Mobile App
 * Handles all communication with the backend API
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface APIConfig {
  baseURL: string;
  apiToken: string;
  timeout: number;
}

export interface VideoUploadResult {
  video_id: number;
  filename: string;
  file_size: number;
  skill_type: string;
  upload_time: string;
  message: string;
}

export interface AnalysisResult {
  analysis_id: number;
  results: any;
  confidence_score: number;
  analysis_time: string;
  message: string;
}

export interface ExpertComparison {
  comparison_id: string;
  expert: {
    id: number;
    name: string;
    domain: string;
    specialty: string;
  };
  comparison_results: any;
  recommendations: any;
  analysis_time: string;
  message: string;
}

export interface SkillTransferAnalysis {
  transfer_id: string;
  source_skill: string;
  target_skill: string;
  transfer_analysis: any;
  learning_path: any;
  effectiveness_score: number;
  estimated_time: number;
  analysis_time: string;
  message: string;
}

export interface FeedbackSession {
  session_id: string;
  skill_type: string;
  session_options: any;
  status: string;
  start_time: string;
  message: string;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
}

export interface Expert {
  id: number;
  name: string;
  domain: string;
  specialty: string;
  achievements: string[];
  bio: string;
}

class APIServiceClass {
  private client: AxiosInstance | null = null;
  private config: APIConfig | null = null;

  async initialize(config?: Partial<APIConfig>): Promise<void> {
    // Default configuration
    const defaultConfig: APIConfig = {
      baseURL: 'http://localhost:8006',
      apiToken: '',
      timeout: 30000,
    };

    // Load saved config from storage
    const savedConfig = await this.loadConfig();
    
    // Merge configurations
    this.config = {
      ...defaultConfig,
      ...savedConfig,
      ...config,
    };

    // Create axios instance
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiToken && {
          'Authorization': `Bearer ${this.config.apiToken}`
        }),
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async loadConfig(): Promise<Partial<APIConfig>> {
    try {
      const configStr = await AsyncStorage.getItem('api_config');
      return configStr ? JSON.parse(configStr) : {};
    } catch (error) {
      console.error('Failed to load API config:', error);
      return {};
    }
  }

  private async saveConfig(): Promise<void> {
    if (this.config) {
      try {
        await AsyncStorage.setItem('api_config', JSON.stringify(this.config));
      } catch (error) {
        console.error('Failed to save API config:', error);
      }
    }
  }

  async setApiToken(token: string): Promise<void> {
    if (this.config) {
      this.config.apiToken = token;
      await this.saveConfig();
      
      if (this.client) {
        this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.client) {
      throw new Error('APIService not initialized. Call initialize() first.');
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    this.ensureInitialized();
    const response = await this.client!.get('/health');
    return response.data;
  }

  // Video upload and analysis
  async uploadVideo(videoUri: string, skillType: string): Promise<VideoUploadResult> {
    this.ensureInitialized();
    
    const formData = new FormData();
    formData.append('file', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'recording.mp4',
    } as any);

    const response = await this.client!.post('/api/video/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'skill-type': skillType,
      },
    });

    return response.data;
  }

  async analyzeVideo(videoId: number, skillType: string, options: any = {}): Promise<AnalysisResult> {
    this.ensureInitialized();
    
    const response = await this.client!.post('/api/video/analyze', {
      video_id: videoId,
      skill_type: skillType,
      analysis_options: options,
    });

    return response.data;
  }

  // Expert comparison
  async compareWithExpert(userAnalysisId: number, expertId: number, options: any = {}): Promise<ExpertComparison> {
    this.ensureInitialized();
    
    const response = await this.client!.post('/api/expert/compare', {
      user_analysis_id: userAnalysisId,
      expert_id: expertId,
      comparison_options: options,
    });

    return response.data;
  }

  // Skill transfer
  async analyzeSkillTransfer(sourceSkill: string, targetSkill: string, userLevel: string = 'beginner'): Promise<SkillTransferAnalysis> {
    this.ensureInitialized();
    
    const response = await this.client!.post('/api/transfer/analyze', {
      source_skill: sourceSkill,
      target_skill: targetSkill,
      user_level: userLevel,
    });

    return response.data;
  }

  // Real-time feedback
  async startFeedbackSession(skillType: string, options: any = {}): Promise<FeedbackSession> {
    this.ensureInitialized();
    
    const response = await this.client!.post('/api/feedback/start', {
      skill_type: skillType,
      session_options: options,
    });

    return response.data;
  }

  // Data retrieval
  async getSkills(): Promise<{ skills: Skill[] }> {
    this.ensureInitialized();
    
    const response = await this.client!.get('/api/skills');
    return response.data;
  }

  async getExperts(skillType?: string, domain?: string, limit: number = 20): Promise<{ experts: Expert[] }> {
    this.ensureInitialized();
    
    const params = new URLSearchParams();
    if (skillType) params.append('skill_type', skillType);
    if (domain) params.append('domain', domain);
    params.append('limit', limit.toString());

    const response = await this.client!.get(`/api/experts?${params.toString()}`);
    return response.data;
  }

  // Analytics
  async getUsageAnalytics(startDate?: string, endDate?: string, endpoint?: string): Promise<any> {
    this.ensureInitialized();
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (endpoint) params.append('endpoint', endpoint);

    const response = await this.client!.get(`/api/analytics/usage?${params.toString()}`);
    return response.data;
  }
}

// Export singleton instance
export const APIService = new APIServiceClass();