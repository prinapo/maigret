import { ref } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseInit";

export const useAuth = () => {
  const isLoggedIn = ref(false);

  const checkAuthState = () => {
    onAuthStateChanged(auth, (user) => {
      isLoggedIn.value = !!user;
    });
  };

  return { isLoggedIn, checkAuthState };
};
