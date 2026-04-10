"""
Utility helpers for CodeSentinel.
"""

import time
import logging

logger = logging.getLogger(__name__)


def retry(func, retries=3, delay=1.0, exceptions=[Exception]):
    """
    Retry a callable up to `retries` times on specified exceptions.
    Waits `delay` seconds between attempts.
    """
    for attempt in range(retries):
        try:
            return func()
        except tuple(exceptions) as e:
            if attempt < retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise


class RateLimiter:
    """Token-bucket rate limiter."""

    def __init__(self, max_calls: int, period: float):
        self.max_calls = max_calls
        self.period = period
        self._calls = []

    def is_allowed(self) -> bool:
        now = time.time()
        self._calls = [t for t in self._calls if now - t < self.period]
        if len(self._calls) < self.max_calls:
            self._calls.append(now)
            return True
        return False

    def wait_and_call(self):
        while not self.is_allowed():
            time.sleep(0.05)
