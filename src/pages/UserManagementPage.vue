<template>
  <q-page padding v-if="userStore.canManageUsers">
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
                :options="permissionOptions"
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
                  userStore.canManageUsers &&
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
  </q-page>

  <q-page v-else class="flex flex-center">
    <div class="text-center">
      <q-icon name="lock" size="4em" color="grey-6" />
      <div class="text-h6 q-mt-md">{{ $t("userManagement.accessDenied") }}</div>
      <div class="text-body2 text-grey-6">
        You don't have permission to manage users.
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "stores/userStore";
import {
  fetchAllUsers,
  updateUserInFirebase,
  deleteUserFromFirebase,
} from "utils/firebaseDatabaseUtils";
import { Notify } from "quasar";

const userStore = useUserStore();
const users = ref([]);
const loading = ref(false);

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
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "superadmin" },
];

const permissionOptions = [
  { label: "Manage Books", value: "manage_books" },
  { label: "Manage Users", value: "manage_users" },
  { label: "Manage System", value: "manage_system" },
  { label: "View Analytics", value: "view_analytics" },
  { label: "Moderate Content", value: "moderate_content" },
  { label: "Export Data", value: "export_data" },
  { label: "Manage Roles", value: "manage_roles" },
];

const fetchUsers = async () => {
  loading.value = true;
  try {
    users.value = await fetchAllUsers();
  } catch (error) {
    console.error("Error fetching users:", error);
    Notify.create({
      type: "negative",
      message: "Error loading users",
    });
  } finally {
    loading.value = false;
  }
};

const updateUserRole = async (user, newRole) => {
  try {
    // Superadmin ha tutti i permessi automaticamente
    const permissions =
      newRole === "superadmin"
        ? [
            "manage_books",
            "manage_users",
            "manage_system",
            "view_analytics",
            "moderate_content",
            "export_data",
            "manage_roles",
            "collect_books",
          ]
        : user.permissions || [];

    await updateUserInFirebase(user.uid, {
      role: newRole,
      permissions: permissions,
    });

    Notify.create({
      type: "positive",
      message: `User role updated to ${newRole}`,
    });

    await fetchUsers();
  } catch (error) {
    console.error("Error updating user role:", error);
    Notify.create({
      type: "negative",
      message: "Error updating user role",
    });
  }
};

const updateUserPermissions = async (user, newPermissions) => {
  try {
    // ✅ Usa la utility centralizzata invece di accesso diretto
    await updateUserInFirebase(user.uid, { permissions: newPermissions });

    Notify.create({
      type: "positive",
      message: "User permissions updated",
    });

    await fetchUsers();
  } catch (error) {
    console.error("Error updating user permissions:", error);
    Notify.create({
      type: "negative",
      message: "Error updating user permissions",
    });
  }
};

const deleteUser = async (user) => {
  try {
    await deleteUserFromFirebase(user.uid);

    Notify.create({
      type: "positive",
      message: "User deleted successfully",
    });

    await fetchUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
    Notify.create({
      type: "negative",
      message: "Error deleting user",
    });
  }
};

onMounted(() => {
  if (userStore.canManageUsers) {
    fetchUsers();
  }
});
</script>
