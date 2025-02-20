<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="images/MaigretIcon.svg" />
          </q-avatar>
          Maigret Collectors
        </q-toolbar-title>
        <q-btn
          flat
          dense
          round
          icon="filter_list"
          @click="mostraFiltro = true"
        />
        <q-space />

        <!-- Show login icon if not logged in, otherwise show logout icon -->
        <q-btn
          dense
          flat
          round
          v-if="!isLoggedIn"
          icon="account_circle"
          @click="goToLogin"
        />
        <q-btn dense flat round v-else icon="logout" @click="logout" />
      </q-toolbar>

      <q-dialog v-model="mostraFiltro">
        <FiltroComponent />
      </q-dialog>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" overlay bordered>
      <!-- drawer content -->
      <q-list>
        <q-item clickable to="/home">
          <q-item-section>
            <q-item-label>Home</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="home" />
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable to="/configuration" v-if="isAdmin">
          <q-item-section>
            <q-item-label>Utility</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="build" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/login">
          <q-item-section>
            <q-item-label>login</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="login" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/tables">
          <q-item-section>
            <q-item-label>Tabels</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="table" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/newbook" v-if="isAdmin">
          <q-item-section>
            <q-item-label>New Book</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="new" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable @click="showAboutDialog = true">
          <q-item-section>
            <q-item-label>About</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="info" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="showAboutDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">About Maigret Collectors</div>
        </q-card-section>
        <q-card-section>
          <p>Version: {{ versionName }} (Build {{ versionCode }})</p>
          <p>Contact: support@maigretcollectors.com</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseInit";
import { useAuth } from "../composable/auth";
import FiltroComponent from "../components/Filter.vue";

const leftDrawerOpen = ref(false);
const userID = ref(null);
const router = useRouter();
const { isLoggedIn, userId, isAdmin, isCollector, checkAuthState } = useAuth();
const currentUser = ref(null);
const mostraFiltro = ref(false);

const showAboutDialog = ref(false);
const versionCode = ref(process.env.VERSION_CODE);
const versionName = ref(process.env.VERSION_NAME);
const filterDrawerOpen = ref(false); // Variabile per il drawer del filtro

onMounted(() => {
  checkAuthState();
});
onAuthStateChanged(auth, (user) => {
  isLoggedIn.value = !!user;
  if (user) {
    userID.value = user.uid;
    currentUser.value = user;
  } else {
    userID.value = null;
    currentUser.value = null;
  }
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
const toggleFilterDrawer = () => {
  filterDrawerOpen.value = !filterDrawerOpen.value; // Alterna la visibilità del drawer dei filtri
};
const goToLogin = () => {
  router.push("/login");
};

const logout = async () => {
  try {
    await signOut(auth);
    isLoggedIn.value = false;
    router.push("/login");
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

const isListView = ref(true);
</script>
