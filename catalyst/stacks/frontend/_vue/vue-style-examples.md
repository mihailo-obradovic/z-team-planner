# Vue Style — Worked Examples

**Tier:** Frontend — Vue

Code examples for the rules in [`vue-style.md`](vue-style.md). The rules there are authoritative; this file just shows them in practice.

## Script section order

A component exercising most of the twenty-one sections. The blank lines are the group boundaries — imports, declarations, wiring, logic.

```vue
<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'; // 1. dependency imports

import UserFormDialog from '@/components/users/UserFormDialog.vue'; // 2. component imports
import ConfirmDialog from '@/components/users/ConfirmDialog.vue'; // self-contained, so last

import { ROLE_LABELS } from '@/assets/constants/roles'; // 3. static assets

import {
  useFetchUsers,
  useDeleteUser
} from '@/services/queries/useUserQueries'; // 4. services

import type { User } from '@/types/user'; // 5. type imports last

definePageMeta({ layout: 'default' }); // 6. route metadata

const props = defineProps<{
  // 7. props, then model, then emits
  teamId: number;
  compact?: boolean; // optional props are typed too
}>();

const emit = defineEmits<{ select: [user: User] }>();

const searchInput = useTemplateRef('searchInput'); // 8. template refs — not a bare ref()

const route = useRoute(); // 9. built-in composables

const { user: currentUser } = storeToRefs(useAuthStore()); // 11. reactive state first
const { resetUser } = useAuthStore(); // then actions

const { data: users, isLoading } = useFetchUsers(); // 12. service destructuring

const { confirm } = useConfirmation(); // 13. project composables

const { dialogOpen, openDialog } = useUserDialog(); // 14. from the local composable at 21

const isEmpty = computed(() => !isLoading.value && !users.value?.length); // 15. component-wide status

// 16. component-wide functions — `function` syntax, not an arrow
function handleSelect(user: User) {
  emit('select', user);
}

const handleSearch = useDebounceFn((term: string) => {
  // arrow is fine as a callback argument
  void term;
}, 300);

watch(() => route.query.page, handleSearch); // 17. component-wide watchers

onMounted(() => {
  // 18. lifecycle, in lifecycle order
  searchInput.value?.focus();
});

defineExpose({ openDialog }); // 20. what the parent may reach

// 21. local composables last — a feature's logic wrapped up, used only here
function useUserDialog() {
  const dialogOpen = ref(false);

  function openDialog() {
    dialogOpen.value = true;
  }

  return { dialogOpen, openDialog };
}
</script>
```

## The grouping rule beats the section numbers

Sections 15–17 are for component-wide concerns. A feature's own state, derived values, and watcher stay together instead of being filed three sections apart.

```ts
// ✅ one feature, one place
const selectedIds = ref<number[]>([]);
const allSelected = computed(
  () => selectedIds.value.length === users.value?.length
);

function toggleAll() {
  selectedIds.value = allSelected.value
    ? []
    : (users.value ?? []).map((u) => u.id);
}

watch(users, () => {
  selectedIds.value = [];
});

// ❌ the same four lines scattered into "refs", "computed", "functions", "watchers" sections
```

## The auto-import boundary

What must be imported and what must not, under Nuxt's defaults.

```ts
// ❌ all auto-imported — remove these lines
import { ref, computed, watch } from 'vue';
import { useRoute, navigateTo } from '#app';
import { useUserDialog } from '@/composables/useUserDialog';
import { formatDate } from '@/utils/formatDate';

// ✅ genuinely external, or outside the auto-registered component dirs
import { useDebounceFn } from '@vueuse/core';
import UserFormDialog from '@/components/users/UserFormDialog.vue';
```

`@/components/_shared/` is auto-registered, so its components are used in the template with no import at all. Everything under other component folders is imported explicitly — see [`component-naming.md`](component-naming.md).

## Props, model, and emits

Order is `defineProps` → `defineModel` → `defineEmits`. Bind to a `const` only when script logic reads it.

```vue
<script setup lang="ts">
// ✅ not assigned — the template reads `title` directly
defineProps<{
  title: string;
  disabled?: boolean;
}>();

const model = defineModel<string>({ required: true });

// A second model lets a parent share one toggle across sibling fields.
const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  submit: [value: string];
  cancel: [];
}>();

function handleSubmit() {
  emit('submit', model.value);
}
</script>
```

```vue
<script setup lang="ts">
// ✅ assigned — script logic reads it
const props = defineProps<{ userId: number }>();

const { data: user } = useFetchUser(computed(() => props.userId));
</script>
```

