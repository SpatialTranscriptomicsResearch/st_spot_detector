# pylint: disable=missing-docstring

from base64 import b64decode
from functools import wraps

import requests
from sanic.exceptions import Unauthorized


ID = ''
SECRET = ''
TOKEN_URL = ''


def protect(f):
    def _check_auth(auth):
        user, pw = b64decode(auth.split(' ')[1]).decode().split(':')
        r = requests.post(
            url=TOKEN_URL,
            data={
                'grant_type': 'password',
                'username': user,
                'password': pw,
                'client_id': ID,
                'client_secret': SECRET,
            },
        )
        return r.status_code == 200

    @wraps(f)
    def wrapper(req, *args, **kwargs):
        auth = req.headers.get('authorization')
        if auth is not None and _check_auth(auth):
            return f(req, *args, **kwargs)
        raise Unauthorized(
            'Invalid credentials',
            scheme='Basic',
            realm='Spot Detector',
        )

    return wrapper
