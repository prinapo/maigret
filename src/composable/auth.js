import { ref } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseInit";

export const useAuth = () => {
  const isLoggedIn = ref(false);
  const userId = ref(null);
  const isAdmin = ref(false);
  const isCollector = ref(false);

  const checkAuthState = async () => {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(
        auth,
        async (user) => {
          isLoggedIn.value = !!user;
          userId.value = user ? user.uid : null;

          if (user) {
            try {
              const userDocRef = doc(db, "Users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                isAdmin.value = userData.role === "admin";
                isCollector.value = userData.role === "collector";
              } else {
                console.error("No such document!");
                isAdmin.value = false;
                isCollector.value = false;
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
              isAdmin.value = false;
              isCollector.value = false;
            }
          } else {
            isAdmin.value = false;
            isCollector.value = false;
          }

          resolve();
        },
        reject,
      );
    });
  };

  return { isLoggedIn, userId, isAdmin, isCollector, checkAuthState };
};
