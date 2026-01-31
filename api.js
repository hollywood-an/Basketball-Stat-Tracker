import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your Railway URL after deployment
// For local development, use your computer's IP address (not localhost)
// Example: 'http://192.168.1.100:3000'
const API_URL = 'https://basketball-stat-tracker-production.up.railway.app';

const TOKEN_KEY = '@basketball_device_token';

// Get stored token from AsyncStorage
const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Store token in AsyncStorage
const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

// Register device and get token (called on first app launch)
const registerDevice = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to register device');
    }
    
    const data = await response.json();
    await setToken(data.token);
    return data.token;
  } catch (error) {
    console.error('Device registration error:', error);
    throw error;
  }
};

// Ensure we have a valid token (get existing or register new)
const ensureToken = async () => {
  let token = await getToken();
  
  if (!token) {
    token = await registerDevice();
  }
  
  return token;
};

// Make authenticated API request
const apiRequest = async (endpoint, options = {}) => {
  const token = await ensureToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // If unauthorized, try to re-register device
  if (response.status === 401) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    const newToken = await registerDevice();
    
    config.headers['Authorization'] = `Bearer ${newToken}`;
    const retryResponse = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!retryResponse.ok) {
      const error = await retryResponse.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return retryResponse.json();
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
};

// API methods
const api = {
  // Get all games for this device
  getGames: async () => {
    return apiRequest('/api/games');
  },
  
  // Save a new game
  saveGame: async (gameData) => {
    return apiRequest('/api/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  },
  
  // Delete a game
  deleteGame: async (gameId) => {
    return apiRequest(`/api/games/${gameId}`, {
      method: 'DELETE',
    });
  },
  
  // Initialize - ensure device is registered
  initialize: async () => {
    try {
      await ensureToken();
      return true;
    } catch (error) {
      console.error('API initialization error:', error);
      return false;
    }
  },
  
  // Check if API is available
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

export default api;
