import type { SerializedBuild } from '@/types/build';

// * The one gate for "is this a build document this client understands", used by both paths a document arrives on: the API response schema (`types/api.ts`) and the `?build=` URL parameter (`useBuildPersistence.ts`). Two hand-written copies of the version check drifted apart unnoticed once already.
// ! Kinds only, never contents. Hero ids, stat ranges and budgets are the API's five validation tiers (feature 005), and re-checking them here would be a second definition of a protected format. What this catches is the shape that makes `deserializeIntoState` throw.
export function isSerializedBuild(value: unknown): value is SerializedBuild {
  if (!isPlainObject(value)) {
    return false;
  }

  // * The version gate, and the reason this runs at all: a v2 document would parse as an object and mean something else.
  if (value.v !== 1) {
    return false;
  }

  // ! Unknown keys are accepted on purpose. The format's contract is backward compatibility (feature 001), so a v1 document written by a later client has to stay readable here.
  return (
    isAbsentOr(value.ec, isString) &&
    isAbsentOr(value.eh, isString) &&
    isAbsentOr(value.e8, (candidate) => candidate === 1) &&
    isAbsentOr(value.lu, isPlainObject) &&
    isAbsentOr(value.bl, isPlainObject) &&
    isAbsentOr(value.pw, isPlainObject) &&
    isAbsentOr(value.sp, isPlainObject) &&
    isAbsentOr(value.fl, Array.isArray)
  );
}

function isAbsentOr(
  value: unknown,
  predicate: (candidate: unknown) => boolean
): boolean {
  return value === undefined || predicate(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): boolean {
  return typeof value === 'string';
}
