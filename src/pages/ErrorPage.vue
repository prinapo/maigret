<template>
  <q-page class="column items-center justify-center">
    <div class="text-center">
      <q-icon
        name="error_outline"
        color="negative"
        size="5rem"
        class="q-mb-md"
      />
      <h4 class="text-h4 text-negative q-mt-none q-mb-md">
        {{ title }}
      </h4>
      <p class="text-body1 q-mb-lg">{{ message }}</p>
      <div class="text-body2 text-grey q-mb-md" v-if="errorDetails">
        Error details: {{ errorDetails }}
      </div>
      <div class="row q-gutter-sm justify-center">
        <q-btn
          v-if="canRetry"
          color="primary"
          label="Retry"
          @click="handleRetry"
          :loading="isRetrying"
        />
        <q-btn
          color="secondary"
          label="Go Back"
          @click="$router.back()"
          :disable="isRetrying"
        />
        <q-btn
          color="purple-4"
          label="Go Home"
          @click="goHome"
          :disable="isRetrying"
        />
      </div>
    </div>

    <!-- Technical Details Dialog -->
    <q-dialog v-model="showTechnicalDetails">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Technical Details</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <pre class="technical-details">{{ technicalDetails }}</pre>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Copy"
            color="primary"
            @click="copyTechnicalDetails"
          />
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

// State
const title = ref("An Error Occurred");
const message = ref("We encountered an unexpected error");
const errorDetails = ref("");
const technicalDetails = ref({});
const showTechnicalDetails = ref(false);
const isRetrying = ref(false);
const canRetry = ref(false);

// Methods
const initializeError = () => {
  const error = route.params.error || route.query.error;
  const errorType = route.query.type || "UNKNOWN";

  if (error) {
    try {
      const parsedError = typeof error === "string" ? JSON.parse(error) : error;

      switch (errorType) {
        case "AUTH":
          title.value = "Authentication Error";
          message.value = "There was a problem with authentication";
          canRetry.value = true;
          break;
        case "NETWORK":
          title.value = "Network Error";
          message.value = "Unable to connect to the server";
          canRetry.value = true;
          break;
        case "NOT_FOUND":
          title.value = "Not Found";
          message.value = "The requested resource was not found";
          canRetry.value = false;
          break;
        case "PERMISSION":
          title.value = "Permission Denied";
          message.value = "You do not have permission to access this resource";
          canRetry.value = false;
          break;
        case "SERVER":
          title.value = "Server Error";
          message.value = "An internal server error occurred";
          canRetry.value = true;
          break;
        default:
          title.value = "Unexpected Error";
          message.value = "An unexpected error occurred";
          canRetry.value = true;
      }

      errorDetails.value =
        parsedError.message || "No additional details available";
      technicalDetails.value = {
        type: errorType,
        timestamp: new Date().toISOString(),
        error: parsedError,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
    } catch (e) {
      console.error("Error parsing error details:", e);
      errorDetails.value = String(error);
    }
  }
};

const handleRetry = async () => {
  try {
    isRetrying.value = true;
    const targetPath = route.query.redirect || "/";
    await router.replace(targetPath);
  } catch (error) {
    console.error("Retry failed:", error);
    $q.notify({
      type: "negative",
      message: "Retry failed. Please try again later.",
      timeout: 3000,
    });
  } finally {
    isRetrying.value = false;
  }
};

const goHome = () => {
  router.push("/");
};

const copyTechnicalDetails = () => {
  try {
    const details = JSON.stringify(technicalDetails.value, null, 2);
    navigator.clipboard.writeText(details);
    $q.notify({
      type: "positive",
      message: "Technical details copied to clipboard",
      timeout: 2000,
    });
  } catch (error) {
    console.error("Error copying technical details:", error);
    $q.notify({
      type: "negative",
      message: "Failed to copy technical details",
      timeout: 2000,
    });
  }
};

// Lifecycle
onMounted(() => {
  initializeError();
});
</script>

<style scoped>
.technical-details {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 0.9em;
  background: $light-background;
  padding: 1rem;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
