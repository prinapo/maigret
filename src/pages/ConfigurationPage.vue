<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ $t("configuration.settings") }}</div>
            <q-separator class="q-my-md" />

            <div v-if="!loading.value" class="row q-col-gutter-md">
              <!-- Theme Toggle -->
              <div class="col-12 col-md-6">
                <q-btn-toggle
                  v-model="theme"
                  toggle-color="primary"
                  :options="[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                  ]"
                  :disable="actionLoading.theme"
                  :loading="actionLoading.theme"
                  @update:model-value="onToggleTheme"
                />
              </div>

              <!-- Language Selection -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="selectedLanguage"
                  :options="languageOptions"
                  :label="$t('configuration.language')"
                  emit-value
                  map-options
                  outlined
                  dense
                  @update:model-value="onChangeLanguage"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- User Role and Permissions Info -->
      <div class="col-12" v-if="userStore.userRole !== 'user'">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ $t("configuration.userInfo") }}</div>
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-chip
                  :color="getRoleColor(userStore.userRole)"
                  text-color="white"
                  icon="person"
                >
                  {{ getRoleLabel(userStore.userRole) }}
                </q-chip>
              </div>

              <div class="col-12" v-if="userStore.userPermissions.length > 0">
                <div class="text-subtitle2 q-mb-sm">
                  {{ $t("configuration.permissions") }}:
                </div>
                <div class="row q-col-gutter-xs">
                  <div
                    v-for="permission in userStore.userPermissions"
                    :key="permission"
                    class="col-auto"
                  >
                    <q-chip
                      size="sm"
                      color="blue-grey-5"
                      text-color="white"
                      :icon="getPermissionIcon(permission)"
                    >
                      {{ getPermissionLabel(permission) }}
                    </q-chip>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Export Section -->
      <div
        class="col-12"
        v-if="userStore.userRole !== 'user' && userStore.canManageBooks"
      >
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ $t("configuration.exportData") }}</div>
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-btn-group>
                  <q-btn
                    color="primary"
                    :label="$t('configuration.exportCsv')"
                    icon="file_download"
                    @click="() => handleExport('csv')"
                    :loading="loading.export === 'csv'"
                    :disable="!!loading.export"
                  />
                  <q-btn
                    color="primary"
                    :label="$t('configuration.exportExcel')"
                    icon="table_view"
                    @click="() => handleExport('xlsx')"
                    :loading="loading.export === 'xlsx'"
                    :disable="!!loading.export"
                  />
                </q-btn-group>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- System Management Section -->
      <div
        class="col-12"
        v-if="
          userStore.userRole !== 'user' &&
          userStore.hasPermission('manage_system')
        "
      >
        <q-card>
          <q-card-section>
            <div class="text-h6">
              {{ $t("configuration.systemManagement") }}
            </div>
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <!-- Backup Button -->
              <div class="col-12 col-md-6" v-if="userStore.isAdmin">
                <q-btn
                  color="primary"
                  :label="$t('configuration.backupFirebase')"
                  icon="backup"
                  @click="backupFirebaseData"
                  class="full-width"
                  :loading="actionLoading.backup"
                />
              </div>

              <!-- Clear Cache Button -->
              <div class="col-12 col-md-6">
                <q-btn
                  color="warning"
                  :label="$t('configuration.clearCache')"
                  icon="clear_all"
                  @click="clearCache"
                  class="full-width"
                  :loading="actionLoading.clearCache"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- User Management Section -->
      <div
        class="col-12"
        v-if="userStore.userRole !== 'user' && userStore.canManageUsers"
      >
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ $t("configuration.userManagement") }}</div>
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-btn
                  color="secondary"
                  :label="$t('configuration.manageUsers')"
                  icon="group"
                  @click="navigateToUserManagement"
                  class="full-width"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Analytics Section -->
      <div
        class="col-12"
        v-if="
          userStore.userRole !== 'user' &&
          userStore.hasPermission('view_analytics')
        "
      >
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ $t("configuration.analytics") }}</div>
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-btn
                  color="teal"
                  :label="$t('configuration.viewAnalytics')"
                  icon="analytics"
                  @click="navigateToAnalytics"
                  class="full-width"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Error Dialog -->
    <q-dialog v-model="errorDialog.show" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t("common.error") }}</div>
        </q-card-section>

        <q-card-section>
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
            v-if="errorDialog.retry"
            flat
            :label="$t('common.retry')"
            color="primary"
            @click="errorDialog.retry"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-card class="q-mb-md" v-if="userStore.userRole !== 'user'">
      <q-card-section>
        <div class="text-h6">Backup e Ripristino Firebase</div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <q-btn
              color="primary"
              label="Backup Globale (tutte le collezioni)"
              @click="() => collections.forEach(handleBackup)"
              class="full-width q-mb-sm"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md">
          <div v-for="col in collections" :key="col" class="col-12 q-mb-sm">
            <q-btn
              color="primary"
              :label="`Backup ${col}`"
              @click="() => handleBackup(col)"
              class="full-width q-mb-xs"
            />
            <q-btn
              color="secondary"
              :label="`Ripristina ${col}`"
              class="full-width q-mb-xs"
              @click="() => triggerFileInput(col)"
            >
              <input
                type="file"
                accept="application/json"
                :ref="fileInputs[col]"
                style="display: none"
                @change="(e) => handleRestore(col, e)"
              />
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
    <q-card class="q-mb-md" v-if="userStore.userRole !== 'user'">
      <q-card-section>
        <div class="text-h6">Pulizia campi Bibliografia</div>
        <q-btn
          color="info"
          label="Ricarica campi"
          @click="loadBibliografiaFields"
          :loading="loadingFields"
          class="q-mb-md"
        />
        <q-list bordered>
          <q-item v-for="field in bibliografiaFieldsFiltered" :key="field">
            <q-item-section>{{ field }}</q-item-section>
            <q-item-section side>
              <q-btn
                color="negative"
                label="Elimina campo"
                @click="() => handleRemoveField(field)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-card
      v-if="userStore.userRole !== 'user' && userStore.canManageBooks"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-h6">Controlla immagini rotte in Storage</div>
        <q-btn
          color="primary"
          :loading="checkingMissingImages"
          label="Controlla immagini mancanti"
          @click="checkMissingImagesInStorage"
          class="q-mt-sm"
        />
        <div v-if="missingImageIds.length" class="q-mt-sm">
          <q-badge color="warning"
            >{{ missingImageIds.length }} immagini mancanti</q-badge
          >
          <q-btn
            color="warning"
            label="Sostituisci tutte con placeholder"
            @click="replaceMissingImagesWithPlaceholder"
            class="q-ml-sm"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card
      v-if="userStore.userRole !== 'user' && userStore.canManageBooks"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-h6">Pulizia campi Bibliografia</div>
        <q-btn
          color="warning"
          label="Pulisci campi inutili"
          @click="cleanBibliografiaFields"
          class="q-mt-sm"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  getCurrentInstance,
} from "vue";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { bookDetailsConfig } from "config/bookDetailsConfig";
import { updateUserSettingInFirebase } from "utils/firebaseDatabaseUtils";
import * as XLSX from "xlsx";
import { useUserStore } from "stores/userStore";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { Notify } from "quasar";
import { fetchCollectionData } from "utils/firebaseDatabaseUtils";
import { updateThemeFromSettings } from "utils/theme";
import { useRouter } from "vue-router";
import { showNotifyPositive, showNotifyNegative } from "src/utils/notify";
import {
  backupCollectionToJson,
  restoreCollectionFromJson,
  getAllFieldsInCollection,
  removeFieldFromCollection,
} from "utils/firebaseDatabaseUtils";
import { i18n } from "src/boot/i18n";
import {
  getStorage,
  ref as storageRef,
  listAll,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import { storage } from "src/boot/firebase";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";
import short from "short-uuid";
import JSZip from "jszip";

updateThemeFromSettings();

const router = useRouter();
const { locale, t } = useI18n();

const userStore = useUserStore();
const { settings } = storeToRefs(userStore);
const isLoggedIn = computed(() => auth.isLoggedIn);

// Initialize selectedLanguage from user settings or default locale
const initialLanguage = settings.value.language || locale.value;
const selectedLanguage = ref(initialLanguage);

watch(
  settings,
  (newSettings) => {
    if (
      newSettings.language &&
      newSettings.language !== selectedLanguage.value
    ) {
      selectedLanguage.value = newSettings.language;
      locale.value = newSettings.language;
    }
  },
  { immediate: true },
);

const languageOptions = [
  { label: "Italiano", value: "it-IT" },
  { label: "English", value: "en-US" },
];

const onChangeLanguage = async (newLocale) => {
  locale.value = newLocale;
  if (i18n && i18n.global) {
    i18n.global.locale.value = newLocale;
  }
  try {
    await userStore.updateSettings({ language: newLocale });
    Notify.create({
      message: "Language preference saved!",
      type: "positive",
      timeout: 1000,
    });
  } catch (error) {
    console.error("Failed to save language preference:", error);
    Notify.create({
      message: "Failed to save language preference.",
      type: "negative",
      timeout: 2000,
    });
  }
};

const bibliografiaStore = useBibliografiaStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();

// Stato locale per caricamento / pulsanti
const actionLoading = reactive({
  superadmin: false,
  theme: false,
  backup: false,
  clearCache: false,
});
const loading = ref({ export: false });

const errorDialog = ref({
  show: false,
  message: "",
  retry: null,
});

// Computed per superadmin e theme
const superadmin = computed({
  get: () => settings.value.superadmin || false,
  set: (val) => {
    // La logica di scrittura verrà chiamata esplicitamente da onToggleSuperadmin
    settings.value.superadmin = val;
  },
});

// Il tema in userStore è salvato come settings.darkMode (booleano)
// Rimuovere il computed superadmin e sostituire con:
const theme = computed({
  get: () => (settings.value.darkMode ? "dark" : "light"),
  set: (val) => {
    settings.value.darkMode = val === "dark";
  },
});

// Aggiornare le funzioni che usavano isSuperAdmin:
const getRoleColor = (role) => {
  switch (role) {
    case "admin":
      return "red";
    default:
      return "blue-grey";
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Administrator";
    case "user":
    default:
      return "User";
  }
};

const getPermissionIcon = (permission) => {
  const icons = {
    manage_users: "group",
    manage_books: "library_books",
    manage_system: "settings",
    view_analytics: "analytics",
    moderate_content: "moderation",
    export_data: "file_download",
    manage_roles: "admin_panel_settings",
  };
  return icons[permission] || "check_circle";
};

const getPermissionLabel = (permission) => {
  const labels = {
    manage_users: "Gestione Utenti",
    manage_books: "Gestione Libri",
    manage_system: "Gestione Sistema",
    view_analytics: "Visualizza Analytics",
    moderate_content: "Moderazione Contenuti",
    export_data: "Esportazione Dati",
    manage_roles: "Gestione Ruoli",
  };
  return labels[permission] || permission;
};

const showError = (message, retryFn = null) => {
  errorDialog.value = {
    show: true,
    message,
    retry: retryFn,
  };
};

// Navigation functions
const navigateToUserManagement = () => {
  router.push("users");
};

const navigateToAnalytics = () => {
  router.push("analytics");
};

// Handler per il toggle Superadmin
const onToggleSuperadmin = async (newValue) => {
  if (!userStore.isSuperAdmin) {
    Notify.create({
      message: "Solo i superadmin possono modificare questa impostazione",
      type: "warning",
    });
    return;
  }

  try {
    actionLoading.superadmin = true;

    // Aggiorno solo su Firebase; il watcher di Firestore farà il resto
    await updateUserSettingInFirebase(
      userStore.user.uid,
      "superadmin",
      newValue,
    );

    Notify.create({
      message: `Superadmin mode ${newValue ? "enabled" : "disabled"}`,
      type: "positive",
    });
  } catch (error) {
    console.error("Error toggling superadmin mode:", error);
    showError(`Failed to toggle superadmin mode: ${error.message}`, () =>
      onToggleSuperadmin(newValue),
    );
  } finally {
    actionLoading.superadmin = false;
  }
};

// Handler per il toggle Theme
const onToggleTheme = async (newTheme) => {
  try {
    actionLoading.theme = true;

    // Salvo su Firestore: se newTheme === "dark", metto true, altrimenti false
    await updateUserSettingInFirebase(
      userStore.user.uid,
      "darkMode",
      newTheme === "dark",
    );

    // CORREZIONE: usa updateThemeFromSettings per uniformità
    updateThemeFromSettings();

    Notify.create({
      message: `Theme set to ${newTheme} mode`,
      type: "positive",
    });
  } catch (error) {
    console.error("Error changing theme:", error);
    showError(`Failed to change theme: ${error.message}`, () =>
      onToggleTheme(newTheme),
    );
  } finally {
    actionLoading.theme = false;
  }
};

const handleExport = async (format = "csv") => {
  if (!userStore.hasPermission("export_data")) {
    Notify.create({
      message: "Non hai i permessi per esportare i dati",
      type: "warning",
    });
    return;
  }

  try {
    loading.value.export = format;
    const books = bibliografiaStore.bibliografia;

    // Se superadmin è attivo, esporta solo i libri posseduti; altrimenti esporta tutti
    const booksToExport =
      userStore.isAdmin && superadmin.value
        ? books.filter((book) => book.posseduto)
        : books;

    // Creo l'array di header da bookDetailsConfig, più le colonne "Posseduto" ed "Edizioni"
    const headers = [
      ...bookDetailsConfig.map((field) => field.label),
      "Posseduto",
      "Edizioni",
    ];

    // Trasformo i dati
    const exportData = booksToExport.map((book) => {
      const details = bookDetailsConfig.reduce((acc, field) => {
        let value = book[field.id] ?? "";

        if (field.id === "editore") {
          const editore = editoriStore.editori.find((e) => e.value === value);
          value = editore?.label || value;
        } else if (field.id === "collana") {
          const collana = collaneStore.collane.find((c) => c.value === value);
          value = collana?.label || value;
        }

        acc[field.label] = value;
        return acc;
      }, {});

      return {
        ...details,
        Posseduto: book.posseduto ? "Si" : "No",
        Edizioni: book.edizioni?.length || 0,
      };
    });

    // Eseguo l'export
    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
      XLSX.writeFile(workbook, "bibliografia.xlsx");
    } else {
      // CSV
      const csvRows = exportData.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(","),
      );
      csvRows.unshift(headers.join(","));
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bibliografia.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    }

    Notify.create({
      message: `Data exported successfully as ${format.toUpperCase()}`,
      type: "positive",
    });
  } catch (error) {
    console.error(`Error exporting data as ${format}:`, error);
    showError(`Failed to export data: ${error.message}`, () =>
      handleExport(format),
    );
  } finally {
    loading.value.export = false;
  }
};

