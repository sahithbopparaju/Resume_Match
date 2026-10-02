import time


def call_with_retry(fn, max_attempts=3, base_delay_seconds=2):
    """
    Call fn() with retries and exponential backoff.

    Third-party AI APIs (Gemini, Groq, OpenRouter, Tavily) occasionally
    return transient errors (e.g. "503 model overloaded", brief network
    blips) that usually succeed on a quick retry. Without this, a single
    transient failure crashes the whole request and forces the user to
    retry the entire analysis by hand.
    """
    last_error = None

    for attempt in range(1, max_attempts + 1):
        try:
            return fn()
        except Exception as error:
            last_error = error
            print(f"Attempt {attempt}/{max_attempts} failed: {error}")

            if attempt < max_attempts:
                time.sleep(base_delay_seconds * attempt)

    raise last_error
