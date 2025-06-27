<template>
  <q-page
    class="bg-grey-1 window-height window-width row justify-center items-center"
  >
    <q-card
      class="q-pa-lg shadow-2 rounded-borders"
      style="width: 100%; max-width: 400px"
    >
      <q-card-section class="q-pt-none">
        <div class="text-h6 text-primary text-center">{{ $t('registration.title') }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="register">
          <q-input
            v-model="name"
            :label="$t('registration.name')"
            outlined
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || 'Il nome è obbligatorio']"
          />
          <q-input
            v-model="email"
            :label="$t('registration.email')"
            type="email"
            outlined
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || 'L\'email è obbligatoria']"
          />
          <q-input
            v-model="password"
            :label="$t('registration.password')"
            type="password"
            outlined
            dense
            class="q-mb-md"
            :rules="[(val) => !!val || 'La password è obbligatoria']"
          />

          <div class="q-mb-md">
            <q-btn
              :label="$t('registration.register')"
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
            />
          </div>
        </q-form>

        <div class="text-caption text-center">
          Hai già un account?
          <q-btn flat :label="$t('registration.loginLink')" to="/login" color="primary" size="sm" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "src/boot/firebase";
import { useRouter } from "vue-router";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useQuasar } from "quasar";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const userStore = useUserStore();

// State
const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const acceptTerms = ref(false);
const isPasswordVisible = ref(false);
const isConfirmPasswordVisible = ref(false);
const isLoading = ref(false);
const showTerms = ref(false);
const showPrivacy = ref(false);
const formErrors = ref({
  fullName: null,
  email: null,
  password: null,
  confirmPassword: null,
});

const showErrorDialog = ref(false);
const errorDialog = ref({
  title: "",
  message: "",
  action: null,
  actionLabel: "",
});

// Computed
const isFormValid = computed(() => {
  return (
    fullName.value &&
    email.value &&
    password.value &&
    confirmPassword.value &&
    acceptTerms.value &&
    isValidEmail(email.value) &&
    isValidPassword(password.value) &&
    password.value === confirmPassword.value &&
    !formErrors.value.fullName &&
    !formErrors.value.email &&
    !formErrors.value.password &&
    !formErrors.value.confirmPassword
  );
});

// Methods
const clearError = (field) => {
  if (field) {
    formErrors.value[field] = null;
  } else {
    formErrors.value = {
      fullName: null,
      email: null,
      password: null,
      confirmPassword: null,
    };
  }
};

const showError = (title, message, action = null, actionLabel = null) => {
  errorDialog.value = {
    title,
    message,
    action,
    actionLabel,
  };
  showErrorDialog.value = true;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(
    password,
  );
};

const goToLoginPage = () => {
  if (!isLoading.value) {
    router.push("/login");
  }
};

const handleAuthError = (error) => {
  let message = "An error occurred during registration.";

  switch (error.code) {
    case "auth/email-already-in-use":
      message = "This email address is already registered.";
      break;
    case "auth/invalid-email":
      message = "Invalid email address.";
      break;
    case "auth/operation-not-allowed":
      message = "Email/password accounts are not enabled.";
      break;
    case "auth/weak-password":
      message = "Password is too weak.";
      break;
    case "auth/network-request-failed":
      message = "Network error. Please check your connection.";
      break;
    default:
      message = error.message || message;
  }

  showError("Registration Error", message);
};

const registerUser = async () => {
  try {
    // Reset errors
    clearError();

    // Validate form
    if (!fullName.value.trim()) {
      formErrors.value.fullName = "Full name is required";
      return;
    }

    if (!email.value.trim()) {
      formErrors.value.email = "Email is required";
      return;
    }

    if (!isValidEmail(email.value)) {
      formErrors.value.email = "Invalid email format";
      return;
    }

    if (!password.value.trim()) {
      formErrors.value.password = "Password is required";
      return;
    }

    if (!isValidPassword(password.value)) {
      formErrors.value.password = "Password must meet all requirements";
      return;
    }

    if (password.value !== confirmPassword.value) {
      formErrors.value.confirmPassword = "Passwords do not match";
      return;
    }

    if (!acceptTerms.value) {
      $q.notify({
        type: "negative",
        message: "Please accept the terms and conditions",
        position: "top",
      });
      return;
    }

    isLoading.value = true;

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );

    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName: fullName.value,
    });

    // Send verification email
    await sendEmailVerification(userCredential.user);

    // Create user profile using userStore (with no permissions)
    await userStore.createUserProfile({
      ...userCredential.user,
      displayName: fullName.value,
    });

    // Show success message with beta instructions
    showError(
      "Registration Successful",
      `Welcome to the Maigret Collectors beta test! Please check your email to verify your account, then send an email to beta@maigret.com with your registered email address to request collector access.`,
      () => router.push("/login"),
      "Go to Login",
    );

    // Reset form
    fullName.value = "";
    email.value = "";
    password.value = "";
    confirmPassword.value = "";
    acceptTerms.value = false;

    $q.notify({
      type: "positive",
      message:
        "Registration successful! Check your email and contact us for beta access.",
      position: "top",
      timeout: 5000,
    });
  } catch (error) {
    console.error("Registration error:", error);
    handleAuthError(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.q-card {
  width: 100%;
  max-width: 400px;
}

ul {
  margin: 0;
  padding-left: 1.2em;
}

li {
  margin-bottom: 0.2em;
}
</style>
