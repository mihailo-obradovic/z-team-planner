import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractMessage, handleApiError } from '@/utils/handleApiError';

function apiError(statusCode: number, message?: string, code?: string) {
  return {
    statusCode,
    message: `[GET] "/x": ${statusCode}`,
    data: { error: { code: code ?? 'x', message } }
  };
}

function makeContext() {
  return {
    routePath: '/',
    resetUser: vi.fn<() => void>(),
    showToast: vi.fn<(message: string) => void>(),
    showNotFoundPage: vi.fn<() => void>(),
    showConflictDialog: vi.fn<(error: unknown) => void>()
  };
}

describe('handleApiError', () => {
  let context: ReturnType<typeof makeContext>;

  beforeEach(() => {
    context = makeContext();
  });

  it('signs the user out and toasts on 401', () => {
    handleApiError(apiError(401), context);

    expect(context.resetUser).toHaveBeenCalledOnce();
    expect(context.showToast).toHaveBeenCalledOnce();
    // * No redirect: nothing in this app requires an account.
    expect(context.showNotFoundPage).not.toHaveBeenCalled();
  });

  it('toasts on 403', () => {
    handleApiError(apiError(403, 'Forbidden'), context);

    expect(context.showToast).toHaveBeenCalledWith('Forbidden');
  });

  it('shows the 404 page on a share route', () => {
    context.routePath = '/b/6b1f-not-a-build';

    handleApiError(apiError(404), context);

    expect(context.showNotFoundPage).toHaveBeenCalledOnce();
    expect(context.showToast).not.toHaveBeenCalled();
  });

  it('toasts a 404 anywhere else', () => {
    handleApiError(apiError(404, 'No such build'), context);

    expect(context.showToast).toHaveBeenCalledWith('No such build');
    expect(context.showNotFoundPage).not.toHaveBeenCalled();
  });

  it('toasts the limit on 409', () => {
    handleApiError(
      apiError(409, 'You can keep up to 20 builds', 'build_limit'),
      context
    );

    expect(context.showToast).toHaveBeenCalledWith(
      'You can keep up to 20 builds'
    );
  });

  it('opens the conflict dialog on 412 and never toasts', () => {
    const error = apiError(412);

    handleApiError(error, context);

    // ! The user has to see the other device's build to choose; a toast would drop it.
    expect(context.showConflictDialog).toHaveBeenCalledWith(error);
    expect(context.showToast).not.toHaveBeenCalled();
  });

  it('toasts a 422 by default', () => {
    handleApiError(apiError(422, 'Validation failed.'), context);

    expect(context.showToast).toHaveBeenCalledWith('Validation failed.');
  });

  it('stays silent on 422 when the form renders it inline', () => {
    handleApiError(apiError(422, 'Validation failed.'), context, {
      suppressToasts: 'validation'
    });

    expect(context.showToast).not.toHaveBeenCalled();
  });

  it('still toasts a 500 when only the validation toast is hidden', () => {
    // * `validation` is narrower than `all` precisely so this case survives.
    handleApiError(apiError(500, 'An unexpected error occurred.'), context, {
      suppressToasts: 'validation'
    });

    expect(context.showToast).toHaveBeenCalledWith(
      'An unexpected error occurred.'
    );
  });

  it('toasts on 429', () => {
    handleApiError(apiError(429, 'Too many requests'), context);

    expect(context.showToast).toHaveBeenCalledWith('Too many requests');
  });

  it('hides every toast when suppressToasts is all', () => {
    handleApiError(apiError(500, 'boom'), context, { suppressToasts: 'all' });

    expect(context.showToast).not.toHaveBeenCalled();
  });

  it('handles each error object only once', () => {
    const error = apiError(500, 'boom');

    handleApiError(error, context);
    handleApiError(error, context);

    expect(context.showToast).toHaveBeenCalledOnce();
  });

  it('treats a second, equal-looking error as its own', () => {
    handleApiError(apiError(500, 'boom'), context);
    handleApiError(apiError(500, 'boom'), context);

    // * Identity, not equality: two failed requests are two things to tell the user about.
    expect(context.showToast).toHaveBeenCalledTimes(2);
  });
});

describe('extractMessage', () => {
  it('prefers what the API said', () => {
    expect(extractMessage(apiError(409, 'You can keep up to 20 builds'))).toBe(
      'You can keep up to 20 builds'
    );
  });

  it('falls back to the transport message', () => {
    expect(
      extractMessage({ statusCode: 500, message: '[GET] "/x": 500' })
    ).toBe('[GET] "/x": 500');
  });

  it('falls back to a generic line', () => {
    expect(extractMessage(new Error(''))).toBe(
      'Something went wrong. Please try again.'
    );
    expect(extractMessage(null)).toBe(
      'Something went wrong. Please try again.'
    );
  });
});

describe('the 412 conflict path', () => {
  it('never toasts, even when the dialog cannot open', () => {
    const context = makeContext();

    handleApiError(apiError(412), context);

    // ! The dialog is the whole point of a 412: the user has to see the other device's build to choose between reloading it and saving theirs as new.
    expect(context.showConflictDialog).toHaveBeenCalledOnce();
    expect(context.showToast).not.toHaveBeenCalled();
  });

  it('hands the whole error to the dialog so it can read the body', () => {
    const context = makeContext();
    const error = apiError(412);

    handleApiError(error, context);

    expect(context.showConflictDialog).toHaveBeenCalledWith(error);
  });
});
