<template>
  <q-page padding v-if="userStore.canManageRoles">
    <div class="text-h4 q-mb-md">{{ $t("userManagement.title") }}</div>

    <q-card>
      <q-card-section>
        <q-table
          :rows="users"
          :columns="columns"
          row-key="uid"
          :loading="loading"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-role="props">
            <q-td :props="props">
              <q-select
                v-model="props.row.role"
                :options="roleOptions"
                :disable="
                  !userStore.canManageRoles ||
                  props.row.uid === userStore.user?.uid
                "
                @update:model-value="
                  (value) => updateUserRole(props.row, value)
                "
                dense
                outlined
              />
            </q-td>
          </template>

          <template v-slot:body-cell-permissions="props">
            <q-td :props="props">
              <q-select
                v-model="props.row.permissions"
                :options="getPermissionOptionsForRole(props.row.role)"
                :disable="
                  !userStore.isSuperAdmin ||
                  props.row.role === 'superadmin' ||
                  props.row.uid === userStore.user?.uid
                "
                @update:model-value="
                  (value) => updateUserPermissions(props.row, value)
                "
                multiple
                dense
                outlined
                use-chips
              />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="
                  userStore.canManageRoles &&
                  props.row.uid !== userStore.user?.uid
                "
                icon="delete"
                color="negative"
                flat
                dense
                @click="deleteUser(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-separator spaced />
    <div class="q-mt-xl">
      <div class="text-h5 q-mb-md">{{ t("userManagement.trashTitle") }}</div>
      <q-card>
        <q-card-section>
          <q-table
            :rows="usersTrash"
            :columns="columns"
            row-key="uid"
            :pagination="{ rowsPerPage: 10 }"
            :loading="loading"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  icon="restore"
                  color="primary"
                  flat
                  dense
                  @click="
                    async () => {
                      await restoreUserFromTrash(props.row.uid);
                      showNotifyPositive(t('userManagement.userRestored'));
                      await fetchUsers(true);
                    }
                  "
                />
                <q-btn
                  icon="delete_forever"
                  color="negative"
                  flat
                  dense
                  @click="() => deleteUserPermanently(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>

  <q-page v-else class="flex flex-center">
    <div class="text-center">
      <q-icon name="lock" size="4em" color="grey-6" />
      <div class="text-h6 q-mt-md">{{ $t("userManagement.accessDenied") }}</div>
      <div class="text-body2 text-grey-6">
        You don't have permission to manage users or roles.
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "stores/userStore";
import {
  fetchAllUsers,
  fetchAllUsersTrash,
  updateUserInFirebase,
  deleteUserFromFirebase,
  restoreUserFromTrash,
} from "utils/firebaseDatabaseUtils";
import {
  showNotifyPositive,
  showNotifyNegative,
  showNotifyUndo,
} from "utils/notify";
import { useI18n } from "vue-i18n";

const userStore = useUserStore();
const users = ref([]);
const usersTrash = ref([]);
const loading = ref(false);

const { t } = useI18n();

const columns = [
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "displayName", label: "Name", field: "displayName", align: "left" },
  { name: "role", label: "Role", field: "role", align: "center" },
  {
    name: "permissions",
    label: "Permissions",
    field: "permissions",
    align: "center",
  },
  { name: "actions", label: "Actions", field: "actions", align: "center" },
];

// Solo admin e superadmin sono supportati
const roleOptions = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "superadmin" },
];

const allPermissionOptions = [
  { label: "Manage Books", value: "manage_books" },
  { label: "Manage Users", value: "manage_users" },
  { label: "Manage System", value: "manage_system" },
  { label: "View Analytics", value: "view_analytics" },
  { label: "Moderate Content", value: "moderate_content" },
  { label: "Export Data", value: "export_data" },
  { label: "Manage Roles", value: "manage_roles" },
];
const collectPermissionOption = [
  { label: "Collect Books", value: "collect_books" },
];

function getPermissionOptionsForRole(role) {
  if (role === "user") return collectPermissionOption;
  return allPermissionOptions;
}

const fetchUsers = async (suppressErrorNotify = false) => {
  loading.value = true;
  try {
    users.value = await fetchAllUsers();
  } catch (error) {
    console.error("Error fetching users:", error);
    if (!suppressErrorNotify) {
      showNotifyNegative(t("userManagement.errorLoadingUsers"));
    }
  } finally {
    loading.value = false;
    // Carica anche gli utenti in trash
    try {
      usersTrash.value = await fetchAllUsersTrash();
    } catch (e) {
      // Silenzia errori trash
    }
  }
};

const updateUserRole = async (user, newRole) => {
  try {
    let permissions = [];
    if (newRole === "superadmin") {
      permissions = [
        "manage_books",
        "manage_users",
        "manage_system",
        "view_analytics",
        "moderate_content",
        "export_data",
        "manage_roles",
        // superadmin NON ha collect_books
      ];
    } else if (newRole === "admin") {
      permissions = [
        "view_analytics",
        "moderate_content",
        "export_data",
        // admin NON ha manage_books, manage_users, manage_system, manage_roles
      ];
    } else if (newRole === "user") {
      // Mantieni collect_books se già presente, rimuovi tutti gli altri
      if (user.permissions && user.permissions.includes("collect_books")) {
        permissions = ["collect_books"];
      } else {
        permissions = [];
      }
    }

    await updateUserInFirebase(user.uid, {
      role: newRole,
      permissions: permissions,
    });

    showNotifyPositive(t("userManagement.roleUpdated", { role: newRole }));

    await fetchUsers(true);
  } catch (error) {
    console.error("Error updating user role:", error);
    showNotifyNegative(t("userManagement.errorUpdatingRole"));
  }
};

const updateUserPermissions = async (user, newPermissions) => {
  try {
    // ✅ Usa la utility centralizzata invece di accesso diretto
    await updateUserInFirebase(user.uid, { permissions: newPermissions });

    showNotifyPositive(t("userManagement.permissionsUpdated"));

    await fetchUsers(true);
  } catch (error) {
    console.error("Error updating user permissions:", error);
    showNotifyNegative(t("userManagement.errorUpdatingPermissions"));
  }
};

const deleteUser = async (user) => {
  try {
    await deleteUserFromFirebase(user.uid);

    showNotifyUndo(
      t("userManagement.userDeleted"),
      t("userManagement.undo"),
      async () => {
        try {
          await restoreUserFromTrash(user.uid);
          showNotifyPositive(t("userManagement.userRestored"));
          await fetchUsers(true);
        } catch (err) {
          showNotifyNegative(t("userManagement.errorRestoringUser"));
        }
      },
    );

    await fetchUsers(true);
  } catch (error) {
    console.error("Error deleting user:", error);
    showNotifyNegative(t("userManagement.errorDeletingUser"));
  }
};

const deleteUserPermanently = async (user) => {
  try {
    // Elimina definitivamente dalla trash
    const { doc, deleteDoc } = await import("firebase/firestore");
    const { db } = await import("boot/firebase");
    const trashRef = doc(db, "UsersTrash", user.uid);
    await deleteDoc(trashRef);
    showNotifyPositive(t("userManagement.userDeletedPermanently"));
    await fetchUsers(true);
  } catch (error) {
    showNotifyNegative(t("userManagement.errorDeletingUserPermanently"));
  }
};

onMounted(() => {
  if (userStore.canManageRoles) {
    fetchUsers();
  }
});
</script>
