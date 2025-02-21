<!-- LoginPage.vue -->
<template>
  <q-page
    class="window-height window-width row justify-center items-center"
    style="background: linear-gradient(#8274c5, #5a4a9f)"
  >
    <div class="column q-pa-lg" v-if="!isLoggedIn">
      <div class="row">
        <q-card square class="shadow-24" style="width: 300px; height: 485px">
          <q-card-section class="bg-deep-purple-7">
            <h4 class="text-h5 text-white q-my-md">Maigret Collectors</h4>
            <p class="text-white q-my-md">
              {{ currentUser ? currentUser.email : "Not logged in" }} ({{
                isLoggedIn ? "Logged In" : "Logged Out"
              }})
            </p>
            <div
              class="absolute-bottom-right q-pr-md"
              style="transform: translateY(50%)"
            >
              <q-btn
                fab
                icon="add"
                color="purple-4"
                @click="registrationPage"
                style="min-height: 48dp"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <q-form class="q-px-sm q-pt-xl" @submit="login">
              <q-input
                square
                clearable
                v-model="email"
                type="email"
                label="Email"
                style="min-height: 48dp"
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
              <q-input
                square
                clearable
                style="min-height: 48dp"
                v-model="password"
                type="password"
                label="Password"
                :append-icon="
                  isPasswordVisible ? 'visibility' : 'visibility_off'
                "
                :append-icon-cb="() => (isPasswordVisible = !isPasswordVisible)"
                :input-type="isPasswordVisible ? 'text' : 'password'"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
              <q-card-actions class="q-px-lg">
                <q-btn
                  unelevated
                  size="lg"
                  color="purple-4"
                  class="full-width text-white"
                  label="Login"
                  type="submit"
                  style="min-height: 48dp"
                />
              </q-card-actions>
              <q-card-section class="text-center q-pa-sm">
                <p class="text-grey-6">
                  Forgot your password?
                  <a href="#" @click="forgotPassword">Reset it</a>
                </p>
              </q-card-section>
            </q-form>
          </q-card-section>
          <!-- <q-card-section>
            <div class="text-center q-pa-md q-gutter-md">
              <q-btn round color="indigo-7">
                <q-icon name="fab fa-facebook-f" size="1.2rem" />
              </q-btn>
              <q-btn round color="red-8">
                <q-icon name="fab fa-google-plus-g" size="1.2rem" />
              </q-btn>
              <q-btn round color="light-blue-5">
                <q-icon name="fab fa-twitter" size="1.2rem" />
              </q-btn>
            </div>
          </q-card-section> -->
        </q-card>
      </div>
    </div>
    <div class="column q-pa-lg" v-if="isLoggedIn">
      <div class="row">
        <q-card square class="shadow-24" style="width: 300px; height: 485px">
          <q-card-section class="bg-deep-purple-7">
            <h4 class="text-h5 text-white q-my-md">Sei collegato come:</h4>
            <p class="text-white q-my-md">
              {{ currentUser ? currentUser.email : "Not logged in" }}
              ({{ isLoggedIn ? "Logged In" : "Logged Out" }})
              {{ isAdmin ? "(Admin)" : isCollector ? "(Collector)" : "" }}
            </p>
            <div
              class="absolute-bottom-right q-pr-md"
              style="transform: translateY(50%)"
            >
              <q-btn
                fab
                icon="close"
                color="purple-4"
                style="min-height: 48dp"
              />
            </div>
          </q-card-section>

          <q-card-actions class="q-px-lg">
            <q-btn
              unelevated
              size="lg"
              color="purple-4"
              class="full-width text-white"
              label="Logout"
              @click="logout"
            />
          </q-card-actions>
          <q-card-section class="text-center q-pa-sm">
            <p class="text-grey-6"></p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { useAuth } from "../composable/auth";
import { auth } from "../firebase/firebaseInit";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const email = ref("");
const password = ref("");
const router = useRouter();
const $q = useQuasar();
const currentUser = ref(null);
const isPasswordVisible = ref(false);
const { isLoggedIn, userId, isAdmin, isCollector, checkAuthState } = useAuth();

const registrationPage = () => {
  router.push({ name: "registration" });
};
onMounted(() => {
  checkAuthState();
});
const login = async () => {
  if (!email.value.trim()) {
    // Check if email is empty or contains only whitespace
    alert("Login Error", "Please enter a valid email address.");
    return;
  }

  if (!password.value.trim()) {
    // Check if password is empty or contains only whitespace
    alert("Login Error", "Please enter your password.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    const user = userCredential.user;

    // Check if the user is logged in and their email is verified
    if (user && user.emailVerified) {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId && storedUserId !== user.uid) {
        // Clear all local storage variables if the logged-in user is different
        localStorage.clear();
      }
      // Save the user ID in local storage
      localStorage.setItem("userId", user.uid);
      alert("Logged in", "To logout, go back to the login page");

      // Redirect to the desired page after successful login
      router.push("/");
    } else {
      // Handle the case where the user is logged in but email is not verified
      alert(
        "Email Verification Required",
        "Please verify your email before logging in.",
      );
    }
  } catch (error) {
    console.error("Error logging in:", error);
    alert("Login Error", error.message); // Show error dialog
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    isLoggedIn.value = false;
    isAdmin.value = false;
    isCollector.value = false;
  } catch (error) {
    console.error("Error logging out:", error);
    alert("Logout Error", error.message); // Show error dialog
  }
};

const forgotPassword = async () => {
  if (!email.value.trim()) {
    // Check if email is empty or contains only whitespace
    alert("Login Error", "Please enter a valid email address.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.value);
    // Optionally, provide feedback to the user that the email has been sent
  } catch (error) {
    console.error("Error sending password reset email:", error);
    alert("Password Reset Error", error.message); // Show error dialog
  }
};

onAuthStateChanged(auth, (user) => {
  if (user && user.email && user.emailVerified) {
    isLoggedIn.value = true;
    currentUser.value = user;
  } else {
    isLoggedIn.value = false;
    currentUser.value = null;
  }
});

const alert = (title, message) => {
  $q.dialog({
    title: title,
    message: message,
  })
    .onOk(() => {})
    .onCancel(() => {})
    .onDismiss(() => {});
};
</script>
