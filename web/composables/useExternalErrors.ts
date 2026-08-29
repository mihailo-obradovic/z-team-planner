// * Mirror derived validation errors into a ref Regle owns.
// * A copy rather than the source itself: Regle clears a field's entry as the user edits it, and it must not write back into state derived from the mutation's error.
export function useExternalErrors(source: Ref<Record<string, string[]>>) {
  const externalErrors = ref<Record<string, string[]>>({});

  watch(
    source,
    (next) => {
      externalErrors.value = { ...next };
    },
    { immediate: true, deep: true }
  );

  return externalErrors;
}
