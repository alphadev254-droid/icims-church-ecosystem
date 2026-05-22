import apiClient from '@/lib/api-client';

export interface RegisterTokenDto {
  token: string;
  platform?: string;
}

/**
 * Register an FCM push token with the backend.
 */
export async function registerPushToken(dto: RegisterTokenDto): Promise<void> {
  try {
    await apiClient.post('/push/register-token', {
      token: dto.token,
      platform: dto.platform || 'web',
    });
  } catch (error) {
    console.error('[PushTokens] Failed to register token:', error);
  }
}

/**
 * Unregister (remove) an FCM push token from the backend.
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await apiClient.delete('/push/unregister-token', {
      data: { token },
    });
  } catch (error) {
    console.error('[PushTokens] Failed to unregister token:', error);
  }
}
