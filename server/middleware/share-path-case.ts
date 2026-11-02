export default defineEventHandler((event) => {
  const target = canonicalSharePath(event.path);

  if (target) {
    return sendRedirect(event, target, 301);
  }
});
