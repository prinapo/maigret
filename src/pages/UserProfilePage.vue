<template>
  <q-page padding>
    <div class="q-mb-xl">
      <div class="text-h4 q-mb-md">{{ $t("userProfile.title") }}</div>
      <q-card>
        <q-card-section>
          <q-form>
            <q-input
              v-model="displayName"
              :label="$t('userProfile.displayName')"
              class="q-mb-md"
              outlined
              :readonly="isSaving"
              @blur="onDisplayNameBlur"
            >
              <template #append>
                <span v-if="saveStatus === 'saving'" class="q-ml-xs">
                  <q-spinner size="xs" color="primary" />
                </span>
                <q-icon
                  v-else-if="saveStatus === 'success'"
                  name="check_circle"
                  color="green"
                  class="q-ml-xs"
                />
                <q-icon
                  v-else-if="saveStatus === 'error'"
                  name="error"
                  color="red"
                  class="q-ml-xs"
                />
              </template>
            </q-input>
            <q-input
              :model-value="email"
              :label="$t('userProfile.email')"
              class="q-mb-md"
              outlined
              readonly
            />
            <q-input
              :model-value="role"
              :label="$t('userProfile.role')"
              class="q-mb-md"
              outlined
              readonly
            />
            <div class="q-mb-md">
              <div class="text-caption q-mb-xs">
                {{ $t("userProfile.permissions") }}
              </div>
              <ul class="q-pl-md">
                <li v-for="perm in permissions" :key="perm">
                  {{ $t("userProfile.permissionLabels." + perm) }}
                </li>
              </ul>
              <div v-if="!permissions.length" class="text-grey">
                (Nessun permesso)
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useUserStore } from "stores/userStore";
import { showNotifyPositive, showNotifyNegative } from "utils/notify";
import { useI18n } from "vue-i18n";
import { updateUserInFirebase } from "utils/firebaseDatabaseUtils";
import { storeToRefs } from "pinia";

const { t } = useI18n();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const displayName = ref(user.value?.displayName || "");
const email = computed(() => user.value?.email || "");
const role = computed(() => user.value?.role || "user");
const permissions = computed(() => {
  const perms = user.value?.permissions || [];
  return perms.map((p) => (typeof p === "string" ? p : p.value));
});
const isSaving = ref(false);
const saveStatus = ref(undefined);

let saveTimeout = null;

const onDisplayNameBlur = async () => {
  saveStatus.value = "saving";
  isSaving.value = true;
  try {
    await updateUserInFirebase(user.value.uid, {
      displayName: displayName.value,
    });
    saveStatus.value = "success";
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveStatus.value = undefined;
    }, 2000);
  } catch (error) {
    saveStatus.value = "error";
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveStatus.value = undefined;
    }, 2000);
  } finally {
    isSaving.value = false;
  }
};
</script>
