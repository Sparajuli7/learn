/**
 * Session Manager for SkillMirror Mobile App
 * Handles mobile session lifecycle and state management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { APIService } from './APIService';

export interface DeviceInfo {
  platform: string;
  os: string;
  app_version: string;
  device_model?: string;
  screen_dimensions?: {
    width: number;
    height: number;
  };
}

export interface SessionData {
  device_info: DeviceInfo;
  network_type?: string;
  battery_level?: number;
  session_start?: string;
  last_activity?: string;
}

export interface MobileSession {
  session_id: string;
  created_at: string;
  message: string;
}

class SessionManagerClass {
  private currentSession: MobileSession | null = null;
  private sessionData: SessionData | null = null;
  private activityTimer: NodeJS.Timeout | null = null;

  async startSession(initialData: SessionData): Promise<MobileSession> {
    try {
      // Enhance device info with platform-specific data
      const enhancedDeviceInfo = {
        ...initialData.device_info,
        platform: Platform.OS,
        os_version: Platform.Version.toString(),
      };

      // Start session via API
      const session = await this.makeSessionRequest('/mobile/session/start', {
        device_info: enhancedDeviceInfo,
        network_type: initialData.network_type,
        battery_level: initialData.battery_level,
      });

      this.currentSession = session;
      this.sessionData = {
        ...initialData,
        device_info: enhancedDeviceInfo,
        session_start: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };

      // Save session to local storage
      await this.saveSession();

      // Start activity tracking
      this.startActivityTracking();

      console.log('Mobile session started:', session.session_id);
      return session;

    } catch (error) {
      console.error('Failed to start mobile session:', error);
      
      // Fallback to offline session
      const fallbackSession: MobileSession = {
        session_id: `offline_${Date.now()}`,
        created_at: new Date().toISOString(),
        message: 'Offline session created',
      };

      this.currentSession = fallbackSession;
      this.sessionData = {
        ...initialData,
        session_start: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };

      await this.saveSession();
      return fallbackSession;
    }
  }

  async updateSession(updates: Partial<SessionData>): Promise<void> {
    if (!this.currentSession || !this.sessionData) {
      console.warn('No active session to update');
      return;
    }

    try {
      // Update local session data
      this.sessionData = {
        ...this.sessionData,
        ...updates,
        last_activity: new Date().toISOString(),
      };

      // Update session via API
      await this.makeSessionRequest(`/mobile/session/${this.currentSession.session_id}`, updates, 'PUT');

      // Save updated session
      await this.saveSession();

    } catch (error) {
      console.error('Failed to update session:', error);
      // Continue with local updates even if API fails
      await this.saveSession();
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active session to end');
      return;
    }

    try {
      // Stop activity tracking
      this.stopActivityTracking();

      // End session via API
      await this.makeSessionRequest(`/mobile/session/${this.currentSession.session_id}/end`, {}, 'POST');

      console.log('Session ended:', this.currentSession.session_id);

    } catch (error) {
      console.error('Failed to end session via API:', error);
    } finally {
      // Clear local session data
      this.currentSession = null;
      this.sessionData = null;
      await this.clearSession();
    }
  }

  getCurrentSession(): MobileSession | null {
    return this.currentSession;
  }

  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  async restoreSession(): Promise<boolean> {
    try {
      const sessionStr = await AsyncStorage.getItem('mobile_session');
      const dataStr = await AsyncStorage.getItem('session_data');

      if (sessionStr && dataStr) {
        this.currentSession = JSON.parse(sessionStr);
        this.sessionData = JSON.parse(dataStr);

        // Restart activity tracking
        this.startActivityTracking();

        console.log('Session restored:', this.currentSession?.session_id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return false;
    }
  }

  private async saveSession(): Promise<void> {
    try {
      if (this.currentSession) {
        await AsyncStorage.setItem('mobile_session', JSON.stringify(this.currentSession));
      }
      if (this.sessionData) {
        await AsyncStorage.setItem('session_data', JSON.stringify(this.sessionData));
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('mobile_session');
      await AsyncStorage.removeItem('session_data');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  private startActivityTracking(): void {
    // Update activity every 30 seconds
    this.activityTimer = setInterval(() => {
      this.updateActivity();
    }, 30000);
  }

  private stopActivityTracking(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private async updateActivity(): Promise<void> {
    if (this.sessionData) {
      this.sessionData.last_activity = new Date().toISOString();
      await this.saveSession();
    }
  }

  private async makeSessionRequest(endpoint: string, data: any, method: string = 'POST'): Promise<any> {
    // This is a simplified version - in a real app, we'd use the APIService
    // For now, we'll mock the response
    
    const mockResponse = {
      session_id: `mobile_${Date.now()}`,
      created_at: new Date().toISOString(),
      message: `Session ${method.toLowerCase()} successful`,
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockResponse;
  }

  // Utility methods for session analytics
  getSessionDuration(): number {
    if (!this.sessionData?.session_start) return 0;
    
    const start = new Date(this.sessionData.session_start);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  }

  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  // App lifecycle handlers
  async handleAppStateChange(nextAppState: string): Promise<void> {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background
      await this.updateSession({
        last_activity: new Date().toISOString(),
      });
    } else if (nextAppState === 'active') {
      // App coming to foreground
      await this.updateSession({
        last_activity: new Date().toISOString(),
      });
    }
  }

  // Network state handler
  async handleNetworkChange(isConnected: boolean, type?: string): Promise<void> {
    if (isConnected && type) {
      await this.updateSession({
        network_type: type,
      });
    }
  }

  // Battery level handler
  async handleBatteryChange(level: number): Promise<void> {
    await this.updateSession({
      battery_level: Math.round(level * 100),
    });
  }
}

// Export singleton instance
export const SessionManager = new SessionManagerClass();