from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer
from database import supabase

security = HTTPBearer()

def get_current_user(token = Security(security)):
    """
    Validates the Supabase JWT. Returns the user object on success.
    Throws a 401 HTTP exception if the token is missing, expired, or invalid.
    """
    try:
        auth_response = supabase.auth.get_user(token.credentials)
        if not auth_response.user:
            raise Exception("No user found spanning token.")
        return auth_response.user
    except Exception as e:
        raise HTTPException(
            status_code=401, 
            detail="Invalid authentication credentials or token expired."
        )
