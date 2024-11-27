from functools import wraps
import time


def measure_time(func_name: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            res = func(*args, **kwargs)
            end = time.time()

            return res, end - start

        return wrapper

    return decorator
