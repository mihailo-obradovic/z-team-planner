// * The planner's tab wrapper content width in px, the box every `@container` query in a tab reads; 0 until the page has measured it. `pages/index.vue` is the only writer.
export function useTabWidth() {
  return useState<number>('tabWidth', () => 0);
}
