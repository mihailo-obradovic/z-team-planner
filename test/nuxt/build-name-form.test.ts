import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import { useBuildNameForm } from '@/composables/useBuildNameForm';
import { useExternalErrors } from '@/composables/useExternalErrors';
import { useValidationErrors } from '@/composables/useValidationErrors';

type NameForm = ReturnType<typeof useBuildNameForm>['r$'];

async function mountForm(
  name: ReturnType<typeof ref<string>>,
  options: Parameters<typeof useBuildNameForm>[1] = {}
) {
  let form: NameForm | undefined;

  await mountSuspended(
    defineComponent({
      setup() {
        form = useBuildNameForm(name as never, options).r$;

        return () => h('div');
      }
    })
  );

  return form as NameForm;
}

describe('useBuildNameForm', () => {
  it('accepts a normal name', async () => {
    const form = await mountForm(ref('Main'));

    expect(form.$invalid).toBe(false);
  });

  it('rejects a name over 80 characters', async () => {
    // * Feature 006, Examples: "Save as new with a 90-char name -> inline field error".
    const form = await mountForm(ref('x'.repeat(90)));

    await form.$validate();

    expect(form.$invalid).toBe(true);
    expect(form.$errors.name.join(' ')).toContain('80 characters');
  });

  it('accepts exactly 80 characters', async () => {
    const form = await mountForm(ref('x'.repeat(80)));

    await form.$validate();

    expect(form.$invalid).toBe(false);
  });

  it('rejects an empty name when the server requires one', async () => {
    const form = await mountForm(ref(''), { requireName: true });

    await form.$validate();

    expect(form.$invalid).toBe(true);
  });

  it('rejects a whitespace-only name when the server requires one', async () => {
    // ! `required` alone would pass this: the server trims first, so it is empty to the API.
    const form = await mountForm(ref('   '), { requireName: true });

    await form.$validate();

    expect(form.$invalid).toBe(true);
  });

  it('allows an empty name where feature 001 falls back to a generated one', async () => {
    const form = await mountForm(ref(''), { requireName: false });

    await form.$validate();

    expect(form.$invalid).toBe(false);
  });
});

describe('useValidationErrors', () => {
  it('maps a 422 detail onto its field', async () => {
    const error = ref<unknown>({
      statusCode: 422,
      data: {
        error: { details: [{ path: 'name', message: 'Name already used' }] }
      }
    });

    let mapped: Record<string, string[]> = {};

    await mountSuspended(
      defineComponent({
        setup() {
          const errors = useValidationErrors(error);
          mapped = errors.value;

          return () => h('div');
        }
      })
    );

    expect(mapped).toEqual({ name: ['Name already used'] });
  });

  it('takes the last segment of a dotted server path', async () => {
    const error = ref<unknown>({
      data: { error: { details: [{ path: 'data.name', message: 'Too long' }] } }
    });

    let mapped: Record<string, string[]> = {};

    await mountSuspended(
      defineComponent({
        setup() {
          mapped = useValidationErrors(error).value;

          return () => h('div');
        }
      })
    );

    expect(mapped).toEqual({ name: ['Too long'] });
  });

  it('is empty for an error carrying no details', async () => {
    const error = ref<unknown>({ statusCode: 500 });
    let mapped: Record<string, string[]> = {};

    await mountSuspended(
      defineComponent({
        setup() {
          mapped = useValidationErrors(error).value;

          return () => h('div');
        }
      })
    );

    expect(mapped).toEqual({});
  });
});

describe('useExternalErrors', () => {
  it('copies rather than shares, so Regle cannot write back into derived state', async () => {
    const source = ref<Record<string, string[]>>({ name: ['Server said no'] });
    let mirrored: ReturnType<typeof useExternalErrors> | undefined;

    await mountSuspended(
      defineComponent({
        setup() {
          mirrored = useExternalErrors(source);

          return () => h('div');
        }
      })
    );

    expect(mirrored?.value).toEqual({ name: ['Server said no'] });

    // ! Regle clears a field's entry as the user edits; that must not reach the mutation's derived error state.
    mirrored!.value = {};

    expect(source.value).toEqual({ name: ['Server said no'] });
  });
});
