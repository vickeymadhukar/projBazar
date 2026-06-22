// ─────────────────────────────────────────────────────────────────────────────
//  src/hooks/useAuth.js
//  Custom auth hook — reads from Zustand authStore
//  Checks cookie-based session via GET /api/auth/me on app load
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import apiClient    from '../api/axios';

/**
 * useAuth — unified auth hook for the entire app
 *
 * Exposes:
 *   isLoading       — true during initial session check
 *   isAuthenticated — true when user is logged in
 *   user            — MongoDB user document
 *   isAdmin         — role check
 *   isSeller        — role check
 *   logout          — calls POST /api/auth/logout, clears store
 *   refetchUser     — re-fetches current user from backend (after profile update)
 */
const useAuth = () => {
  const {
    dbUser,
    isLoadingProfile,
    setDbUser,
    clearUser,
    setLoadingProfile,
  } = useAuthStore();

  /**
   * Fetch current user from backend.
   * The HttpOnly cookie is sent automatically by the browser.
   * Returns null if not authenticated (401).
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const { data } = await apiClient.get('/auth/me');
      setDbUser(data.data);
      return data.data;
    } catch (error) {
      // 401 = not logged in — that's fine, not an error
      if (error.response?.status !== 401) {
        console.error('[useAuth] fetchCurrentUser error:', error.message);
      }
      clearUser();
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [setDbUser, clearUser, setLoadingProfile]);

  // ── Check session on app mount ────────────────────────────────────────────
  // If a valid cookie exists, this restores auth state without a login page visit
  useEffect(() => {
    if (!dbUser) {
      fetchCurrentUser();
    }
  }, []); // run once on mount

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setDbUser(data.data);
    return data.data;
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (name, email, password, age, gender) => {
    const { data } = await apiClient.post('/auth/register', { name, email, password, age, gender });
    setDbUser(data.data);
    return data.data;
  };

  // ── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    const { data } = await apiClient.put('/auth/profile', profileData);
    setDbUser(data.data);
    return data.data;
  };

  // ── Change Password ───────────────────────────────────────────────────────
  const changePassword = async (passwordData) => {
    const { data } = await apiClient.put('/auth/change-password', passwordData);
    setDbUser(data.data);
    return data.data;
  };

  // ── Upload Avatar ─────────────────────────────────────────────────────────
  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    setDbUser(data.data);
    return data.data;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors — clear locally regardless
    } finally {
      clearUser();
    }
  };

  return {
    isLoading:       isLoadingProfile,
    isAuthenticated: Boolean(dbUser),
    user:            dbUser,
    isAdmin:         dbUser?.role === 'admin',
    isSeller:        ['seller', 'admin'].includes(dbUser?.role),
    login,
    register,
    updateProfile,
    changePassword,
    uploadAvatar,
    logout,
    refetchUser:     fetchCurrentUser,
  };
};

export default useAuth;
