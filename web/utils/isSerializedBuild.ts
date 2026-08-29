import type { SerializedBuild } from '@/types/build';

export function isSerializedBuild(value: unknown): value is SerializedBuild {
  if (!isPlainObject(value)) {
    return false;
  }

  if (value.v !== 1) {
    return false;
  }

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
