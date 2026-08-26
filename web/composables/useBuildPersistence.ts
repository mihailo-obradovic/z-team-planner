import { DEFAULT_EP3_CUT, DEFAULT_EP4_HIRE, STAT_NAMES } from '@/types/hero';
import type { HeroId, HeroPowerSelection, HeroStats } from '@/types/hero';
import type { SavedBuild, SerializedBuild } from '@/types/build';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY_BUILDS = 'z-team-builds';
const STORAGE_KEY_ACTIVE = 'z-team-active-build';
const URL_PARAM = 'build';

// ============================================================================
// LOCAL STORAGE HELPER
// ============================================================================

function useLocalStorageRef<T>(key: string, defaultValue: T): Ref<T> {
  const data = ref(defaultValue) as Ref<T>;

  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) data.value = JSON.parse(stored);
    } catch {
      // * ignore corrupt data
    }

    watch(
      data,
      (val) => {
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch {
          /* ignore quota errors */
        }
      },
      { deep: true }
    );
  }

  return data;
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

function statsToArray(stats: HeroStats): number[] {
  return STAT_NAMES.map((s) => stats[s]);
}

function arrayToStats(arr: number[]): HeroStats {
  return Object.fromEntries(
    STAT_NAMES.map((s, i) => [s, arr[i] ?? 0])
  ) as HeroStats;
}

function isZeroStats(stats: HeroStats): boolean {
  return STAT_NAMES.every((s) => stats[s] === 0);
}

// ============================================================================
// SERIALIZATION
// ============================================================================

function serializeCurrentState(
  ep3Cut: Ref<HeroId>,
  ep4Hire: Ref<HeroId>,
  showEp8Recruits: Ref<boolean>,
  heroLevelUps: Ref<Partial<Record<HeroId, HeroStats>>>,
  heroBonusLevels: Ref<Partial<Record<HeroId, number>>>,
  heroPowers: Ref<Partial<Record<HeroId, HeroPowerSelection>>>,
  heroSpecialPowers: Ref<Partial<Record<HeroId, number>>>,
  heroFlights: Ref<Partial<Record<HeroId, boolean>>>
): SerializedBuild {
  const build: SerializedBuild = { v: 1 };

  // * Episode setup (omit defaults)
  if (ep3Cut.value !== DEFAULT_EP3_CUT) build.ec = ep3Cut.value;
  if (ep4Hire.value !== DEFAULT_EP4_HIRE) build.eh = ep4Hire.value;
  if (showEp8Recruits.value) build.e8 = 1;

  // * Level-ups (only non-zero allocations)
  const lu: Record<string, number[]> = {};

  for (const [id, stats] of Object.entries(heroLevelUps.value)) {
    if (stats && !isZeroStats(stats)) {
      lu[id] = statsToArray(stats);
    }
  }

  if (Object.keys(lu).length > 0) build.lu = lu;

  // * Bonus levels (only non-zero)
  const bl: Record<string, number> = {};

  for (const [id, level] of Object.entries(heroBonusLevels.value)) {
    if (level && level > 0) bl[id] = level;
  }

  if (Object.keys(bl).length > 0) build.bl = bl;

  // * Power selections (only non-default)
  const pw: Record<string, [number, number]> = {};

  for (const [id, power] of Object.entries(heroPowers.value)) {
    if (power && (power.startingRevealed || power.trainableSelected > 0)) {
      pw[id] = [power.startingRevealed ? 1 : 0, power.trainableSelected];
    }
  }

  if (Object.keys(pw).length > 0) build.pw = pw;

  // * Special powers (only non-zero)
  const sp: Record<string, number> = {};

  for (const [id, state] of Object.entries(heroSpecialPowers.value)) {
    if (state && state > 0) sp[id] = state;
  }

  if (Object.keys(sp).length > 0) build.sp = sp;

  // * Flights (only true entries)
  const fl: string[] = [];

  for (const [id, flying] of Object.entries(heroFlights.value)) {
    if (flying) fl.push(id);
  }

  if (fl.length > 0) build.fl = fl;

  return build;
}

