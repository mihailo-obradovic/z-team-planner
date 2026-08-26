// * Identity as this app models it. Deliberately not Firebase's `User`: the store holds only
// * what the UI renders, so swapping the identity provider does not ripple into components.
export type AuthStatus = 'unknown' | 'anonymous' | 'signed-in';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};
