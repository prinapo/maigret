// authStore.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(true); // Initial state should be true, as we are loading auth state
  const loggedIn = ref(false);

  function setUser(userData) {
    user.value = userData;
    loading.value = false; // Set loading to false when user state is determined
    loggedIn.value = true;
  }

  function clearUser() {
    user.value = null;
    loading.value = false; // Set loading to false when user state is determined
    loggedIn.value = false;
  }

  function setLoggedIn(value) {
    loggedIn.value = value;
  }

  // Remove initAuthListener since it's handled by realtimeListeners
  // The auth listener is managed centrally in realtimeListeners.js

  async function logout() {
    const { signOut } = await import("firebase/auth");
    const { auth } = await import("src/boot/firebase");
    await signOut(auth);
    // clearUser will be called automatically by the auth listener
  }

  return {
    user,
    loading,
    loggedIn,
    setUser,
    clearUser,
    setLoggedIn,
    logout,
    $reset() {
      user.value = null;
      loading.value = true;
      loggedIn.value = false;
    },
  };
});
