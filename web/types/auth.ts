export type AuthStatus = 'unknown' | 'anonymous' | 'signed-in';

// * A property of the deployment, not the user: a deployment with no API behind it has nothing to sign in to.
export type SignInAvailability = 'available' | 'unavailable';

// * Deliberately not Firebase's `User`: the store holds only what the UI renders, so swapping the identity provider does not ripple into components.
export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};
