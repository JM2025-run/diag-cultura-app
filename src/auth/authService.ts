import { type User, type UserDetails, type UserResponse } from '../types';

// --- DADOS DOS USUÁRIOS ---
// Lista expandida para 30 usuários.
const USERS_DB: Record<string, { password: string; role: 'ADMIN' | 'USER' }> = {
  // FIX: Corrected the role to 'ADMIN' to match the defined type.
  'admin': { password: 'admin123', role: 'ADMIN' },
  'usuario1': { password: 'user1', role: 'USER' },
  'usuario2': { password: 'user2', role: 'USER' },
  'usuario3': { password: 'user3', role: 'USER' },
  'usuario4': { password: 'user4', role: 'USER' },
  'usuario5': { password: 'user5', role: 'USER' },
  'usuario6': { password: 'user6', role: 'USER' },
  'usuario7': { password: 'user7', role: 'USER' },
  'usuario8': { password: 'user8', role: 'USER' },
  'usuario9': { password: 'user9', role: 'USER' },
  'usuario10': { password: 'user10', role: 'USER' },
  'usuario11': { password: 'user11', role: 'USER' },
  'usuario12': { password: 'user12', role: 'USER' },
  'usuario13': { password: 'user13', role: 'USER' },
  'usuario14': { password: 'user14', role: 'USER' },
  'usuario15': { password: 'user15', role: 'USER' },
  'usuario16': { password: 'user16', role: 'USER' },
  'usuario17': { password: 'user17', role: 'USER' },
  'usuario18': { password: 'user18', role: 'USER' },
  'usuario19': { password: 'user19', role: 'USER' },
  'usuario20': { password: 'user20', role: 'USER' },
  'usuario21': { password: 'user21', role: 'USER' },
  'usuario22': { password: 'user22', role: 'USER' },
  'usuario23': { password: 'user23', role: 'USER' },
  'usuario24': { password: 'user24', role: 'USER' },
  'usuario25': { password: 'user25', role: 'USER' },
  'usuario26': { password: 'user26', role: 'USER' },
  'usuario27': { password: 'user27', role: 'USER' },
  'usuario28': { password: 'user28', role: 'USER' },
  'usuario29': { password: 'user29', role: 'USER' },
  'usuario30': { password: 'user30', role: 'USER' },
};
// --------------------------

const SESSION_KEY = 'currentUser';
const RESPONSE_PREFIX = 'response_';
const USER_DETAILS_PREFIX = 'userDetails_';

export const authService = {
  login: (username: string, password: string):User | null => {
    const userData = USERS_DB[username];
    if (userData && userData.password === password) {
      const user: User = { username, role: userData.role };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const userJson = sessionStorage.getItem(SESSION_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Failed to parse user from session storage. Clearing corrupted data.", error);
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  saveUserDetails: (username: string, details: UserDetails): void => {
    localStorage.setItem(`${USER_DETAILS_PREFIX}${username}`, JSON.stringify(details));
  },

  getUserDetails: (username: string): UserDetails | null => {
    const detailsJson = localStorage.getItem(`${USER_DETAILS_PREFIX}${username}`);
    if (!detailsJson) return null;
    try {
      return JSON.parse(detailsJson);
    } catch (error) {
      console.error(`Failed to parse user details for ${username}. Clearing corrupted data.`, error);
      localStorage.removeItem(`${USER_DETAILS_PREFIX}${username}`);
      return null;
    }
  },
  
  saveUserResponse: (response: UserResponse): void => {
    if (localStorage.getItem(`${RESPONSE_PREFIX}${response.username}`)) {
      console.warn(`Overwriting existing response for user: ${response.username}`);
    }
    localStorage.setItem(`${RESPONSE_PREFIX}${response.username}`, JSON.stringify(response));
  },

  getAllResponses: (): UserResponse[] => {
    const responses: UserResponse[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(RESPONSE_PREFIX)) {
        const responseJson = localStorage.getItem(key);
        if (responseJson) {
          try {
            responses.push(JSON.parse(responseJson));
          } catch (error) {
            console.error(`Failed to parse response from localStorage for key: ${key}. Skipping.`, error);
          }
        }
      }
    }
    return responses;
  },
};