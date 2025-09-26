<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated :style="'padding-top: var(--ion-safe-area-top, 24px)'">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <span class="text-caption">{{ version }}</span>
        <q-toolbar-title> Maigret Collectors </q-toolbar-title>
        <q-btn
          v-if="route.name === 'bibliografia'"
          icon="filter_list"
          flat
          round
          dense
          @click="showFilterDrawer = true"
        />
        <slot name="toolbar-right" />
        <q-space />
        <q-btn
          dense
          flat
          round
          v-if="!authStore.loggedIn"
          icon="account_circle"
          @click="goToLogin"
        />
        <q-btn dense flat round v-else icon="logout" @click="goToLogin" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      :overlay="$q.screen.lt.md"
      bordered
      :behavior="$q.screen.lt.md ? 'mobile' : 'desktop'"
    >
      <q-list>
        <q-item clickable to="/home">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.home") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="home" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/configuration" v-if="authStore.loggedIn">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.configurations") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="settings" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/users" v-if="userStore.canManageUsers">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.userManagement") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="people" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/login">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.login") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="login" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/tables" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.tables") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="table_chart" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/newbook" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.newBook") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="note_add" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/trash" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.trash") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="delete" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/profile" v-if="authStore.loggedIn">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.profile") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="person" />
          </q-item-section>
        </q-item>
        <q-item clickable @click="showAboutDialog = true">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.about") }}</q-item-label>
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
          <component
            :is="Component"
            v-if="$route.meta?.keepAlive"
            :showFilterDrawer="showFilterDrawer"
            @update:showFilterDrawer="(val) => (showFilterDrawer = val)"
          />
        </keep-alive>
        <component
          :is="Component"
          v-if="!$route.meta?.keepAlive"
          :showFilterDrawer="showFilterDrawer"
          @update:showFilterDrawer="(val) => (showFilterDrawer = val)"
        />
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
import { ref, provide } from "vue";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useLoaderStore } from "stores/loadersStore";
import { watch } from "vue";
import { useQuasar } from "quasar";
import { computed } from "vue";

const $q = useQuasar();

const isLoading = computed(() => loaderStore.isLoading);
const message = computed(() => loaderStore.message);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userStore = useUserStore();
const showFilterDrawer = ref(false);

const loaderStore = useLoaderStore();

const leftDrawerOpen = ref(false);
const showAboutDialog = ref(false);
const versionCode = ref(process.env.VERSION_CODE);
const versionName = ref(process.env.VERSION_NAME);
const version = process.env.APP_VERSION;
const { percent } = storeToRefs(loaderStore);
const loaderToken = ref(null);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const goToLogin = () => {
  router.push("/login");
};

provide("showFilterDrawer", showFilterDrawer);

watch(
  [isLoading, message],
  ([loading, msg]) => {
    if (loading) {
      if (loaderToken.value) {
        // Aggiorna solo il messaggio
        $q.loading.setDefaults({ message: msg || "Caricamento..." });
      } else {
        // Mostra un nuovo loader
        loaderToken.value = $q.loading.show({
          message: msg || "Caricamento...",
          spinnerColor: "primary",
        });
      }
    } else {
      if (loaderToken.value) {
        $q.loading.hide(loaderToken.value);
        loaderToken.value = null;
      }
    }
  },
  { immediate: true },
);
</script>

<style></style>
