import { useContext } from 'react';
import { AuthContext } from '@context/AuthContext';

/**
 * Convenience hook for consuming AuthContext.
 * Throws a helpful error when used outside <AuthProvider> to prevent silent failures.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>. Wrap your app with <AuthProvider>.');
  }
  return context;
}
