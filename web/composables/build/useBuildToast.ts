export type BuildOutcome =
  | 'saved'
  | 'created'
  | 'copied'
  | 'renamed'
  | 'deleted';

export type BuildLocation = 'cloud' | 'local';

const TITLES: Record<BuildOutcome, (name: string) => string> = {
  saved: (name) => `Saved "${name}"`,
  created: (name) => `Created "${name}"`,
  copied: (name) => `Saved a copy as "${name}"`,
  renamed: (name) => `Renamed to "${name}"`,
  deleted: (name) => `Deleted "${name}"`
};

const LOCATIONS: Record<BuildLocation, string> = {
  cloud: 'In your account',
  local: 'In this browser'
};

// * The one wording for what a build action did and where the build lives, so no toast can leave a player unsure whether it reached the account (feature 029, Toasts).
export function useBuildToast() {
  const toast = useToast();

  function reportBuild(
    outcome: BuildOutcome,
    name: string,
    location: BuildLocation
  ) {
    toast.add({
      title: TITLES[outcome](name),
      description: LOCATIONS[location],
      color: outcome === 'deleted' ? 'neutral' : 'success'
    });
  }

  return { reportBuild };
}
