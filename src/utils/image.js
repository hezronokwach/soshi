// Utility function to get the correct image URL, handling both relative and absolute paths
export const getImageUrl = (url) => {
  if (!url) return null;
  
  // If the URL is already absolute, use it as is
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
  }
  
  // Ensure the URL starts with a single forward slash
  let cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Prepend the backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  // Construct the full URL with cache-busting
  const fullUrl = `${backendUrl}${cleanUrl}`;
  return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
};
