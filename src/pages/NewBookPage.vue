<template>
  <div class="bg-primary" id="add-book">
    <div class="row">
      <!-- Cover Images Section -->

      <!-- Book Details Section -->
      <div class="col-md-8 col-lg-8 col-xs-12 col-sm-12 q-px-md q-pt-sm">
        <!-- Book Details Form -->
        <div class="text-h4 text-center text-white q-py-xs q-my-xs">
          New Book
        </div>
        <q-card-section id="text" class="overflow: auto" v-if="isAdmin">
          <!-- Book Details Form -->
          <q-list>
            <!-- Iterate through book details -->
            <q-item>
              <q-item-section top>
                <!-- Input fields for book details -->
                <q-input
                  outlined
                  v-model="titolo"
                  label="Titolo"
                  class="text-h6 text-grey-11"
                  dark
                  color="accent"
                  v-if="isAdmin"
                  style="min-height: 48dp"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </div>
    </div>
    <div class="text-center mt-4" v-if="isAdmin">
      <q-btn
        color="primary"
        label="Save Book"
        @click="saveBook"
        v-if="isAdmin"
        style="min-height: 48dp"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db } from "../firebase/firebaseInit";

import { useBibliografiaStore } from "src/store/database";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "vue-router";

import { useAuth } from "../composable/auth";

const { isLoggedIn, isAdmin, checkAuthState } = useAuth();
// Call checkAuthState to ensure isLoggedIn is up-to-date
checkAuthState();

const router = useRouter();

const titolo = ref("");

const saveBook = async () => {
  try {
    // Check if the title field is empty
    if (!titolo.value.trim()) {
      alert("Please enter a title.");
      return;
    }

    // Create a new document in the "Bibliografia" collection with the generated UUID as the document name
    const docRef = await addDoc(collection(db, "Bibliografia"), {
      titolo: titolo.value,
      // Add more fields as needed
    });

    // Update local storage
    const localData = JSON.parse(localStorage.getItem("bibliografia")) || [];
    localData.push({
      id: docRef.id,
      titolo: titolo.value,
      // Add more fields as needed
    });
    localStorage.setItem("bibliografia", JSON.stringify(localData));

    // Update Pinia store
    useBibliografiaStore().addBook({
      id: docRef.id,
      titolo: titolo.value,

      // Add more fields as needed
    });

    router.push({ name: "DettaglioLibro", params: { id: docRef.id } });
  } catch (error) {
    console.error("Error saving book: ", error);
  }
};
</script>

<style scoped>
/* Add your component-specific styles here */
</style>
