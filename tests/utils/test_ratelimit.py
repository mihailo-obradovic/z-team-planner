"""The stopgap token bucket. No Docker and no sleeping — the clock is injected."""

import threading

from app.utils.ratelimit import TokenBucketLimiter


class FakeClock:
    """A clock a test moves by hand."""

    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


def _limiter(
    clock: FakeClock, capacity: int = 60, **kwargs: object
) -> TokenBucketLimiter:
    return TokenBucketLimiter(
        capacity=capacity,
        refill_per_second=1.0,
        clock=clock,
        **kwargs,  # pyright: ignore[reportArgumentType]
    )


def test_the_capacity_is_spent_then_refused() -> None:
    clock = FakeClock()
    limiter = _limiter(clock)

    assert all(limiter.allow("1.2.3.4") for _ in range(60))
    # * Feature 005's figure: 60 a minute, so the 61st in the same instant is refused.
    assert limiter.allow("1.2.3.4") is False


def test_a_token_comes_back_with_time() -> None:
    clock = FakeClock()
    limiter = _limiter(clock)
    for _ in range(60):
        limiter.allow("1.2.3.4")

    clock.advance(1)

    assert limiter.allow("1.2.3.4") is True
    assert limiter.allow("1.2.3.4") is False


def test_refill_stops_at_the_capacity() -> None:
    clock = FakeClock()
    limiter = _limiter(clock)
    limiter.allow("1.2.3.4")

    # ! An hour idle must not bank an hour of requests, or the limit means nothing after a quiet spell.
    clock.advance(3600)

    assert sum(limiter.allow("1.2.3.4") for _ in range(100)) == 60


def test_retrying_while_refused_earns_nothing() -> None:
    clock = FakeClock()
    limiter = _limiter(clock)
    for _ in range(60):
        limiter.allow("1.2.3.4")

    # * Refills are measured from the last grant, not from the last attempt, so hammering neither skips the wait nor extends it.
    for _ in range(50):
        assert limiter.allow("1.2.3.4") is False
    clock.advance(1)

    assert limiter.allow("1.2.3.4") is True


def test_callers_are_counted_separately() -> None:
    clock = FakeClock()
    limiter = _limiter(clock)

    for _ in range(60):
        limiter.allow("1.2.3.4")

    # ! One noisy caller must not lock everyone else out.
    assert limiter.allow("5.6.7.8") is True
    assert limiter.allow("1.2.3.4") is False


def test_a_bucket_that_has_fully_refilled_is_forgotten() -> None:
    clock = FakeClock()
    limiter = _limiter(clock, capacity=2, max_keys=3)

    for index in range(10):
        limiter.allow(f"caller-{index}")
        # * Two seconds is a full refill at capacity 2, so each key is stale by the next.
        clock.advance(2)

    assert len(limiter._buckets) <= 3  # noqa: SLF001


def test_a_flood_of_active_callers_stays_bounded() -> None:
    clock = FakeClock()
    limiter = _limiter(clock, capacity=60, max_keys=100)

    # * All at one instant, so none can be dropped for being stale — the hard bound is what has to hold.
    for index in range(1000):
        limiter.allow(f"caller-{index}")

    assert len(limiter._buckets) <= 100  # noqa: SLF001


def test_the_oldest_caller_is_the_one_dropped() -> None:
    clock = FakeClock()
    limiter = _limiter(clock, capacity=60, max_keys=2)

    limiter.allow("first")
    clock.advance(0.1)
    limiter.allow("second")
    clock.advance(0.1)
    limiter.allow("third")

    # * Fairness is second to a bounded table, but what goes is the least recently seen.
    assert "first" not in limiter._buckets  # noqa: SLF001
    assert "third" in limiter._buckets  # noqa: SLF001


def test_one_caller_at_a_time_is_inside_the_bucket() -> None:
    """Mutual exclusion, proven rather than sampled.

    Reading a bucket and writing it back is not atomic, so two threads inside `allow` can
    both see the same count and both spend it. A stress test only catches that when the
    interpreter happens to switch in the window between the two steps; this holds one thread
    open inside the critical section and checks the other cannot get in.
    """
    inside = threading.Event()
    finish = threading.Event()
    first_call = threading.Event()

    def blocking_clock() -> float:
        if not first_call.is_set():
            first_call.set()
            inside.set()
            finish.wait(timeout=5)

        return 1000.0

    limiter = TokenBucketLimiter(
        capacity=10, refill_per_second=1.0, clock=blocking_clock
    )
    second_returned = threading.Event()

    holder = threading.Thread(target=lambda: limiter.allow("1.2.3.4"))
    holder.start()
    assert inside.wait(timeout=5), "the first caller never reached the critical section"

    def second() -> None:
        limiter.allow("1.2.3.4")
        second_returned.set()

    waiter = threading.Thread(target=second)
    waiter.start()

    # ! The load-bearing assertion: while one caller holds the bucket the other must wait.
    assert not second_returned.wait(timeout=0.3)

    finish.set()
    holder.join(timeout=5)
    waiter.join(timeout=5)

    assert second_returned.is_set()
