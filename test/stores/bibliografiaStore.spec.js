import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBibliografiaStore } from 'src/stores/bibliografiaStore';
import { useUserStore } from 'src/stores/userStore';

describe('bibliografiaStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Image Management', () => {
    it('should not allow non-superadmin users to add images', () => {
      const userStore = useUserStore();
      const bibliografiaStore = useBibliografiaStore();

      // Test with a regular user
      userStore.setUser({ uid: 'test-user', role: 'user' });
      expect(bibliografiaStore.canAddImage).toBe(false);

      // Test with an admin user
      userStore.setUser({ uid: 'test-admin', role: 'admin' });
      expect(bibliografiaStore.canAddImage).toBe(false);
    });

    it('should allow superadmin users to add images', () => {
      const userStore = useUserStore();
      const bibliografiaStore = useBibliografiaStore();

      userStore.setUser({ uid: 'test-superadmin', role: 'superadmin' });
      expect(bibliografiaStore.canAddImage).toBe(true);
    });
  });
});