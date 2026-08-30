// * Tween a fixed-length array of numbers toward a target, one requestAnimationFrame loop for the whole array. Written here rather than pulled from `@vueuse/core`'s `useTransition`, which this project declined (feature 006) — the loop below is what that composable does internally.
// * Values, never coordinates: a caller derives its geometry from what this returns, so everything drawn from those values (a polygon and its plot dots) moves as one object without being tweened separately.

// * Ease-out cubic. Fast at the start so a click is acknowledged immediately, settling rather than stopping.
function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function useTweenedValues(
  source: MaybeRefOrGetter<readonly number[]>,
  durationMs = 200
) {
  const displayed = ref<number[]>([...toValue(source)]);

  let frame = 0;

  // ! Honours the visitor's own operating-system setting, not a project preference: with `reduce` set, the value jumps and no frame loop starts.
  function prefersReducedMotion(): boolean {
    return (
      import.meta.client &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function stop() {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  watch(
    () => [...toValue(source)],
    (target) => {
      stop();

      // * A length change is a different hero, not a stat edit — there is nothing meaningful to travel between, so it lands directly.
      if (prefersReducedMotion() || target.length !== displayed.value.length) {
        displayed.value = [...target];

        return;
      }

      const from = [...displayed.value];
      const startedAt = performance.now();

      function step(now: number) {
        const progress = Math.min((now - startedAt) / durationMs, 1);
        const eased = easeOutCubic(progress);

        displayed.value = from.map(
          (value, index) => value + ((target[index] ?? 0) - value) * eased
        );

        if (progress < 1) {
          frame = requestAnimationFrame(step);

          return;
        }

        // * Land on the exact target: the easing never quite reaches 1 in floating point, and these feed a chart read against integer gridlines.
        displayed.value = [...target];
        frame = 0;
      }

      frame = requestAnimationFrame(step);
    },
    { flush: 'post' }
  );

  onScopeDispose(stop);

  return readonly(displayed);
}
