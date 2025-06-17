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

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()

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
    console.error('API Error:', error)
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

  getSession: () => fetchAPI("/api/auth/session"),

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
}

// Upload API
export const upload = {
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "posts")

    return fetchAPI("/api/upload", {
      method: "POST",
      body: formData,
    }).then((response) => {
      if (!response || !response.url) {
        throw new Error("Invalid response from server")
      }
      return response
    })
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
    console.log("WebSocket connection closed")
    // Attempt to reconnect after a delay
    setTimeout(() => connectWebSocket(onMessage), 5000)
  }

  ws.onerror = (error) => {
    console.error("WebSocket error:", error)
  }

  return ws
}

export default {
  auth,
  posts,
  comments,
  groups,
  users,
  upload,
  connectWebSocket,
}
