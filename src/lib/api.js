// API client for communicating with the Go backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`

  // Don't override Content-Type for FormData (file uploads)
  const isFormData = options.body instanceof FormData
  const defaultHeaders = isFormData
    ? {}
    : { "Content-Type": "application/json" }

  const fetchOptions = {
    ...options,
    credentials: "include",   // Always include credentials (cookies)
    mode: "cors",            // Enable CORS
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, fetchOptions)

    // Debug logging for mark as read requests
    if (endpoint.includes('/read')) {
      console.log('Mark as read response status:', response.status);
      console.log('Mark as read response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other');
      console.log('Request URL:', url);
      console.log('Request options:', fetchOptions);
    }

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()

      // Debug logging for mark as read requests
      if (endpoint.includes('/read')) {
        console.log('Mark as read response data:', data);
      }

      // If response is not ok, throw error with message from API
      if (!response.ok) {
        // If unauthorized, clear local session state
        if (response.status === 401) {
          // Clear any client-side session data
          if (typeof window !== 'undefined') {
            // You can dispatch a logout event here if using context
            window.dispatchEvent(new CustomEvent('unauthorized'))
          }
        }
        throw new Error(data.error || "An error occurred")
      }

      return data
    }

    // For non-JSON responses
    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unauthorized'))
        }
      }
      throw new Error("An error occurred")
    }

    return response
  } catch (error) {
    // Handle network errors
    // Only log errors that aren't session-related to avoid console spam
    if (!error.message.includes('No session token provided') &&
        !error.message.includes('Unauthorized')) {
      console.error('API Error for', endpoint, ':', error)
      console.error('Request options:', fetchOptions)
    }
    throw error
  }
}

// Auth API
export const auth = {
  register: (userData) =>
    fetchAPI("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    fetchAPI("/api/auth/logout", {
      method: "POST",
    }),

  getSession: async () => {
    try {
      return await fetchAPI("/api/auth/session")
    } catch (error) {
      // If it's a "No session token provided" error, return null instead of throwing
      if (error.message.includes('No session token provided')) {
        return null
      }
      throw error
    }
  },

  // New method to check if user is authenticated
  checkAuth: async () => {
    try {
      const session = await fetchAPI("/api/auth/session")
      return { isAuthenticated: true, user: session }
    } catch (error) {
      return { isAuthenticated: false, user: null }
    }
  }
}

// Posts API
export const posts = {
  getPosts: async (page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/posts?page=${page}&limit=${limit}`);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },
  
  getLikedPosts: async (page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/posts/liked?page=${page}&limit=${limit}`);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },
  
  getCommentedPosts: async (page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/posts/commented?page=${page}&limit=${limit}`);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },

  createPost: (postData) =>
    fetchAPI("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  updatePost: (postData) =>
    fetchAPI("/api/posts", {
      method: "PUT",
      body: JSON.stringify(postData),
    }),

  deletePost: (postId) =>
    fetchAPI("/api/posts", {
      method: "DELETE",
      body: JSON.stringify({ id: postId }),
    }),

  getReactions: (postId) => fetchAPI(`/api/posts/${postId}/reactions`),

  addReaction: (postId, reactionType) =>
    fetchAPI(`/api/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    }),
}

// Comments API
export const comments = {
  getPostComments: async (postId, page = 1, limit = 20, parentId = null) => {
    let url = `/api/posts/${postId}/comments?page=${page}&limit=${limit}`
    if (parentId) {
      url += `&parentId=${parentId}`
    }
    const data = await fetchAPI(url);

    // Normalize comments response if it's an array
    if (Array.isArray(data)) {
      return {
        comments: data,
        page: page,
        limit: limit,
        total: data.length
      };
    }

    return data;
  },

  createComment: (postId, commentData) =>
    fetchAPI(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    }),

  updateComment: (commentId, commentData) =>
    fetchAPI(`/api/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(commentData),
    }),

  deleteComment: (commentId) =>
    fetchAPI(`/api/comments/${commentId}`, {
      method: "DELETE",
    }),

  getReactions: (commentId) => fetchAPI(`/api/comments/${commentId}/reactions`),

  addReaction: (commentId, reactionType) =>
    fetchAPI(`/api/comments/${commentId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    }),
}

