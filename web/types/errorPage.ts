// * What a caller may hand the error page through `createError`'s `data` (feature 009).
export type ErrorPageData = {
  heading?: string;
  // ! `createError` turns a missing status into 500, so a failure that never reached a server has to say so or it is reported as a server fault.
  status?: 'unknown';
};
