"""An in-process token bucket.

A **stopgap** (feature 005, Business Rules): the public read is the one route an outsider can
reach without an account, and it needs some ceiling until the hosting effort names a real
edge. Stdlib only, and it goes away when that edge exists.

What it cannot do, and what the edge will: it counts per process, so N workers allow N times
the limit, and it trusts the socket peer, which behind a proxy is the proxy.
"""

import threading
import time
from collections.abc import Callable


class TokenBucketLimiter:
    """`capacity` requests, refilling at `refill_per_second`, per key."""

    def __init__(
        self,
        *,
        capacity: int,
        refill_per_second: float,
        clock: Callable[[], float] = time.monotonic,
        max_keys: int = 10_000,
    ) -> None:
        self._capacity = float(capacity)
        self._refill = refill_per_second
        # * Injected so a test can move time without sleeping, and monotonic so a clock change cannot hand out free requests.
        self._clock = clock
        self._max_keys = max_keys
        # * key -> (tokens, last seen)
        self._buckets: dict[str, tuple[float, float]] = {}
        # ! Sync handlers run in a threadpool, so two requests really can be in here at once.
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        """Spend one token for `key`, or refuse."""
        # ! Read under the lock, not before it: a thread that computed `now` and was then descheduled would apply a stale instant to a bucket someone else had already moved on.
        with self._lock:
            now = self._clock()
            tokens, seen = self._buckets.get(key, (self._capacity, now))
            tokens = min(self._capacity, tokens + (now - seen) * self._refill)

            if tokens < 1:
                # * Nothing to write: what a caller is owed is computed from the last grant, so retrying in a tight loop neither costs nor earns anything.
                return False

            self._buckets[key] = (tokens - 1, now)

            if len(self._buckets) > self._max_keys:
                self._evict(now)

            return True

    def _evict(self, now: float) -> None:
        """Keep the table bounded. Callers hold the lock."""
        # * A bucket left alone long enough to refill completely says nothing a fresh one would not, so dropping it changes no answer.
        full_after = self._capacity / self._refill
        self._buckets = {
            key: bucket
            for key, bucket in self._buckets.items()
            if now - bucket[1] < full_after
        }

        if len(self._buckets) <= self._max_keys:
            return

        # ! Every key is still active, which means this is a flood. Memory is bounded first and fairness second: the least recently seen lose their history and start fresh.
        oldest = sorted(self._buckets.items(), key=lambda item: item[1][1])
        for key, _ in oldest[: len(self._buckets) - self._max_keys]:
            del self._buckets[key]
