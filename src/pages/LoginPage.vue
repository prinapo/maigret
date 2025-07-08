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
          {{ user ? user.email : t("login.pleaseLogin") }}
        </div>
      </q-card-section>

      <q-separator spaced />

      <template v-if="!user">
        <q-form @submit.prevent="login" class="q-gutter-y-md">
          <q-input
            filled
            v-model="email"
            type="email"
            :label="t('login.email')"
            color="primary"
            :rules="[
              (val) => !!val || t('login.emailRequired'),
              (val) => isValidEmail(val) || t('login.invalidEmailFormat'),
            ]"
            :error="!!formErrors.email"
            :error-message="formErrors.email"
            :disable="isLoading || loading"
            @update:model-value="clearError('email')"
            dense
            autocomplete="username"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            filled
            v-model="password"
            :type="isPasswordVisible ? 'text' : 'password'"
            :label="t('login.password')"
            color="primary"
            :rules="[(val) => !!val || t('login.passwordRequired')]"
            :error="!!formErrors.password"
            :error-message="formErrors.password"
            :disable="isLoading || loading"
            @update:model-value="clearError('password')"
            dense
            autocomplete="current-password"
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
            :label="t('login.loginButton')"
          />

          <div class="text-center text-caption text-grey-6">
            {{ t("login.forgotPassword") }}
            <a
              href="#"
              @click.prevent="forgotPassword"
              :class="{ disabled: isLoading || loading }"
            >
              {{ t("login.resetIt") }}
            </a>
          </div>
        </q-form>
      </template>

      <template v-else>
        <q-card-section class="text-center">
          <div class="q-mb-md">
            <q-icon name="person" size="2em" color="primary" />
          </div>
          <div class="text-subtitle1 q-mb-sm">
            {{ t("login.alreadyLoggedIn") }} <b>{{ user.email }}</b>
          </div>
          <q-btn
            unelevated
            color="negative"
            class="full-width q-mt-md"
            size="lg"
            @click="handleLogout"
            :loading="isLoading"
            :disable="loading"
            :label="t('login.logoutButton')"
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

    <q-inner-loading :showing="loading && !user" color="secondary">
      <q-spinner-dots size="50px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from "vue";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { auth } from "boot/firebase";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { showNotifyPositive, showNotifyNegative } from "src/utils/notify";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const { user, loading } = storeToRefs(authStore);
const { t } = useI18n();

const email = ref("");
const password = ref("");
const isPasswordVisible = ref(false);
const isLoading = ref(false);
const formErrors = ref({ email: null, password: null });

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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const registrationPage = () => {
  if (!isLoading.value && !loading.value) {
    router.push({ name: "registration" });
  }
};

const handleAuthError = (error) => {
  let message = t("auth.anErrorOccurred");
  switch (error.code) {
    case "auth/user-not-found":
      message = t("auth.noAccountFound");
      break;
    case "auth/wrong-password":
      message = t("auth.incorrectPassword");
      break;
    case "auth/invalid-email":
      message = t("auth.invalidEmail");
      break;
    case "auth/user-disabled":
      message = t("auth.accountDisabled");
      break;
    case "auth/too-many-requests":
      message = t("auth.tooManyRequests");
      break;
    case "auth/network-request-failed":
      message = t("auth.networkError");
      break;
    default:
      message = error.message || message;
  }
  showNotifyNegative(message);
};

const login = async () => {
  try {
    console.log("[LOGIN] Start login");
    clearError();
    if (!email.value.trim()) {
      console.log("[LOGIN] Email vuota");
      formErrors.value.email = t("login.emailRequired");
      return;
    }
    if (!isValidEmail(email.value)) {
      console.log("[LOGIN] Email non valida:", email.value);
      formErrors.value.email = t("login.invalidEmailFormat");
      return;
    }
    if (!password.value.trim()) {
      console.log("[LOGIN] Password vuota");
      formErrors.value.password = t("login.passwordRequired");
      return;
    }

    isLoading.value = true;
    console.log("[LOGIN] Chiamo signInWithEmailAndPassword", email.value);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    console.log("[LOGIN] signInWithEmailAndPassword OK", userCredential);
    const firebaseUser = userCredential.user;

    if (!firebaseUser.emailVerified) {
      console.log("[LOGIN] Email non verificata");
      showNotifyNegative(t("login.emailVerificationRequired"));
      return;
    }

    console.log("[LOGIN] Login riuscito, redirect");
    router.push("/");
    showNotifyPositive(t("login.loginSuccessful"));
  } catch (error) {
    console.error("[LOGIN] Login error:", error);
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
    showNotifyPositive(t("login.loggedOutSuccessfully"));
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
      formErrors.value.email = t("login.pleaseEnterEmail");
      return;
    }
    if (!isValidEmail(email.value)) {
      formErrors.value.email = t("login.invalidEmailFormat");
      return;
    }

    isLoading.value = true;
    await sendPasswordResetEmail(auth, email.value);
    showNotifyPositive(t("login.passwordReset"));
  } catch (error) {
    console.error("Password reset error:", error);
    handleAuthError(error);
  } finally {
    isLoading.value = false;
  }
};
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