async function deserializeIntoState(
  build: SerializedBuild,
  ep3Cut: Ref<HeroId>,
  ep4Hire: Ref<HeroId>,
  showEp8Recruits: Ref<boolean>,
  heroLevelUps: Ref<Partial<Record<HeroId, HeroStats>>>,
  heroBonusLevels: Ref<Partial<Record<HeroId, number>>>,
  heroPowers: Ref<Partial<Record<HeroId, HeroPowerSelection>>>,
  heroSpecialPowers: Ref<Partial<Record<HeroId, number>>>,
  heroFlights: Ref<Partial<Record<HeroId, boolean>>>
) {
  // * Set episode choices first — watchers in sub-composables reset
  // * dependent state for cut/non-hired heroes during the next tick
  ep3Cut.value = build.ec ?? DEFAULT_EP3_CUT;
  ep4Hire.value = build.eh ?? DEFAULT_EP4_HIRE;
  showEp8Recruits.value = build.e8 === 1;

  // * Wait for watchers to flush before overwriting dependent state
  await nextTick();

  // * Level-ups
  const lu: Partial<Record<HeroId, HeroStats>> = {};

  if (build.lu) {
    for (const [id, arr] of Object.entries(build.lu)) {
      lu[id as HeroId] = arrayToStats(arr);
    }
  }

  heroLevelUps.value = lu;

  // * Bonus levels
  const bl: Partial<Record<HeroId, number>> = {};

  if (build.bl) {
    for (const [id, level] of Object.entries(build.bl)) {
      bl[id as HeroId] = level;
    }
  }

  heroBonusLevels.value = bl;

  // * Powers
  const pw: Partial<Record<HeroId, HeroPowerSelection>> = {};

  if (build.pw) {
    for (const [id, [revealed, selected]] of Object.entries(build.pw)) {
      pw[id as HeroId] = {
        startingRevealed: revealed === 1,
        trainableSelected: selected as 0 | 1 | 2
      };
    }
  }

  heroPowers.value = pw;

  // * Special powers
  const sp: Partial<Record<HeroId, number>> = {};

  if (build.sp) {
    for (const [id, state] of Object.entries(build.sp)) {
      sp[id as HeroId] = state;
    }
  }

  heroSpecialPowers.value = sp;

  // * Flights
  const fl: Partial<Record<HeroId, boolean>> = {};

  if (build.fl) {
    for (const id of build.fl) {
      fl[id as HeroId] = true;
    }
  }

  heroFlights.value = fl;
}

// ============================================================================
// URL ENCODING / DECODING
// ============================================================================

