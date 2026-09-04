// * The wording of a confirmation — the line a tapped chip shows on a no-hover device naming what the tap did (feature 018). Derived from the chip's state *after* the action; `null` means show nothing, which is every deactivation.
export type ChipOutcome =
  | { kind: 'starting'; name: string; revealed: boolean }
  | { kind: 'upgrade'; name: string; trained: boolean }
  | { kind: 'flight'; name: string | null; trained: boolean }
  | { kind: 'supernova'; on: boolean }
  | { kind: 'monster-form'; form: 'mega-bat' | 'hybrid' }
  | { kind: 'en-pointe'; state: 0 | 1 | 2; bonus: 1 | 3 }
  | { kind: 'spread-thin'; slots: 0 | 1 | 2 | 3 };

export function confirmationText(outcome: ChipOutcome): string | null {
  switch (outcome.kind) {
    case 'starting': {
      return outcome.revealed ? `${outcome.name} revealed` : null;
    }
    case 'upgrade': {
      return outcome.trained ? `${outcome.name} trained` : null;
    }
    case 'flight': {
      // * A flight the game never names (Blonde Blazer's, Sonar's) still trains as "Flight".
      return outcome.trained ? `${outcome.name ?? 'Flight'} trained` : null;
    }
    case 'supernova': {
      return outcome.on ? 'Supernova on' : null;
    }
    case 'monster-form': {
      // * Both forms are states rather than an on and an off, so the way back is named too.
      return outcome.form === 'mega-bat' ? 'Mega Bat Form' : 'Hybrid Form';
    }
    case 'en-pointe': {
      if (outcome.state === 0) {
        return null;
      }
      const stat = outcome.state === 1 ? 'Combat' : 'Mobility';

      return `En Pointe: ${stat} +${outcome.bonus}`;
    }
    case 'spread-thin': {
      if (outcome.slots === 0) {
        return null;
      }

      return `Spread Thin: +${outcome.slots} slot${outcome.slots > 1 ? 's' : ''}`;
    }
  }
}
