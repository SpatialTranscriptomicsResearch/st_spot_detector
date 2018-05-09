# pylint: disable=missing-docstring

from functools import wraps

import requests

from .bottle import HTTPError, request


ID = ''
SECRET = ''
TOKEN_URL = ''


def protect(f):
    # pylint: disable=invalid-name
    def check_auth(user, password):
        r = requests.post(
            url=TOKEN_URL,
            data={
                'grant_type': 'password',
                'username': user,
                'password': password,
                'client_id': ID,
                'client_secret': SECRET,
            },
        )
        return r.status_code == 200

    def unauthorized():
        res = HTTPError(401, 'Invalid credentials')
        res.add_header(
            'WWW-Authenticate',
            'Basic realm="Spot Detector"',
        )
        return res

    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.auth is not None and check_auth(*request.auth):
            return f(*args, **kwargs)
        return unauthorized()

    return wrapper
