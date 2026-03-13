/**
 * 用户交互 API 模块
 * 对接 ultim_api_go 后端
 */

import { ULTIM_API_BASE } from '@/config';

/**
 * 记录交互行为 (点击、浏览、游玩)
 * @param {Object} params - 交互参数
 * @returns {Promise<Object>}
 */
export async function recordInteraction(params) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error recording interaction:', error);
  }
  return { success: false };
}

/**
 * 提交评价
 * @param {Object} params - 评价参数
 * @returns {Promise<Object>}
 */
export async function submitReview(params) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error submitting review:', error);
  }
  return { success: false };
}

/**
 * 获取评价列表
 * @param {number} productId - 游戏 ID
 * @param {number} limit - 数量限制
 * @returns {Promise<Object>}
 */
export async function fetchReviews(productId, limit = 10) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/review/${productId}?limit=${limit}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
  return { success: false, data: [] };
}

/**
 * 提交反馈 (Like/Dislike/Not Interested)
 * @param {Object} params - 反馈参数
 * @returns {Promise<Object>}
 */
export async function submitFeedback(params) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
  }
  return { success: false };
}

/**
 * 获取用户历史记录
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function fetchInteractionHistory(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/history?user_id=${userId}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching history:', error);
  }
  return { success: false, data: [] };
}

/**
 * 删除用户历史记录
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function deleteInteractionHistory(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/history?user_id=${userId}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error deleting history:', error);
  }
  return { success: false };
}

/**
 * 获取用户交互统计
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>}
 */
export async function fetchInteractionStats(userId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/interactions/stats?user_id=${userId}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
  return { success: false, data: {} };
}
