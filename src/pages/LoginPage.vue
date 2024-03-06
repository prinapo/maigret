<!-- LoginPage.vue -->
<template>
  <q-page>
    <q-page-container>
      <div class="q-pa-md">
        <h1>Login</h1>
        <div v-if="!isLoggedIn">
          <q-form @submit="login">
            <q-input v-model="email" label="Email" />
            <q-input v-model="password" type="password" label="Password" />
            <q-btn type="submit" label="Login" color="primary" />
          </q-form>
        </div>
        <div v-else>
          <p>You are already logged in!</p>
          <q-btn label="Logout" color="negative" @click="logout" />
        </div>
      </div>
    </q-page-container>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebaseInit";
import { useRouter } from "vue-router"; // Import useRouter from Vue Router

const email = ref("");
const password = ref("");
const router = useRouter(); // Initialize the router
const isLoggedIn = ref(false); // Variable to track the user's login status

const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    // Redirect to the main page after successful login
    router.push("/");
  } catch (error) {
    console.error("Error logging in:", error);
    // Handle login error (e.g., display error message)
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    isLoggedIn.value = false; // Update the isLoggedIn variable to false after logout
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// Check if the user is already logged in when the component is mounted
onAuthStateChanged(auth, (user) => {
  isLoggedIn.value = !!user; // Update the isLoggedIn variable based on the user's authentication state
  console.log("User logged in:", isLoggedIn.value);
});
</script>
