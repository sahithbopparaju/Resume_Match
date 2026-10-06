import os

import jwt
from fastapi import HTTPException, Request
from jwt import PyJWKClient


class SupabaseConfigError(RuntimeError):
    pass


_jwks_client = None


def _supabase_url():
    url = os.getenv("SUPABASE_URL")

    if not url:
        raise SupabaseConfigError(
            "SUPABASE_URL is not configured in backend/.env."
        )

    return url.rstrip("/")


def _get_jwks_client():
    """
    Lazily built and cached for the life of the process — PyJWKClient
    itself caches fetched keys by `kid`, so this avoids both a repeated
    client construction and a repeated JWKS network fetch on every
    single request.
    """
    global _jwks_client

    if _jwks_client is None:
        jwks_url = f"{_supabase_url()}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)

    return _jwks_client


def get_user_from_token(access_token):
    """
    Verifies a Supabase access token's signature locally against the
    project's JWKS endpoint — no network round-trip to Supabase's Auth
    API per request, and no service-role/secret key used anywhere here.
    """
    if not access_token:
        print("require_current_user: no Authorization bearer token on the request.")
        return None

    issuer = f"{_supabase_url()}/auth/v1"

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(access_token)

        claims = jwt.decode(
            access_token,
            signing_key.key,
            # Only asymmetric algorithms — never accept "none" or a
            # symmetric alg here, which would let a token be forged
            # using the (public) verification key as an HMAC secret.
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            issuer=issuer,
        )
    except Exception as error:
        print(f"require_current_user: Supabase token rejected: {error}")
        return None

    user_id = claims.get("sub")
    email = claims.get("email")

    if not user_id or not email:
        print("require_current_user: token verified but missing sub/email claims.")
        return None

    return {"id": user_id, "email": email}


def require_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = (
        auth_header[len("Bearer "):]
        if auth_header.lower().startswith("bearer ")
        else None
    )

    try:
        user = get_user_from_token(token)
    except SupabaseConfigError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    return user
