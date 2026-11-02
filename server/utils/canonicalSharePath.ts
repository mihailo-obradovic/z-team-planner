// * The page router matches `/B/<id>` too, but the robots module, the sitemap's exclude, `robots.txt` and the share-preview plugin all match `/b/` exactly. Sending the one capitalised variant to the lowercase address puts every rule back on it.
export function canonicalSharePath(path: string): string | undefined {
  if (!/^\/B(?=[/?#]|$)/.test(path)) {
    return undefined;
  }

  return `/b${path.slice('/B'.length)}`;
}
