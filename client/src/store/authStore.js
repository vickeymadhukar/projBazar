// ─────────────────────────────────────────────────────────────────────────────
//  src/store/authStore.js
//  Zustand store for authentication state (JWT / cookie based)
// ─────────────────────────────────────────────────────────────────────────────
import { create }    from 'zustand';
import { devtools }  from 'zustand/middleware';

const useAuthStore = create(
  devtools(
    (set, get) => ({
      // ── State ───────────────────────────────────────────────────────────────
      /** MongoDB user document — null if not logged in */
      dbUser: null,

      /** True while checking session (GET /api/auth/me) on app load */
      isLoadingProfile: true, // start as true to prevent flash of unauthenticated UI

      // ── Actions ─────────────────────────────────────────────────────────────

      setDbUser: (user) => set({ dbUser: user }),

      clearUser: () => set({ dbUser: null }),

      setLoadingProfile: (val) => set({ isLoadingProfile: val }),

      // ── Computed ─────────────────────────────────────────────────────────────
      isAdmin:  () => get().dbUser?.role === 'admin',
      isSeller: () => ['seller', 'admin'].includes(get().dbUser?.role),
    }),
    { name: 'authStore' }
  )
);

export default useAuthStore;