A prop with a default takes `withDefaults`, always — the type says what the prop is, the second argument says only what it falls back to.

```vue
<script setup lang="ts">
// ✅ the optional prop is typed optional, and its fallback is in one place
const props = withDefaults(
  defineProps<{ tier?: HeaderTier; rows?: number }>(),
  {
    tier: 'labelled',
    rows: 10
  }
);
</script>
```

## Event and handler naming

The emit is declared and listened for under the same camelCase name, and the parent's handler matches it.

```vue
<!-- child -->
<script setup lang="ts">
const emit = defineEmits<{
  select: [user: User]; // ✅ imperative
  updateItem: [id: number]; // ✅ camelCase, declared once
  removalConfirmed: [id: number]; // ❌ names the outcome — `remove`
}>();

// ✅ no matching emit — named for intent, not for the input device
function handleSearch(event: Event) {
  term.value = (event.target as HTMLInputElement).value;
}
</script>
```

With no emit to pair with, a bare intent verb is equally correct — and a set of them reads better paired than prefixed. What the rule forbids is naming the input device.

```vue
<script setup lang="ts">
// ✅ nothing to pair with; the verb is the intent
function openPicker(index: number) {
  pickerSlot.value = index;
}

function closeDelete() {
  deleteTarget.value = null;
}

function confirmDelete() {
  remove(deleteTarget.value!);
}

// ❌ the input device, whatever the prefix
function handleDeleteButtonClick() {
  remove(deleteTarget.value!);
}
</script>
```

```vue
<!-- parent -->
<template>
  <!-- ✅ declared camelCase, listened kebab-case; handler matches the event -->
  <UserCard
    :user="user"
    @select="handleSelect"
    @update-item="handleUpdateItem"
  />

  <!-- ✅ a loop item only the template holds, passed through an arrow -->
  <v-btn v-for="user in users" :key="user.id" @click="() => handleSelect(user)">
    Pick
  </v-btn>

  <!-- ❌ a call, not a handler; ❌ camelCase at the call site; ❌ logic inline -->
  <v-btn @click="handleSelect(user)">Pick</v-btn>
  <UserCard @updateItem="handleUpdateItem" @click="dirty ? save() : close()" />

  <!-- ❌ the arrow carries a prop the script can read, and a fallback that belongs in a handler -->
  <v-btn @click="() => remove(props.userId ?? 0)">Remove</v-btn>
</template>
```

A value the script can already read gets a named handler, even when the handler is one line.

```vue
<script setup lang="ts">
const props = defineProps<{ userId: number }>();

const emit = defineEmits<{ remove: [id: number] }>();

// ✅ bound as `@click="handleRemove"`
function handleRemove() {
  emit('remove', props.userId);
}
</script>
```

## Bindings name values

A binding is read for what it renders. The threshold is one ternary: past that, the value gets a name.

```vue
<template>
  <!-- ✅ a name, an optional chain with a fallback, and a single ternary -->
  <UserCard
    :name="user.name"
    :alt="user.title ?? ''"
    :icon="isOpen ? 'chevron-up' : 'chevron-down'"
  />

  <!-- ❌ three operands; ❌ a string built from two lookups; ❌ an object literal; ❌ a non-null assertion -->
  <UserCard
    v-if="draftCount > 0 || hasInvites || isOwner"
    :title="`${plan.name}: ${plan.description}`"
    :confirmation="
      () => confirm({ kind: 'plan', name: plan!.name, active: isActive })
    "
  />
</template>

<script setup lang="ts">
// ✅ each one named for what it means
const hasSomethingToShow = computed(
  () => draftCount.value > 0 || hasInvites.value || isOwner.value
);

const planTitle = computed(
  () => `${plan.value.name}: ${plan.value.description}`
);

function planConfirmation() {
  return confirm({
    kind: 'plan',
    name: plan.value.name,
    active: isActive.value
  });
}
</script>
```

## Template casing and `v-for` / `v-if`

```vue
<template>
  <!-- ✅ PascalCase project component, kebab-case library component -->
  <UserCard :user="user" @select="handleSelect" />

  <v-btn variant="tonal" @click="handleSave">Save</v-btn>

  <!-- ✅ filter in a computed, then iterate — never v-if and v-for together -->
  <ul>
    <li v-for="user in activeUsers" :key="user.id">
      {{ user.name }}
    </li>
  </ul>

  <!-- ❌ v-if + v-for on one element; ❌ :key="index" -->
  <li v-for="(user, index) in users" v-if="user.active" :key="index">
    {{ user.name }}
  </li>
</template>
```