// Groups API
export const groups = {
  getGroups: async () => {
    const data = await fetchAPI("/api/groups");

    // Normalize groups response if it's an array
    if (Array.isArray(data)) {
      return {
        groups: data,
        total: data.length
      };
    }

    return data;
  },

  getAll: async () => {
    const data = await fetchAPI("/api/groups");

    // Return array directly for getAll
    if (Array.isArray(data)) {
      return data;
    }

    // If it's an object with groups property, return the groups array
    return data.groups || [];
  },

  createGroup: (groupData) =>
    fetchAPI("/api/groups", {
      method: "POST",
      body: JSON.stringify(groupData),
    }),

  getGroup: (groupId) => fetchAPI(`/api/groups/${groupId}`),

  updateGroup: (groupId, groupData) =>
    fetchAPI(`/api/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(groupData),
    }),

  deleteGroup: (groupId) =>
    fetchAPI(`/api/groups/${groupId}`, {
      method: "DELETE",
    }),

  joinGroup: (groupId, invitedBy = null) =>
    fetchAPI(`/api/groups/${groupId}/join`, {
      method: "POST",
      body: JSON.stringify({ invited_by: invitedBy }),
    }),

  leaveGroup: (groupId) =>
    fetchAPI(`/api/groups/${groupId}/join`, {
      method: "DELETE",
    }),

  updateMember: (groupId, userId, status) =>
    fetchAPI(`/api/groups/${groupId}/members/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  removeMember: (groupId, userId) =>
    fetchAPI(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),

  getPosts: async (groupId, page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/groups/${groupId}/posts?page=${page}&limit=${limit}`);

    // Normalize group posts response if it's an array
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length
      };
    }

    return data;
  },

  createPost: (groupId, postData) =>
    fetchAPI(`/api/groups/${groupId}/posts`, {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  getEvents: (groupId) => fetchAPI(`/api/groups/${groupId}/events`),

  createEvent: (groupId, eventData) =>
    fetchAPI(`/api/groups/${groupId}/events`, {
      method: "POST",
      body: JSON.stringify(eventData),
    }),

  respondToEvent: (eventId, response) =>
    fetchAPI(`/api/groups/events/${eventId}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),
}

// Users API
export const users = {
  getFollowers: () => fetchAPI("/api/users/followers"),
  
  // Profile API methods
  getProfile: (userId = null) => {
    const endpoint = userId ? `/api/users/${userId}/profile` : "/api/users/profile"
    return fetchAPI(endpoint)
  },
  
  updateProfile: (profileData) =>
    fetchAPI("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  updatePrivacy: (isPublic) =>
    fetchAPI("/api/users/profile/privacy", {
      method: "PUT",
      body: JSON.stringify({ is_public: isPublic }),
    }),

  changePassword: (currentPassword, newPassword) =>
    fetchAPI("/api/users/change-password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      }),
    }),

  deleteAccount: (password) =>
    fetchAPI("/api/users/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),

  // Follow functionality
  getFollowers: (userID = null) => {
    const endpoint = userID ? `/api/users/${userID}/followers` : "/api/users/followers"
    return fetchAPI(endpoint)
  },

  getFollowing: (userID = null) => {
    const endpoint = userID ? `/api/users/${userID}/following` : "/api/users/following"
    return fetchAPI(endpoint)
  },

  getFollowCounts: (userID = null) => {
    const endpoint = userID ? `/api/users/${userID}/counts` : "/api/users/counts"
    return fetchAPI(endpoint)
  },

  getFollowStatus: (userID) =>
    fetchAPI(`/api/users/${userID}/follow-status`),

  followUser: (userID) =>
    fetchAPI(`/api/users/${userID}/follow`, {
      method: "POST",
    }),

  unfollowUser: (userID) =>
    fetchAPI(`/api/users/${userID}/follow`, {
      method: "DELETE",
    }),

  cancelFollowRequest: (userID) =>
    fetchAPI(`/api/users/${userID}/follow-request`, {
      method: "DELETE",
    }),

  getSuggestedUsers: () => fetchAPI("/api/users/suggested"),

  getOnlineUsers: () => fetchAPI("/api/users/online"),

  getAllUsers: () => fetchAPI("/api/users/all"),

  acceptMessageRequest: (requesterId) =>
    fetchAPI(`/api/users/accept-message-request?requester_id=${requesterId}`, {
      method: "POST"
    }),
}

export const messages = {
  getConversations: () => fetchAPI("/api/messages/conversations"),

  getMessages: (userId, page = 1, limit = 50) =>
    fetchAPI(`/api/messages/${userId}?page=${page}&limit=${limit}`),

  sendMessage: (userId, content) => fetchAPI(`/api/messages/${userId}`, {
    method: "POST",
    body: JSON.stringify({ content })
  }),

  markAsRead: async (userId) => {
    console.log('Making markAsRead API call for userId:', userId);
    try {
      const result = await fetchAPI(`/api/messages/${userId}/read`, {
        method: "PUT"
      });
      console.log('markAsRead API call successful:', result);
      return result;
    } catch (error) {
      console.error('markAsRead API call failed:', error);
      throw error;
    }
  },

  getUnreadCount: () => fetchAPI("/api/messages/unread-count"),

  // Group chat functions
  getGroupMessages: (groupId, page = 1, limit = 50) =>
    fetchAPI(`/api/groups/${groupId}/messages?page=${page}&limit=${limit}`),

  sendGroupMessage: (groupId, content) => fetchAPI(`/api/groups/${groupId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content })
  }),
}

// Notifications API
export const notifications = {
  getNotifications: (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    return fetchAPI(`/api/notifications?${params}`);
  },
  
  markAsRead: (notificationId) => 
    fetchAPI(`/api/notifications/read?id=${notificationId}`, {
      method: "PUT",
    }),
    
  markAllAsRead: () =>
    fetchAPI("/api/notifications/read-all", {
      method: "PUT",
    }),
    
  getUnreadCount: () => fetchAPI("/api/notifications/unread-count"),
}

// Activity API
export const activity = {
  getUserActivities: (userID = null, params = {}) => {
    const endpoint = userID ? `/api/activity/${userID}` : "/api/activity/"
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append("page", params.page)
    if (params.limit) searchParams.append("limit", params.limit)
    if (params.types && params.types.length > 0) {
      searchParams.append("types", params.types.join(","))
    }
    if (params.showHidden) searchParams.append("show_hidden", "true")
    
    const queryString = searchParams.toString()
    return fetchAPI(`${endpoint}${queryString ? `?${queryString}` : ""}`)
  },

  getUserPosts: (userID = null, params = {}) => {
    const endpoint = userID ? `/api/activity/${userID}/posts` : "/api/activity/posts"
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append("page", params.page)
    if (params.limit) searchParams.append("limit", params.limit)
    
    const queryString = searchParams.toString()
    return fetchAPI(`${endpoint}${queryString ? `?${queryString}` : ""}`)
  },

  hideActivity: (activityID) =>
    fetchAPI(`/api/activity/${activityID}/hide`, {
      method: "PUT",
    }),

  unhideActivity: (activityID) =>
    fetchAPI(`/api/activity/${activityID}/unhide`, {
      method: "PUT",
    }),

  getActivitySettings: () => fetchAPI("/api/activity/settings"),

  updateActivitySettings: (settings) =>
    fetchAPI("/api/activity/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
}

// Upload API
export const upload = {
  uploadFile: async (file) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetchAPI("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response || !response.url) {
        console.error('Invalid response from server:', response)
        throw new Error("Invalid response from server")
      }
      
      console.log('Upload successful, URL:', response.url)
      return response
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },
}

// WebSocket connection
export const connectWebSocket = (onMessage) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = API_URL.replace(/^https?:\/\//, "")
  const ws = new WebSocket(`${protocol}//${host}/ws`)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  ws.onclose = () => {
    // Silently handle WebSocket close - attempt to reconnect after a delay
    setTimeout(() => connectWebSocket(onMessage), 5000)
  }

  ws.onerror = (error) => {
    // Silently handle WebSocket errors to avoid console spam
    // In production, you might want to log this to an error tracking service
  }

  return ws
}

export default {
  auth,
  posts,
  comments,
  groups,
  users,
  messages,
  activity,
  upload,
  connectWebSocket,
}
