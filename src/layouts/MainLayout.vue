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

        <q-item clickable to="/configuration">
          <q-item-section>
            <q-item-label>Configuration</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="build" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/tables">
          <q-item-section>
            <q-item-label>Data Tables</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="table" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/newbook">
          <q-item-section>
            <q-item-label>New Book</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="new" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseInit";

export default {
  setup() {
    const leftDrawerOpen = ref(false);
    const isLoggedIn = ref(false);
    const userID = ref(null);
    const router = useRouter(); // Initialize the router

    // Check if the user is already logged in when the component is mounted
    onAuthStateChanged(auth, (user) => {
      isLoggedIn.value = !!user;
      if (user) {
        // If user is logged in, set userID to the user's UID
        userID.value = user.uid;
      } else {
        // If user is logged out, set userID to null
        userID.value = null;
      }
      // Update the isLoggedIn variable based on the user's authentication state
    });

    const toggleLeftDrawer = () => {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    };

    const goToLogin = () => {
      // Redirect to the login page
      router.push("/login");
    };

    const logout = async () => {
      try {
        await signOut(auth); // Sign out the user
        isLoggedIn.value = false; // Update the isLoggedIn variable
        router.push("/login"); // Redirect to the login page after logout
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    return {
      leftDrawerOpen,
      isLoggedIn,
      toggleLeftDrawer,
      goToLogin,
      logout,
      isListView: true,
    };
  },
};
</script>
