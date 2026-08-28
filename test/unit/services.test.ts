import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseResponse } from '@/utils/parseResponse';

// * Services call the auto-imported `fetcher` and `parseResponse`; the unit project runs outside Nuxt, so both are stubbed onto globalThis. parseResponse is the real one — these tests are partly about it actually rejecting a bad payload.
const fetcherMock =
  vi.fn<
    (path: string, options?: Record<string, unknown>) => Promise<unknown>
  >();

vi.stubGlobal('fetcher', fetcherMock);
vi.stubGlobal('parseResponse', parseResponse);

const {
  createBuild,
  deleteBuild,
  fetchBuild,
  fetchBuilds,
  importBuilds,
  updateBuild
} = await import('@/services/builds.api');
const { fetchSharedBuild } = await import('@/services/shared.api');
const { deleteMe, fetchMe } = await import('@/services/me.api');

const BUILD = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  name: 'Main',
  format_version: 1,
  created_at: '2026-08-26T07:00:00Z',
  updated_at: '2026-08-26T08:00:00Z',
  data: { v: 1 }
};

describe('builds service', () => {
  beforeEach(() => {
    fetcherMock.mockReset();
  });

  it('sends pagination as query params and parses the list', async () => {
    fetcherMock.mockResolvedValue({
      items: [{ ...BUILD, data: undefined }],
      total: 7,
      page: 2,
      page_size: 5
    });

    const result = await fetchBuilds(2, 5);

    expect(fetcherMock).toHaveBeenCalledWith('/builds', {
      query: { page: 2, page_size: 5 }
    });
    expect(result.total).toBe(7);
    expect(result.items[0]?.name).toBe('Main');
  });

  it('defaults to page 1, page size 20', async () => {
    fetcherMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20
    });

    await fetchBuilds();

    expect(fetcherMock.mock.calls[0]?.[1]).toEqual({
      query: { page: 1, page_size: 20 }
    });
  });

  it('parses a single build', async () => {
    fetcherMock.mockResolvedValue(BUILD);

    expect((await fetchBuild(BUILD.id)).data).toEqual({ v: 1 });
  });

  it('sends the idempotency key on create', async () => {
    fetcherMock.mockResolvedValue(BUILD);

    await createBuild({ name: 'Main', data: { v: 1 } }, 'key-1');

    const [path, options] = fetcherMock.mock.calls[0] as [
      string,
      Record<string, never>
    ];
    expect(path).toBe('/builds');
    expect(options).toMatchObject({
      method: 'POST',
      headers: { 'Idempotency-Key': 'key-1' }
    });
  });

  it('sends If-Match on update', async () => {
    fetcherMock.mockResolvedValue(BUILD);

    await updateBuild(BUILD.id, { name: 'Renamed' }, '2026-08-26T08:00:00Z');

    expect(fetcherMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      headers: { 'If-Match': '2026-08-26T08:00:00Z' }
    });
  });

  it('does not parse the empty delete response', async () => {
    fetcherMock.mockResolvedValue(undefined);

    await expect(deleteBuild(BUILD.id)).resolves.toBeUndefined();
    expect(fetcherMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });

  it('parses the per-item import report', async () => {
    fetcherMock.mockResolvedValue([
      { index: 0, status: 'created', id: BUILD.id, name: 'One' },
      {
        index: 1,
        status: 'invalid',
        errors: [{ path: 'data.fl[0]', message: 'bad' }]
      }
    ]);

    const report = await importBuilds({ builds: [] }, 'key-2');

    expect(report).toHaveLength(2);
    expect(report[1]?.errors?.[0]?.path).toBe('data.fl[0]');
  });
});

describe('shared and me services', () => {
  beforeEach(() => fetcherMock.mockReset());

  it('parses the public build', async () => {
    fetcherMock.mockResolvedValue({
      id: BUILD.id,
      name: 'Main',
      data: { v: 1 },
      updated_at: BUILD.updated_at
    });

    const build = await fetchSharedBuild(BUILD.id);

    expect(build.name).toBe('Main');
    // * The public read never carries the owner.
    expect('owner_id' in build).toBe(false);
  });

  it('parses the profile', async () => {
    fetcherMock.mockResolvedValue({
      display_name: 'Alice',
      email: 'alice@example.com',
      created_at: BUILD.created_at,
      build_count: 3
    });

    expect((await fetchMe()).build_count).toBe(3);
  });

  it('sends DELETE for account deletion', async () => {
    fetcherMock.mockResolvedValue(undefined);

    await deleteMe();

    expect(fetcherMock).toHaveBeenCalledWith('/me', { method: 'DELETE' });
  });
});

describe('parseResponse', () => {
  it('rejects a response missing a documented field', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { updated_at: _dropped, ...withoutUpdatedAt } = BUILD;
    fetcherMock.mockReset();
    fetcherMock.mockResolvedValue(withoutUpdatedAt);

    // * Feature 006's Examples row: a schema failure is a developer error — generic message to the user, the Zod issue in the console.
    await expect(fetchBuild(BUILD.id)).rejects.toThrow(
      'Something went wrong. Please try again.'
    );
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('rejects a build document of an unknown format version', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    fetcherMock.mockReset();
    fetcherMock.mockResolvedValue({ ...BUILD, data: { v: 2 } });

    await expect(fetchBuild(BUILD.id)).rejects.toThrow('Something went wrong.');

    consoleError.mockRestore();
  });
});
