<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <span class="text-caption">{{ version }}</span>
        <q-toolbar-title>Maigret Collectors</q-toolbar-title>
        <q-btn
          v-if="isHome"
          flat
          dense
          round
          icon="filter_list"
          @click="mostraFiltro = true"
        />
        <q-space />
        <q-btn
          dense
          flat
          round
          v-if="!isLoggedIn"
          icon="account_circle"
          @click="goToLogin"
        />
        <q-btn dense flat round v-else icon="logout" @click="goToLogin" />
      </q-toolbar>
      <q-dialog v-model="mostraFiltro">
        <FiltroComponent />
      </q-dialog>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" overlay bordered>
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
        <q-item
          clickable
          to="/configuration"
          v-if="userStore.isAdmin || userStore.isSuperAdmin"
        >
          <q-item-section>
            <q-item-label>Configurations</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="settings" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/users" v-if="userStore.canManageUsers">
          <q-item-section>
            <q-item-label>User Management</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="people" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/login">
          <q-item-section>
            <q-item-label>Login</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="login" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/tables" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>Tables</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="table_chart" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/newbook" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>New Book</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="note_add" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/trash" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>Trash</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="delete" />
          </q-item-section>
        </q-item>
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
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" v-if="$route.meta?.keepAlive" />
        </keep-alive>
        <component :is="Component" v-if="!$route.meta?.keepAlive" />
      </router-view>
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
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { signOut } from "firebase/auth";
import { auth } from "boot/firebase";
import { useAuthStore } from "stores/authStore";
import FiltroComponent from "components/Filter.vue";
import { useUserStore } from "stores/userStore";

const router = useRouter();
const route = useRoute();
const isHome = computed(() => route.path === "/");
const { isLoggedIn } = useAuthStore();
const userStore = useUserStore();

const leftDrawerOpen = ref(false);
const mostraFiltro = ref(false);
const showAboutDialog = ref(false);
const versionCode = ref(process.env.VERSION_CODE);
const versionName = ref(process.env.VERSION_NAME);
const version = process.env.APP_VERSION;

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const goToLogin = () => {
  router.push("/login");
};

// Rimuovi la funzione logout e sostituiscila con goToLogin
// const logout = async () => {
//   try {
//     await signOut(auth);
//     router.push("/login");
//   } catch (error) {
//     console.error("Error logging out:", error);
//   }
// };
</script>
