import { ref } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseInit";

export const useAuth = () => {
  const isLoggedIn = ref(false);
  const userID = ref(null); // Initialize userID

  const checkAuthState = () => {
    onAuthStateChanged(auth, (user) => {
      isLoggedIn.value = !!user;
      userID.value = user ? user.uid : null; // Set userID if user is logged in
    });
  };

  return { isLoggedIn, userID, checkAuthState };
};
