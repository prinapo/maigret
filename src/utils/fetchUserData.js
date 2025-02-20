import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { getUserData, setUserData } from "./indexedDB";
import { useAuth } from "../composable/auth"; // Import useAuth

const { userId, checkAuthState } = useAuth();
checkAuthState();

export async function fetchUserData() {
  try {
    if (!navigator.onLine) {
      const localUserData = await getUserData();
      return localUserData;
    }

    const userIdValue = userId.value;

    if (userIdValue) {
      const userDocRef = doc(db, "Users", userIdValue);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        return null;
      }

      const userData = userDocSnap.data();

      await setUserData(userData);

      return "User data successfully fetched";
    }

    return "No user data found";
  } catch (error) {
    console.error("Error in fetchAndCacheUserData:", error);
    throw error;
  }
}
