import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';

// * Feature 029, Names: no two local builds share a name after any action.

async function localBuildsComposable() {
  let localBuilds!: ReturnType<typeof useLocalBuilds>;

  await mountSuspended(
    defineComponent({
      setup() {
        localBuilds = useLocalBuilds();

        return () => h('div');
      }
    })
  );

  return localBuilds;
}

function names(localBuilds: ReturnType<typeof useLocalBuilds>) {
  return localBuilds.localBuilds.value.map((localBuild) => localBuild.name);
}

describe('local build names', () => {
  beforeEach(() => {
    localStorage.clear();
    // * The collection lives in `useState` for the app's lifetime, which spans every test in this file.
    useState('z-team-builds').value = [];
    useState('z-team-open-build').value = { open: null, lastLocalId: null };
  });

  it('suffixes a new build whose name is taken, and reports the final name', async () => {
    const localBuilds = await localBuildsComposable();

    localBuilds.saveAsNewLocalBuild('Main');

    expect(localBuilds.saveAsNewLocalBuild(' Main ')).toBe('Main (2)');
    expect(names(localBuilds)).toEqual(['Main', 'Main (2)']);
  });

  it('gives a build saved with nothing open the default name', async () => {
    const localBuilds = await localBuildsComposable();

    localBuilds.saveLocalBuild();
    localBuilds.saveAsNewLocalBuild('');

    expect(names(localBuilds)).toEqual(['New build', 'New build (2)']);
  });

  it('suffixes a rename to a taken name and leaves a rename to its own name alone', async () => {
    const localBuilds = await localBuildsComposable();

    localBuilds.saveAsNewLocalBuild('Main');
    localBuilds.saveAsNewLocalBuild('Alt');

    const altId = localBuilds.activeBuildId.value!;

    expect(localBuilds.renameLocalBuild(altId, 'Alt')).toBe('Alt');
    expect(localBuilds.renameLocalBuild(altId, 'Main')).toBe('Main (2)');
    expect(names(localBuilds)).toEqual(['Main', 'Main (2)']);
  });
});
