import { maxLength, required, withMessage } from '@regle/rules';

export const BUILD_NAME_MAX_LENGTH = 80;

export function useBuildNameForm(
  name: Ref<string>,
  options: {
    externalErrors?: Ref<Record<string, string[]>>;
    requireName?: boolean;
  } = {}
) {
  const { externalErrors, requireName = true } = options;
  const nameRules = requireName
    ? {
        required,
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
