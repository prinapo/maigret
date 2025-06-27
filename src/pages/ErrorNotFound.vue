<template>
  <q-page class="column items-center justify-center bg-grey-2">
    <div class="text-center q-pa-md">
      <div class="text-negative" style="font-size: 8rem">{{ $t('errorNotFound.errorCode') }}</div>

      <div class="text-h4 text-weight-bold q-mb-xl">{{ $t('errorNotFound.pageNotFound') }}</div>

      <div class="text-grey-6 text-body1 q-mb-xl">
        {{ getErrorMessage() }}
      </div>

      <q-card class="q-pa-md bg-white shadow-2">
        <div class="text-body2 q-mb-md">{{ $t('errorNotFound.suggestion') }}:</div>

        <div class="row q-gutter-sm justify-center">
          <q-btn
            color="primary"
            icon-right="home"
            :label="$t('errorNotFound.goHome')"
            @click="goHome"
            :loading="isNavigating"
          />

          <q-btn
            color="secondary"
            icon-right="arrow_back"
            :label="$t('errorNotFound.goBack')"
            @click="goBack"
            :loading="isNavigating"
          />

          <q-btn
            v-if="suggestedPath"
            color="purple-4"
            icon-right="directions"
            :label="$t('errorNotFound.goTo') + ' ' + getSuggestedLabel()"
            @click="goToSuggested"
            :loading="isNavigating"
          />
        </div>

        <div class="text-caption q-mt-md text-grey-6">
          URL: {{ currentPath }}
        </div>
      </q-card>

      <div class="q-mt-xl">
        <q-btn
          flat
          color="grey-8"
          :label="$t('errorNotFound.reportIssue')"
          icon="bug_report"
          @click="reportIssue"
        />
      </div>
    </div>

    <!-- Report Issue Dialog -->
    <q-dialog v-model="showReportDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t('errorNotFound.reportIssueTitle') }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="reportDetails.description"
            type="textarea"
            :label="$t('errorNotFound.reportDescription')"
            :rules="[(val) => !!val || 'Please provide some details']"
            rows="3"
          />

          <div class="text-caption q-mt-sm">
            Technical details that will be included:
          </div>
          <pre class="technical-details q-mt-sm">{{ $t('errorNotFound.technicalDetails') }}:\n{{ technicalDetails }}</pre>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$t('errorNotFound.sendReport')"
            color="primary"
            @click="submitReport"
            :loading="isSendingReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

// State
const isNavigating = ref(false);
const showReportDialog = ref(false);
const isSendingReport = ref(false);
const reportDetails = ref({
  description: "",
});

// Computed
const currentPath = computed(() => window.location.pathname);
const suggestedPath = computed(() => findSimilarRoute(currentPath.value));
const technicalDetails = computed(() => ({
  url: window.location.href,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  path: currentPath.value,
  query: route.query,
  referrer: document.referrer,
}));

// Methods
const getErrorMessage = () => {
  const path = currentPath.value;

  if (path.includes("login")) {
    return "The login page you're looking for has moved or no longer exists.";
  } else if (path.includes("book")) {
    return "The book page you're looking for could not be found.";
  } else if (path.includes("admin")) {
    return "This admin page is not accessible or does not exist.";
  } else {
    return "The page you're looking for could not be found.";
  }
};

const findSimilarRoute = (path) => {
  // Remove leading and trailing slashes
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/");

  // Common route patterns
  const commonRoutes = {
    books: "/",
    bibliografia: "/",
    login: "/login",
    register: "/registration",
    settings: "/configuration",
    admin: "/configuration",
    new: "/newbook",
    add: "/newbook",
  };

  // Check if any segment matches a common route
  for (const segment of segments) {
    const normalizedSegment = segment.toLowerCase();
    if (commonRoutes[normalizedSegment]) {
      return commonRoutes[normalizedSegment];
    }
  }

  return null;
};

const getSuggestedLabel = () => {
  const suggestions = {
    "/": "Bibliography",
    "/login": "Login",
    "/registration": "Registration",
    "/configuration": "Settings",
    "/newbook": "New Book",
  };

  return suggestions[suggestedPath.value] || "Suggested Page";
};

const goHome = async () => {
  try {
    isNavigating.value = true;
    await router.push("/");
  } catch (error) {
    console.error("Navigation error:", error);
    showNavigationError();
  } finally {
    isNavigating.value = false;
  }
};

const goBack = async () => {
  try {
    isNavigating.value = true;
    router.back();
  } catch (error) {
    console.error("Navigation error:", error);
    showNavigationError();
  } finally {
    isNavigating.value = false;
  }
};

const goToSuggested = async () => {
  if (!suggestedPath.value) return;

  try {
    isNavigating.value = true;
    await router.push(suggestedPath.value);
  } catch (error) {
    console.error("Navigation error:", error);
    showNavigationError();
  } finally {
    isNavigating.value = false;
  }
};

const showNavigationError = () => {
  $q.notify({
    type: "negative",
    message: "Navigation failed. Please try again.",
    timeout: 3000,
  });
};

const reportIssue = () => {
  showReportDialog.value = true;
};

const submitReport = async () => {
  try {
    if (!reportDetails.value.description) {
      $q.notify({
        type: "warning",
        message: "Please provide some details about the issue.",
        timeout: 2000,
      });
      return;
    }

    isSendingReport.value = true;

    // Here you would typically send the report to your backend
    // For now, we'll just simulate it with a timeout
    await new Promise((resolve) => setTimeout(resolve, 1000));

    showReportDialog.value = false;
    reportDetails.value.description = "";

    $q.notify({
      type: "positive",
      message: "Thank you for reporting this issue.",
      timeout: 2000,
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    $q.notify({
      type: "negative",
      message: "Failed to send report. Please try again.",
      timeout: 3000,
    });
  } finally {
    isSendingReport.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Log 404 error for monitoring
  console.error("404 Error:", {
    path: currentPath.value,
    timestamp: new Date().toISOString(),
    referrer: document.referrer,
  });
});
</script>

<style scoped lang="scss">
.technical-details {
  font-family: monospace;
  font-size: 0.8em;
  background: $light-background;
  padding: 0.5rem;
  border-radius: 4px;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
