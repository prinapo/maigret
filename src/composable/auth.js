import { ref } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseInit";

export const useAuth = () => {
  const isLoggedIn = ref(false);
  const userId = ref(null); // Initialize userID

  const checkAuthState = () => {
    onAuthStateChanged(auth, (user) => {
      isLoggedIn.value = !!user;
      userId.value = user ? user.uid : null; // Set userID if user is logged in
    });
  };

  return { isLoggedIn, userId, checkAuthState };
};
