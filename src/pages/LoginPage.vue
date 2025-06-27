<template>
  <q-page class="flex flex-center">
    <q-card
      flat
      class="q-pa-md q-mx-sm rounded-borders"
      style="width: 100%; max-width: 400px"
    >
      <q-card-section class="q-pb-sm">
        <div class="text-h5 text-primary text-center">
          {{ isAdmin ? "(Admin) " : "" }}Maigret Collectors
        </div>
        <div class="text-caption text-center q-mt-xs">
          {{ user ? user.email : "Please login to continue" }}
        </div>
      </q-card-section>

      <q-separator spaced />

      <template v-if="!user">
        <q-form @submit.prevent="login" class="q-gutter-y-md">
          <q-input
            filled
            v-model="email"
            type="email"
            :label="$t('login.email')"
            color="primary"
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => isValidEmail(val) || 'Invalid email format',
            ]"
            :error="!!formErrors.email"
            :error-message="formErrors.email"
            :disable="isLoading || loading"
            @update:model-value="clearError('email')"
            dense
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            filled
            v-model="password"
            :type="isPasswordVisible ? 'text' : 'password'"
            :label="$t('login.password')"
            color="primary"
            :rules="[(val) => !!val || 'Password is required']"
            :error="!!formErrors.password"
            :error-message="formErrors.password"
            :disable="isLoading || loading"
            @update:model-value="clearError('password')"
            dense
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isPasswordVisible ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="isPasswordVisible = !isPasswordVisible"
              />
            </template>
          </q-input>

          <q-btn
            unelevated
            type="submit"
            color="primary"
            class="full-width"
            size="lg"
            :loading="isLoading"
            :disable="!isFormValid || isLoading || loading"
            :label="$t('login.loginButton')"
          />

          <div class="text-center text-caption text-grey-6">
            Forgot your password?
            <a
              href="#"
              @click.prevent="forgotPassword"
              :class="{ disabled: isLoading || loading }"
            >
              Reset it
            </a>
          </div>
        </q-form>
      </template>

      <template v-else>
        <q-card-section>
          <q-btn
            unelevated
            color="secondary"
            class="full-width"
            size="lg"
            @click="handleLogout"
            :loading="isLoading"
            :disable="loading"
            :label="$t('login.logoutButton')"
          />
        </q-card-section>
      </template>

      <q-separator spaced />

      <div class="row justify-end">
        <q-btn
          v-if="!user"
          flat
          round
          icon="person_add"
          color="secondary"
          @click="registrationPage"
          :disable="isLoading || loading"
        />
      </div>
    </q-card>

    <!-- Dialog e Loading restano invariati -->
    <q-dialog v-model="showErrorDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t(errorDialog.title) }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ errorDialog.message }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.close')"
            color="primary"
            v-close-popup
          />
          <q-btn
            v-if="errorDialog.action"
            flat
            :label="$t(errorDialog.actionLabel)"
            color="primary"
            @click="errorDialog.action"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-inner-loading :showing="loading" color="secondary">
      <q-spinner-dots size="50px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { auth } from "boot/firebase";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const userStore = useUserStore();
const { user, loading } = authStore;

const email = ref("");
const password = ref("");
const isPasswordVisible = ref(false);
const isLoading = ref(false);
const formErrors = ref({ email: null, password: null });

const showErrorDialog = ref(false);
const errorDialog = ref({
  title: "",
  message: "",
  action: null,
  actionLabel: "",
});

const isFormValid = computed(
  () =>
    email.value &&
    password.value &&
    isValidEmail(email.value) &&
    !formErrors.value.email &&
    !formErrors.value.password,
);

const isAdmin = computed(
  () => userStore.user?.role === "admin" || userStore.user?.isAdmin,
);

const clearError = (field) => {
  if (field) formErrors.value[field] = null;
  else formErrors.value = { email: null, password: null };
};

const showError = (title, message, action = null, actionLabel = null) => {
  errorDialog.value = { title, message, action, actionLabel };
  showErrorDialog.value = true;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const registrationPage = () => {
  if (!isLoading.value && !loading.value) {
    router.push({ name: "registration" });
  }
};

const handleAuthError = (error) => {
  let message = "An error occurred during authentication.";
  switch (error.code) {
    case "auth/user-not-found":
      message = "No account found with this email address.";
      break;
    case "auth/wrong-password":
      message = "Incorrect password.";
      break;
    case "auth/invalid-email":
      message = "Invalid email address.";
      break;
    case "auth/user-disabled":
      message = "This account has been disabled.";
      break;
    case "auth/too-many-requests":
      message = "Too many failed attempts. Please try again later.";
      break;
    case "auth/network-request-failed":
      message = "Network error. Please check your connection.";
      break;
    default:
      message = error.message || message;
  }
  showError("Authentication Error", message);
};

const login = async () => {
  try {
    clearError();
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

    isLoading.value = true;
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    const firebaseUser = userCredential.user;

    if (!firebaseUser.emailVerified) {
      showError(
        "Email Verification Required",
        "Please verify your email before logging in.",
        () => sendEmailVerification(firebaseUser),
        "Resend Verification",
      );
      return;
    }

    router.push("/");
    $q.notify({
      type: "positive",
      message: "Login successful!",
      position: "top",
    });
  } catch (error) {
    console.error("Login error:", error);
    handleAuthError(error);
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    isLoading.value = true;
    await authStore.logout();
    await router.push("/login");
    $q.notify({
      type: "info",
      message: "Logged out successfully",
      position: "top",
    });
  } catch (error) {
    console.error("Logout error:", error);
    handleAuthError(error);
  } finally {
    isLoading.value = false;
  }
};

const forgotPassword = async () => {
  try {
    if (isLoading.value || loading.value) return;
    if (!email.value.trim()) {
      formErrors.value.email = "Please enter your email address";
      return;
    }
    if (!isValidEmail(email.value)) {
      formErrors.value.email = "Invalid email format";
      return;
    }

    isLoading.value = true;
    await sendPasswordResetEmail(auth, email.value);
    showError(
      "Password Reset",
      "Password reset email sent. Please check your inbox.",
    );
  } catch (error) {
    console.error("Password reset error:", error);
    handleAuthError(error);
  } finally {
    isLoading.value = false;
  }
};

onUnmounted(() => {});
</script>

<style scoped>
.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.rounded-borders {
  border-radius: 12px;
}
</style>
