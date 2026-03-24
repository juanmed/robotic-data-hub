
Goal: make authentication and protected navigation deterministic so sign-in completes, protected pages render every time, and the account dropdown always works.

What I found
- The backend auth request is succeeding. The database also has the expected profile row and the profile triggers/policies are present.
- The main instability is in the client auth state handling, not in the backend.
- `useAuth.tsx` currently does async work directly inside `onAuthStateChange` and also does another async `getSession()` bootstrap path. Both paths call `resolveUser()` and both can race each other.
- While those async calls are in flight, `ProtectedRoute` depends on `isLoading`. If that flag is not cleared in the right order, every protected page falls back to the full-screen spinner.
- `login()` also does its own profile resolution even though the auth listener is already doing it, so sign-in now has multiple competing state updates.
- The navbar dropdown issue is likely a symptom of the auth state being stuck, plus there is a runtime ref warning around the dropdown that should be cleaned up because it can make menu behavior unreliable.
- Some page loaders are also brittle: for example `DashboardPage` has no `catch/finally`, so any load failure can leave the page in a perpetual loading state.

How login should work
1. App starts:
   - Read the existing session once.
   - Mark auth as initialized immediately after session is known.
   - If a user exists, show a lightweight session-based user right away.
   - Fetch profile details in the background and merge them in later.
2. User signs in:
   - Submit credentials.
   - If credentials are valid and email is verified, auth state updates once.
   - UI switches from login page to the protected app without waiting on profile fetches.
3. User navigates inside the app:
   - Protected routes only wait for initial auth bootstrap, not for every profile refresh.
   - Dashboard / Keys / Settings each load their own data independently and fail gracefully.
4. User signs out:
   - Local auth state clears immediately.
   - Protected routes redirect to `/login`.
   - Navbar switches back to “Sign in / Get Started”.

Implementation details
1. Refactor `useAuth.tsx`
   - Replace the current “single `isLoading` plus async listener” approach with:
     - `isAuthInitialized` for the one-time startup check
     - action-specific loading states (`isLoginLoading`, `isRegisterLoading`, optionally `isLogoutLoading`)
     - a separate session user state and background profile hydration
   - Make `onAuthStateChange` synchronous:
     - set/clear the current session user immediately
     - set auth initialized immediately
     - trigger profile hydration in a fire-and-forget helper
   - Move profile fetching to a separate helper with request guarding:
     - use a request id / version token so stale fetches cannot overwrite logout or a newer session
     - never block auth readiness on profile fetch success
     - always catch errors and fall back to session metadata
   - Ensure logout clears all local auth state synchronously before or alongside `signOut()`.

2. Fix route protection
   - Update `ProtectedRoute.tsx` to use the new auth bootstrap flag instead of the current generic loading state.
   - Rule:
     - if auth not initialized yet → show spinner
     - if initialized and not authenticated → redirect to login
     - if authenticated → render children immediately

3. Fix login page behavior
   - Keep the button bound only to `isLoginLoading`.
   - Remove assumptions that profile hydration must finish before navigation.
   - Optionally navigate after a confirmed authenticated state rather than immediately after `await login()` if needed for stability.
   - Preserve the resend-verification flow.

4. Fix navbar dropdown reliability
   - Keep using Radix-compatible menu item selection, but remove the ref/composition warning by checking the trigger/content composition and making it fully forward-ref-safe.
   - Ensure the account menu only renders when auth is initialized and authenticated.
   - For navigation items, use deterministic route changes every time.
   - For sign out, clear auth state first, then route home.

5. Harden protected pages against infinite loading
   - `DashboardPage`: wrap `Promise.all(...)` in `try/catch/finally` so loading always ends, even if one request fails.
   - Review `KeysPage` and other protected pages for the same pattern and add graceful error handling where needed.
   - Show an error card/toast instead of leaving the user on an endless loading state.

Current implementation vs target implementation
- Current:
  - auth listener performs awaited profile fetches
  - login performs another awaited profile fetch
  - global loading flag is reused for route gating
  - stale async completions can overwrite newer auth state
  - protected pages can remain blocked by auth or page loader races
- Target:
  - auth listener updates state immediately and never blocks
  - profile fetch is background enrichment only
  - route gating waits only for initial session bootstrap
  - login/logout are single-purpose actions with isolated loading flags
  - every page loader finishes via `finally`, even on errors

Files I would change
- `src/hooks/useAuth.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/Navbar.tsx`
- `src/pages/DashboardPage.tsx`
- Possibly `src/pages/RegisterPage.tsx` to separate sign-up loading from app bootstrap loading
- Possibly `src/pages/KeysPage.tsx` and similar protected pages for error/finally handling

What I would not change
- No database schema changes are needed for this fix.
- No auth backend reconfiguration is needed based on the evidence I reviewed.
- No changes to `src/integrations/supabase/client.ts`.

Verification checklist after implementation
- Refresh while logged out: navbar shows “Sign in / Get Started”.
- Log in with email/password: button returns from “Signing in...”, user reaches dashboard, no full-screen auth spinner loop.
- Open account menu repeatedly: Dashboard, Keys, Settings work every time.
- Sign out from any protected route: redirected out, navbar resets immediately.
- Refresh while logged in: authenticated navbar appears correctly, protected pages load normally.
- Trigger a page data failure: page shows an error state instead of infinite loading.

Root cause summary
The bug is not that login credentials fail. The auth request succeeds, but the frontend auth lifecycle is currently over-coupled to async profile fetching and route gating. That creates race conditions where the app partially thinks the user is signed in (name appears) while protected routes still think auth is unresolved (spinner forever). The fix is to separate “session established” from “profile enriched” and to ensure every loading path has a guaranteed completion path.
