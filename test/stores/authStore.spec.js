import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from 'stores/authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with correct default values', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.loading).toBe(true);
  });

  it('sets user data correctly', () => {
    const store = useAuthStore();
    const userData = { uid: '123', email: 'test@example.com' };
    store.setUser(userData);
    expect(store.user).toEqual(userData);
    expect(store.loading).toBe(false);
  });

  it('clears user data on logout', () => {
    const store = useAuthStore();
    store.setUser({ uid: '123' });
    store.clearUser();
    expect(store.user).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('resets to initial state', () => {
    const store = useAuthStore();
    store.setUser({ uid: '123' });
    store.$reset();
    expect(store.user).toBeNull();
    expect(store.loading).toBe(true);
  });
});