export type FirebaseSdk = {
  app: typeof import('firebase/app');
  auth: typeof import('firebase/auth');
};

// * Decision 017: the one dynamic import of the Firebase SDK, so the plugin, the sign-in composable and the idle preload all name the same chunk, and an anonymous visit never downloads it.
export async function loadFirebaseSdk(): Promise<FirebaseSdk> {
  const [app, auth] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth')
  ]);

  return { app, auth };
}