function encodeBuildToUrl(build: SerializedBuild): string {
  const json = JSON.stringify(build);

  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBuildFromUrl(encoded: string): SerializedBuild | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);

    const parsed = JSON.parse(json);

    if (parsed.v !== 1) return null;

    return parsed as SerializedBuild;
  } catch {
    return null;
  }
}

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useBuildPersistence() {
  // * Access all mutable state via useState (same refs as sub-composables)
  const ep3Cut = useState<HeroId>('ep3Cut');
  const ep4Hire = useState<HeroId>('ep4Hire');
  const showEp8Recruits = useState<boolean>('showEp8Recruits');
  const heroLevelUps =
    useState<Partial<Record<HeroId, HeroStats>>>('heroLevelUps');
  const heroBonusLevels =
    useState<Partial<Record<HeroId, number>>>('heroBonusLevels');
  const heroPowers =
    useState<Partial<Record<HeroId, HeroPowerSelection>>>('heroPowers');
  const heroSpecialPowers =
    useState<Partial<Record<HeroId, number>>>('heroSpecialPowers');
  const heroFlights = useState<Partial<Record<HeroId, boolean>>>('heroFlights');

  // * localStorage
  const savedBuilds = useLocalStorageRef<SavedBuild[]>(STORAGE_KEY_BUILDS, []);
  const activeBuildId = useLocalStorageRef<string | null>(
    STORAGE_KEY_ACTIVE,
    null
  );

  // * Shared-build mode
  const isViewingSharedBuild = ref(false);

  // * Dirty tracking
  // * Snapshot of the last-saved state, used to detect unsaved changes
  const savedSnapshot = ref<string>('');

  function takeSnapshot(): string {
    return JSON.stringify(
      serializeCurrentState(
        ep3Cut,
        ep4Hire,
        showEp8Recruits,
        heroLevelUps,
        heroBonusLevels,
        heroPowers,
        heroSpecialPowers,
        heroFlights
      )
    );
  }

  function updateSavedSnapshot() {
    savedSnapshot.value = takeSnapshot();
  }

  const hasUnsavedChanges = computed(() => {
    if (isViewingSharedBuild.value) return false;

    return takeSnapshot() !== savedSnapshot.value;
  });

  // * Build CRUD
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getActiveBuild(): SavedBuild | undefined {
    if (!activeBuildId.value) return undefined;

    return savedBuilds.value.find(
      (b: SavedBuild) => b.id === activeBuildId.value
    );
  }

  /**
   * The planner's current state as a `SerializedBuild`.
   *
   * Exposed so an account save (feature 005) stores exactly the format a local save stores —
   * one serialiser, so the two paths cannot drift.
   */
  function serializeCurrentBuild(): SerializedBuild {
    return serializeCurrentState(
      ep3Cut,
      ep4Hire,
      showEp8Recruits,
      heroLevelUps,
      heroBonusLevels,
      heroPowers,
      heroSpecialPowers,
      heroFlights
    );
  }

  function saveBuild(name?: string) {
    const data = serializeCurrentState(
      ep3Cut,
      ep4Hire,
      showEp8Recruits,
      heroLevelUps,
      heroBonusLevels,
      heroPowers,
      heroSpecialPowers,
      heroFlights
    );

    const existing = getActiveBuild();

    if (existing) {
      existing.data = data;
      existing.savedAt = Date.now();
      if (name !== undefined) existing.name = name;
    } else {
      const build: SavedBuild = {
        id: generateId(),
        name: name ?? 'Build ' + (savedBuilds.value.length + 1),
        data,
        savedAt: Date.now()
      };

      savedBuilds.value.push(build);
      activeBuildId.value = build.id;
    }

    isViewingSharedBuild.value = false;
    clearUrlParam();
    updateSavedSnapshot();
  }

  function saveAsNewBuild(name: string) {
    const data = serializeCurrentState(
      ep3Cut,
      ep4Hire,
      showEp8Recruits,
      heroLevelUps,
      heroBonusLevels,
      heroPowers,
      heroSpecialPowers,
      heroFlights
    );

    const build: SavedBuild = {
      id: generateId(),
      name,
      data,
      savedAt: Date.now()
    };

    savedBuilds.value.push(build);
    activeBuildId.value = build.id;
    isViewingSharedBuild.value = false;
    clearUrlParam();
    updateSavedSnapshot();
  }

  async function loadBuild(id: string) {
    const build = savedBuilds.value.find((b: SavedBuild) => b.id === id);
    if (!build) return;

    activeBuildId.value = id;
    isViewingSharedBuild.value = false;
    clearUrlParam();

    await deserializeIntoState(
      build.data,
      ep3Cut,
      ep4Hire,
      showEp8Recruits,
      heroLevelUps,
      heroBonusLevels,
      heroPowers,
      heroSpecialPowers,
      heroFlights
    );

    updateSavedSnapshot();
  }

  function deleteBuild(id: string) {
    const index = savedBuilds.value.findIndex((b: SavedBuild) => b.id === id);
    if (index === -1) return;

    savedBuilds.value.splice(index, 1);

    if (activeBuildId.value === id) {
      activeBuildId.value = savedBuilds.value[0]?.id ?? null;
    }
  }

  function renameBuild(id: string, name: string) {
    const build = savedBuilds.value.find((b: SavedBuild) => b.id === id);
    if (build) build.name = name;
  }

  // * URL sharing
  function clearUrlParam() {
    const url = new URL(window.location.href);

    if (url.searchParams.has(URL_PARAM)) {
      url.searchParams.delete(URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  }

  function getShareUrl(): string {
    const data = serializeCurrentState(
      ep3Cut,
      ep4Hire,
      showEp8Recruits,
      heroLevelUps,
      heroBonusLevels,
      heroPowers,
      heroSpecialPowers,
      heroFlights
    );

    const encoded = encodeBuildToUrl(data);
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, encoded);

    // * Remove other params that might be stale
    return url.toString();
  }

  async function shareBuild(): Promise<boolean> {
    const url = getShareUrl();

    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  // * Shared build actions
  function saveSharedAsMyBuild(name: string) {
    saveAsNewBuild(name);
  }

  async function backToMyBuild() {
    isViewingSharedBuild.value = false;
    clearUrlParam();

    const active = getActiveBuild();

    if (active) {
      await deserializeIntoState(
        active.data,
        ep3Cut,
        ep4Hire,
        showEp8Recruits,
        heroLevelUps,
        heroBonusLevels,
        heroPowers,
        heroSpecialPowers,
        heroFlights
      );
    }

    updateSavedSnapshot();
  }

  // * Initialization
  /**
   * Load a build document fetched from the API into the planner, in shared-build mode.
   *
   * The `?build=` path decodes a snapshot out of the URL; this one takes an already-decoded
   * document from `/b/{id}` (feature 007). Both end in the same deserialisation, so the
   * ordering guarantee — episode choices first, dependent state after `nextTick()` — holds
   * for either entry point.
   */
  async function loadSharedBuild(build: SerializedBuild) {
    isViewingSharedBuild.value = true;

    await applySerializedBuild(build);
  }

  /**
   * Load an account build (feature 008) into the planner.
   *
   * Same deserialisation as the shared path, but *not* shared-build mode: the signed-in owner
   * is editing their own document, so the "viewing shared build" banner must not appear.
   */
  async function loadAccountBuild(build: SerializedBuild) {
    isViewingSharedBuild.value = false;

    await applySerializedBuild(build);
  }

  async function applySerializedBuild(build: SerializedBuild) {
    await deserializeIntoState(
      build,
      ep3Cut,
      ep4Hire,
      showEp8Recruits,
      heroLevelUps,
      heroBonusLevels,
      heroPowers,
      heroSpecialPowers,
      heroFlights
    );
  }

  async function initialize() {
    // * Only run on client
    if (import.meta.server) return;

    const route = useRoute();
    const buildParam = route.query[URL_PARAM] as string | undefined;

    if (buildParam) {
      // * Load from URL - shared build mode
      const decoded = decodeBuildFromUrl(buildParam);

      if (decoded) {
        isViewingSharedBuild.value = true;

        await deserializeIntoState(
          decoded,
          ep3Cut,
          ep4Hire,
          showEp8Recruits,
          heroLevelUps,
          heroBonusLevels,
          heroPowers,
          heroSpecialPowers,
          heroFlights
        );
      }
    }

    if (!isViewingSharedBuild.value) {
      // * No build param, or an undecodable one - fall back to the active
      // * build and strip the dead param so a reload cannot re-trip on it
      if (buildParam) clearUrlParam();

      const active = getActiveBuild();

      if (active) {
        await deserializeIntoState(
          active.data,
          ep3Cut,
          ep4Hire,
          showEp8Recruits,
          heroLevelUps,
          heroBonusLevels,
          heroPowers,
          heroSpecialPowers,
          heroFlights
        );
      }
    }

    // Take initial snapshot for dirty tracking
    updateSavedSnapshot();
  }

  // --- Beforeunload ---

  function setupBeforeUnload() {
    if (import.meta.server) return;

    window.addEventListener('beforeunload', (e) => {
      if (hasUnsavedChanges.value) {
        e.preventDefault();
      }
    });
  }

  // * Derived here rather than in a component: both the build controls and the
  // * dialogs that rename or delete the active build need the same name, and they
  // * no longer share a component to compute it in.
  const activeBuildName = computed(
    () =>
      savedBuilds.value.find((b) => b.id === activeBuildId.value)?.name ??
      'Untitled'
  );

  return {
    // State
    savedBuilds: computed(() => savedBuilds.value),
    activeBuildId: computed(() => activeBuildId.value),
    activeBuildName,
    isViewingSharedBuild: computed(() => isViewingSharedBuild.value),
    hasUnsavedChanges,

    // Build management
    serializeCurrentBuild,
    saveBuild,
    saveAsNewBuild,
    loadBuild,
    deleteBuild,
    renameBuild,

    // Sharing
    shareBuild,
    getShareUrl,

    // Server-side build actions
    loadSharedBuild,
    loadAccountBuild,
    saveSharedAsMyBuild,
    backToMyBuild,

    // Lifecycle
    initialize,
    setupBeforeUnload
  };
}
