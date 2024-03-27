<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="/public/images/MaigretIcon.svg" />
          </q-avatar>
          Maigret Collectors
        </q-toolbar-title>
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

        <q-item clickable to="/login">
          <q-item-section>
            <q-item-label>Login</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="account_circle" />
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

export default {
  setup() {
    const leftDrawerOpen = ref(false);

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
};
</script>
