/**
 * 用户管理 API 模块
 * 对接 ultim_api_go 后端
 */

import { ULTIM_API_BASE } from '@/config';

/**
 * 获取用户画像
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function fetchUserProfile(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/users/profile?user_id=${userId}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
  return { success: false };
}

/**
 * 更新用户画像
 * @param {Object} profile - 用户画像数据
 * @returns {Promise<Object>}
 */
export async function updateUserProfile(profile) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
  return { success: false };
}

/**
 * 获取内容偏好统计
 * @param {string} steamId - Steam ID
 * @returns {Promise<Object>}
 */
export async function fetchUserPreferences(steamId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/users/preferences?steam_id=${steamId}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
  }
  return { success: false, data: { preferred_genres: [] } };
}

/**
 * 获取资料完整度
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function fetchProfileCompleteness(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/users/profile/complete?user_id=${userId}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching profile completeness:', error);
  }
  return { success: false, data: { completion_score: 0 } };
}

/**
 * 删除用户账户
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function deleteUserAccount(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/users/account?user_id=${userId}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
  }
  return { success: false };
}

/**
 * 获取收藏夹列表 (Favorites)
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function fetchUserFavorites(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/library/favorites?user_id=${userId}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user favorites:', error);
  }
  return { success: false, data: [] };
}

/**
 * 切换收藏状态
 * @param {Object} params - 收藏参数 (user_id, product_id)
 * @returns {Promise<Object>}
 */
export async function toggleUserFavorite(params) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/library/toggle-favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error toggling user favorite:', error);
  }
  return { success: false };
}
