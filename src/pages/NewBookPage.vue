<template>
  <q-page id="add-book" class="q-pa-md">
    <div class="row justify-center">
      <div class="col-xs-12 col-sm-10 col-md-8 col-lg-6">
        <div class="text-h5 text-center q-mb-md">{{ $t("newBook.title") }}</div>

        <q-card flat bordered>
          <q-card-section v-if="userStore.canManageBooks">
            <q-form @submit.prevent="saveBook">
              <q-input
                outlined
                v-model="titolo"
                :label="$t('newBook.bookTitle')"
                :error="!!validationError"
                :error-message="validationError"
                :rules="[
                  (val) => !!val || 'Title is required',
                  (val) =>
                    val.length >= 2 || 'Title must be at least 2 characters',
                ]"
                @update:model-value="clearValidationError"
                :loading="isValidating"
                :readonly="isSubmitting"
                class="q-mb-md"
              />

              <div class="text-center">
                <q-btn
                  type="submit"
                  :label="$t('newBook.saveBook')"
                  color="primary"
                  :loading="isSubmitting"
                  :disable="!isValid || isSubmitting"
                  class="full-width"
                >
                  <template v-slot:loading>
                    <q-spinner-dots class="q-mr-sm" />
                    Saving...
                  </template>
                </q-btn>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useRouter } from "vue-router";
import { Notify, useQuasar } from "quasar";
import short from "short-uuid";
import { useUserStore } from "stores/userStore";
import { checkBookExists, createBook } from "utils/firebaseDatabaseUtils";
import placeholderImage from "assets/placeholder.jpg";
import { convertAndUploadImage } from "utils/imageUtils";

// UUID generator
const shortUuidGenerator = short();

// Store setup
const userStore = useUserStore();
const router = useRouter();
const bibliografiaStore = useBibliografiaStore();
const $q = useQuasar();

// State
const titolo = ref("");
const isSubmitting = ref(false);
const isValidating = ref(false);
const validationError = ref(null);
const hasAttemptedSubmit = ref(false);

// Computed
const isValid = computed(() => {
  return titolo.value.trim().length >= 2 && !validationError.value;
});

// Methods
const clearValidationError = () => {
  if (validationError.value) {
    validationError.value = null;
  }
};

const validateBook = async () => {
  try {
    isValidating.value = true;
    const title = titolo.value.trim();

    if (!title) {
      throw new Error("Title is required");
    }
    if (title.length < 2) {
      throw new Error("Title must be at least 2 characters long");
    }

    // Usare la funzione centralizzata - permesso creare libri con stesso titolo
    // const exists = await checkBookExists(title);
    // if (exists) {
    //   throw new Error("A book with this title already exists");
    // }

    return true;
  } catch (error) {
    validationError.value = error.message;
    return false;
  } finally {
    isValidating.value = false;
  }
};

const saveBook = async () => {
  try {
    hasAttemptedSubmit.value = true;

    if (isSubmitting.value) {
      return;
    }

    isSubmitting.value = true;
    clearValidationError();

    // Validate input
    const isValid = await validateBook();
    if (!isValid) {
      return;
    }

    // Controlla se esiste già un libro con questo titolo e chiedi conferma
    const exists = await checkBookExists(titolo.value.trim());
    if (exists) {
      const proceed = await new Promise((resolve) => {
        $q.dialog({
          title: "Libro esistente",
          message:
            "Un libro con questo titolo esiste già. Vuoi procedere con la creazione?",
          cancel: true,
          persistent: true,
        })
          .onOk(() => resolve(true))
          .onCancel(() => resolve(false));
      });
      if (!proceed) {
        return;
      }
    }

    // Create new book document
    const bookData = {
      titolo: titolo.value.trim(),
      defaultImageName: null,
      edizioni: [
        {
          anno: new Date().getFullYear(),
          numero: 1,
          uuid: shortUuidGenerator.new(),
          images: [
            {
              id: shortUuidGenerator.new(),
              coverType: "",
            },
          ],
        },
      ],
    };

    // Usa la funzione centralizzata
    const docRef = await createBook(bookData);

    // Upload placeholder image to Firebase using centralized function
    try {
      const response = await fetch(placeholderImage);
      const blob = await response.blob();
      const imageId = bookData.edizioni[0].images[0].id;
      const file = new File([blob], `${imageId}.jpg`, { type: "image/jpeg" });
      await convertAndUploadImage(file, docRef.id, 0);
    } catch (uploadError) {
      console.error("Error uploading placeholder image:", uploadError);
      // Continue anyway
    }

    // Update local storage
    try {
      const localData = JSON.parse(localStorage.getItem("bibliografia")) || [];
      const newBook = {
        ...bookData,
        id: docRef.id,
      };
      localData.push(newBook);
      localStorage.setItem("bibliografia", JSON.stringify(localData));

      // Nota: non aggiornare Pinia direttamente, i watcher si occupano di aggiornare da Firebase

      // Navigate to book detail page
      router.push({ name: "bibliografia", query: { bookId: docRef.id } });
    } catch (storageError) {
      console.error("Error updating local storage:", storageError);
      router.push({ name: "bibliografia", query: { bookId: docRef.id } });
    }
  } catch (error) {
    console.error("Error saving book:", error);
    validationError.value = error.message;
    Notify.create({
      message: `Failed to create book: ${error.message}`,
      type: "negative",
      color: "negative",
      timeout: 3000,
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped></style>
