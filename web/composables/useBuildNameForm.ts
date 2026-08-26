import { maxLength, required, withMessage } from '@regle/rules';
import type { Ref } from 'vue';

export const BUILD_NAME_MAX_LENGTH = 80;

/**
 * The build-name field, validated the way the server validates it.
 *
 * Rules mirror feature 005: required and at most 80 characters, both measured after trimming,
 * so the client rejects what the server would reject rather than round-tripping to find out.
 */
export function useBuildNameForm(
  name: Ref<string>,
  options: {
    externalErrors?: Ref<Record<string, string[]>>;
    /**
     * Whether an empty name is a validation failure.
     *
     * `false` for feature 001's local dialogs, which document an empty name as falling back to
     * a generated one — that behaviour is unchanged by feature 008. `true` (the default) for
     * anything that posts to the API, where the server requires 1–80 characters after trim.
     */
    requireName?: boolean;
  } = {}
) {
  const { externalErrors, requireName = true } = options;
  const nameRules = requireName
    ? {
        required,
        // * The server trims first, so a name of only spaces is empty to it — `required` alone
        // * would let that through.
        notBlank: withMessage(
          (value: unknown) => String(value ?? '').trim().length > 0,
          'Enter a build name.'
        )
      }
    : {};
  const form = computed({
    get: () => ({ name: name.value }),
    set: (next: { name: string }) => {
      name.value = next.name;
    }
  });

  const { r$ } = useRegle(
    form,
    {
      name: {
        ...nameRules,
        maxLength: withMessage(
          maxLength(BUILD_NAME_MAX_LENGTH),
          `Use at most ${BUILD_NAME_MAX_LENGTH} characters.`
        )
      }
    },
    { externalErrors }
  );

  return { r$ };
}
