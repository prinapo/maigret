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
            <div
              class="absolute-bottom-right q-pr-md"
              style="transform: translateY(50%)"
            >
              <q-btn
                fab
                icon="add"
                color="purple-4"
                @click="registrationPage"
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
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
              <q-input
                square
                clearable
                v-model="password"
                type="password"
                label="Password"
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
            <h4 class="text-h5 text-white q-my-md">
              you are logged in as:{{ currentUser ? currentUser.email : "" }}
            </h4>
            <div
              class="absolute-bottom-right q-pr-md"
              style="transform: translateY(50%)"
            >
              <q-btn fab icon="close" color="purple-4" />
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
            <p class="text-grey-6">Return to login</p>
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
import { auth } from "../firebase/firebaseInit";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const email = ref("");
const password = ref("");
const router = useRouter();
const isLoggedIn = ref(false);
const $q = useQuasar();
const currentUser = ref(null);

const registrationPage = () => {
  router.push({ name: "registration" });
};

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
    console.log("user afetr try", user);

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
    localStorage.setItem("userId", userID.value);
    await signOut(auth);
    isLoggedIn.value = false;
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
    console.log("Password reset email sent successfully.");
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
  console.log("User logged in:", isLoggedIn.value);
});

const alert = (title, message) => {
  $q.dialog({
    title: title,
    message: message,
  })
    .onOk(() => {
      // console.log('OK')
    })
    .onCancel(() => {
      // console.log('Cancel')
    })
    .onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
};
</script>
