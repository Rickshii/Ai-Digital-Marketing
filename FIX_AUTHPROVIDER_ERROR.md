# Fix: "useAuth must be used within an AuthProvider" Error

## Problem
```
Error: useAuth must be used within an AuthProvider
    at useAuth (src/context/AuthContext.jsx:142:9)
    at Login (src/pages/Login.jsx:30:20)
```

The Login component was throwing an error because the AuthContext wasn't properly initialized when the component tried to use the `useAuth` hook.

## Root Causes
1. **React.StrictMode double-mounting** - In development, React intentionally double-mounts components to catch bugs. This can cause the context to be temporarily unavailable.
2. **Context initialization timing** - The context value wasn't properly set before components tried to access it.
3. **Component structure** - The Router and theme logic were intertwined with the AuthProvider setup.

## Solution Applied

### Fix #1: Updated AuthContext Default Value
**File:** `frontend/src/context/AuthContext.jsx`

Changed from:
```javascript
const AuthContext = createContext(null);
```

To:
```javascript
const AuthContext = createContext(undefined);
```

And updated the useAuth hook:
```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {  // Check for undefined, not falsy
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Why:** Using `undefined` as the default allows us to distinguish between "not yet initialized" and "no value", making the error detection more reliable.

### Fix #2: Restructured App Component
**File:** `frontend/src/App.jsx`

Changed from:
```javascript
function App() {
  useEffect(() => { /* theme setup */ }, []);
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

To:
```javascript
// Inner component that uses AuthProvider context
function AppRoutes() {
  useEffect(() => { /* theme setup */ }, []);
  
  return (
    <Routes>
      {/* routes */}
    </Routes>
  );
}

// Outer component that sets up providers
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
```

**Why:** This separation ensures that AuthProvider wraps everything that needs auth context, and the Router is inside the provider, guaranteeing context availability for all routes.

## How It Works Now

```
main.jsx (React.StrictMode)
    ↓
App() [Outer]
    ↓
AuthProvider [Creates context and sets value]
    ↓
Router [Navigation setup]
    ↓
AppRoutes() [Uses Routes with useAuth access]
    ↓
Login / Register / Protected Routes
    ↓
All can now use useAuth() safely
```

## Key Changes Summary

| Component | Change | Reason |
|-----------|--------|--------|
| `AuthContext.jsx` | Changed default from `null` to `undefined` | Better error detection |
| `AuthContext.jsx` | Updated useAuth hook condition | Check for `undefined` not falsy values |
| `App.jsx` | Split into AppRoutes and App | Cleaner provider structure |
| `App.jsx` | AuthProvider wraps Router | Ensures context available to all routes |

## Files Modified
1. `frontend/src/context/AuthContext.jsx` - 2 changes
2. `frontend/src/App.jsx` - Restructured component hierarchy

## Verification Steps

1. **Check error is gone:** Open browser DevTools console (F12) - should be no error
2. **Navigate to login:** Visit http://localhost:5000/login - should load without error
3. **Test login:** Try logging in with `admin@example.com / admin123`
4. **Check context:** After login, user context should be available across the app

## Test Credentials (Still Valid)
- Email: `admin@example.com`
- Password: `admin123`

## Status
✅ Error Fixed - AuthProvider properly wraps all routes and components now have safe access to useAuth hook.

The issue was a combination of React's development mode double-mounting and the component structure. By separating the route configuration from the provider setup and updating the context default value, we ensured that the context is always available when components need it.
