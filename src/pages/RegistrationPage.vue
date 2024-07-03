<template>
  <q-page
    class="window-height window-width row justify-center items-center"
    style="background: linear-gradient(#8274c5, #5a4a9f)"
  >
    <div class="column q-pa-lg">
      <div class="row">
        <q-card square class="shadow-24" style="width: 300px; height: 485px">
          <q-card-section class="bg-deep-purple-7">
            <h4 class="text-h5 text-white q-my-md">Registration</h4>
            <div
              class="absolute-bottom-right q-pr-md"
              style="transform: translateY(50%)"
            >
              <q-btn fab icon="close" color="purple-4" @click="goToLoginPage" />
            </div>
          </q-card-section>
          <q-card-section>
            <q-form class="q-px-sm q-pt-xl q-pb-lg" @submit="registerUser">
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
                v-model="password"
                type="password"
                label="Password"
                style="min-height: 48dp"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-lg">
            <q-btn
              unelevated
              size="lg"
              color="purple-4"
              class="full-width text-white"
              label="Get Started"
              @click="registerUser"
              style="min-height: 48dp"
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
import { ref } from "vue";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase/firebaseInit";
import { useRouter } from "vue-router"; // Import useRouter from Vue Router
import { useQuasar } from "quasar";
import { db } from "../firebase/firebaseInit";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

const $q = useQuasar();

const email = ref("");
const password = ref("");
const router = useRouter(); // Initialize the router

const registerUser = async () => {
  try {
    // Validate email and password inputs
    if (!isValidEmail(email.value)) {
      throw new Error("Invalid email address.");
    }
    if (!isValidPassword(password.value)) {
      throw new Error(
        "Invalid password. Password must be at least 6 characters long.",
      );
    }

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );

    // Send verification email
    await sendEmailVerification(userCredential.user);
    email.value = "";
    password.value = "";

    // Add user's information to Firestore
    await addUserInfo(userCredential.user.uid);

    // Redirect to the login page after successful registration
    router.push("/login");
    showNotification("Verification email sent. Please check your inbox.");
  } catch (error) {
    console.error("Error registering user:", error);
    showErrorNotification("Registration Error", error.message);
  }
};

const isValidEmail = (email) => {
  // Implement email validation logic here
  return /\S+@\S+\.\S+/.test(email);
};

const isValidPassword = (password) => {
  // Implement password validation logic here
  return password.length >= 6;
};

const addUserInfo = async (uid) => {
  try {
    // Specify the collection reference correctly
    const userRef = doc(db, "Users", uid);

    // Add user's information to Firestore
    await setDoc(userRef, {
      name: "", // Add user's name
      lastName: "", // Add user's last name
      role: "user", // Set user's role to 'user'
      uid: uid,
      // Add more fields as needed
    });
  } catch (error) {
    console.error("Error adding user info to Firestore:", error);
    throw new Error("Failed to add user information to Firestore.");
  }
};

const showNotification = (message) => {
  $q.notify({
    color: "positive",
    textColor: "white",
    position: "top",
    message: message,
  });
};

const showErrorNotification = (title, message) => {
  $q.notify({
    color: "negative",
    textColor: "white",
    position: "top",
    message: title + ": " + message,
  });
};

const goToLoginPage = () => {
  router.push("/login"); // Redirect to the login page
};

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
