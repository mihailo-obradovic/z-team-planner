// * Identity as this app models it. Deliberately not Firebase's `User`: the store holds only what the UI renders, so swapping the identity provider does not ripple into components.
export type AuthStatus = 'unknown' | 'anonymous' | 'signed-in';

// * Whether there is anything to sign in to at all — a build with no API behind it has nothing, and that is a property of the deployment rather than of the user.
export type SignInAvailability = 'available' | 'unavailable';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};
