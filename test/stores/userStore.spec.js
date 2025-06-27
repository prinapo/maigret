import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Hoist the mock functions
const { doc, setDoc, getDoc, getFirestore, updateDoc } = vi.hoisted(() => {
  return {
    getFirestore: vi.fn(),
    doc: vi.fn((db, collection, id) => ({ path: `${collection}/${id}` })),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    updateDoc: vi.fn(() => Promise.resolve())
  }
});

// Mock the entire firebase/firestore module
vi.mock('firebase/firestore', () => ({
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
}));

import { useUserStore } from 'src/stores/userStore';

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const store = useUserStore();
    expect(store.user).toBeNull();
    expect(store.lastLogin).toBeNull();
  });

  it('sets user data correctly', () => {
    const store = useUserStore();
    const userData = { uid: 'test-uid', email: 'test@example.com', role: 'admin' };
    store.setUser(userData);
    expect(store.user.uid).toBe('test-uid');
    expect(store.user.role).toBe('admin');
  });

  it('creates a user profile successfully', async () => {
    const store = useUserStore();
    const user = { uid: 'new-user', email: 'new@example.com' };

    await store.createUserProfile(user);

    // Check that the firestore functions were called with the correct parameters
    expect(doc).toHaveBeenCalledWith(undefined, 'Users', 'new-user');
    expect(setDoc).toHaveBeenCalled();

    // Check that the store state was updated
    expect(store.user).not.toBeNull();
    expect(store.user.uid).toBe('new-user');
    expect(store.user.role).toBe('user');
  });
});