const backupFirebaseData = async () => {
  if (!userStore.isSuperAdmin) {
    showNotifyNegative("Solo i superadmin possono eseguire il backup");
    return;
  }

  try {
    actionLoading.backup = true;

    const collections = [
      "Bibliografia",
      "Editori",
      "Collane",
      "Lingue",
      "Updates",
    ];

    const backupData = {};

    for (const collectionName of collections) {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);
      backupData[collectionName] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `firebase_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotifyPositive("Backup completed successfully");
  } catch (error) {
    console.error("Error during backup:", error);
    showNotifyNegative("Error during backup: " + error.message);
  } finally {
    actionLoading.backup = false;
  }
};

const clearCache = async () => {
  if (!userStore.hasPermission("manage_system")) {
    Notify.create({
      message: "Non hai i permessi per gestire il sistema",
      type: "warning",
    });
    return;
  }

  try {
    actionLoading.clearCache = true;

    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any cached data in stores if needed
    // bibliografiaStore.clearCache();
    // editoriStore.clearCache();
    // etc.

    Notify.create({
      message: "Cache cleared successfully",
      type: "positive",
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    showError(`Failed to clear cache: ${error.message}`);
  } finally {
    actionLoading.clearCache = false;
  }
};

// Sostituire le query dirette con funzioni centralizzate
const fetchSomeData = async () => {
  try {
    const data = await fetchCollectionData("SomeCollection");
    // ... process data
  } catch (error) {
    // ... handle error
  }
};

const collections = [
  "Bibliografia",
  "Collane",
  "Covers",
  "Editori",
  "Lingue",
  "Users",
];

const bibliografiaFields = ref([]);
const loadingFields = ref(false);

// Computed: mostra solo i campi NON ufficiali (così i calcolati sono eliminabili)
const bibliografiaFieldsFiltered = computed(() => {
  // Prendi solo gli id dei campi ufficiali (non calcolati)
  const officialFieldIds = new Set(
    bookDetailsConfig.filter((f) => !f.calculated).map((f) => f.id),
  );
  // Mostra solo i campi che non sono ufficiali (quindi i calcolati, come 'id', sono eliminabili)
  return bibliografiaFields.value.filter((f) => !officialFieldIds.has(f));
});

const loadBibliografiaFields = async () => {
  loadingFields.value = true;
  bibliografiaFields.value = await getAllFieldsInCollection("Bibliografia");
  loadingFields.value = false;
};

const handleBackup = async (collection) => {
  await backupCollectionToJson(collection);
};

const handleRestore = async (collection, event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const jsonData = JSON.parse(e.target.result);
      // Sicurezza: controlla che il file sia compatibile con la collezione
      let valid = false;
      if (collection === "Collane") {
        valid = Array.isArray(jsonData) && jsonData[0]?.collana;
      } else if (collection === "Editori") {
        valid = Array.isArray(jsonData) && jsonData[0]?.editore;
      } else if (collection === "Lingue") {
        valid = Array.isArray(jsonData) && jsonData[0]?.lingua;
      } else if (collection === "Covers") {
        valid = Array.isArray(jsonData) && jsonData[0]?.cover;
      } else if (collection === "Bibliografia") {
        valid =
          Array.isArray(jsonData) &&
          (jsonData[0]?.books || jsonData[0]?.titolo || jsonData[0]?.id);
      } else if (collection === "Users") {
        valid =
          Array.isArray(jsonData) && (jsonData[0]?.email || jsonData[0]?.uid);
      } else {
        valid = true; // fallback per collezioni custom
      }
      if (!valid) {
        Notify.create({
          message: `File non valido: non sembra un backup della collezione ${collection}!`,
          type: "negative",
          timeout: 3000,
        });
        return;
      }
      await restoreCollectionFromJson(collection, jsonData);
      showNotifyPositive("Ripristino completato!");
    } catch (err) {
      Notify.create({
        message: "Errore nel file JSON: " + err.message,
        type: "negative",
        timeout: 3000,
      });
    }
  };
  reader.readAsText(file);
};

const handleRemoveField = async (field) => {
  await removeFieldFromCollection("Bibliografia", field);
  showNotifyPositive(`Campo '${field}' eliminato da tutti i record!`);
  await loadBibliografiaFields();
};

// Mappa di ref per ogni input file
const fileInputs = {};
collections.forEach((col) => {
  fileInputs[col] = ref(null);
});

const triggerFileInput = (col) => {
  const input = fileInputs[col]?.value;
  if (Array.isArray(input)) {
    if (input[0]) input[0].click();
  } else if (input) {
    input.click();
  }
};

const missingImageIds = ref([]);
const checkingMissingImages = ref(false);

async function checkMissingImagesInStorage() {
  checkingMissingImages.value = true;
  missingImageIds.value = [];
  const storage = getStorage();
  const idsToCheck = [];
  for (const book of bibliografiaStore.bibliografia) {
    if (Array.isArray(book.images)) {
      for (const img of book.images) {
        if (img.id && img.id !== "placeholder") {
          idsToCheck.push(img.id);
        }
      }
    }
  }
  let missing = [];
  for (const id of idsToCheck) {
    try {
      await getDownloadURL(storageRef(storage, `images/${id}.jpg`));
    } catch (e) {
      missing.push(id);
    }
  }
  missingImageIds.value = missing;
  checkingMissingImages.value = false;
  Notify.create({
    message: `Immagini non trovate in storage: ${missing.length}`,
    type: missing.length ? "warning" : "positive",
    timeout: 4000,
  });
}

async function replaceMissingImagesWithPlaceholder() {
  let changedBooks = 0;
  let fixedImages = 0;
  for (const book of bibliografiaStore.bibliografia) {
    let changed = false;
    if (Array.isArray(book.images)) {
      for (const img of book.images) {
        if (missingImageIds.value.includes(img.id)) {
          img.id = "placeholder";
          changed = true;
          fixedImages++;
        }
      }
    }
    if (changed) {
      await updateDocInCollection("Bibliografia", book.id, {
        images: book.images,
      });
      changedBooks++;
    }
  }
  Notify.create({
    message: `Sostituite ${fixedImages} immagini mancanti in ${changedBooks} libri.`,
    type: "positive",
    timeout: 4000,
  });
  missingImageIds.value = [];
}

async function cleanBibliografiaFields() {
  let changedBooks = 0;
  for (const book of bibliografiaStore.bibliografia) {
    let changed = false;
    // Rimuovi dal libro
    ["timestamp", "posseduto", "defaultImageName"].forEach((field) => {
      if (book && field in book) {
        delete book[field];
        changed = true;
      }
    });
    // Rimuovi da edizioni
    if (Array.isArray(book.edizioni)) {
      for (const ed of book.edizioni) {
        ["timestamp", "posseduto"].forEach((field) => {
          if (ed && field in ed) {
            delete ed[field];
            changed = true;
          }
        });
        // Rimuovi da immagini
        if (Array.isArray(ed.images)) {
          for (const img of ed.images) {
            if (img && "timestamp" in img) {
              delete img.timestamp;
              changed = true;
            }
          }
        }
      }
    }
    // Rimuovi da immagini a livello libro
    if (Array.isArray(book.images)) {
      for (const img of book.images) {
        if (img && "timestamp" in img) {
          delete img.timestamp;
          changed = true;
        }
      }
    }
    if (changed) {
      await updateDocInCollection("Bibliografia", book.id, book);
    }
  }
  Notify.create({
    message: "Pulizia completata! Campi rimossi da tutti i libri.",
    type: "positive",
    timeout: 3000,
  });
}

onMounted(() => {
  loadBibliografiaFields();
});
</script>
