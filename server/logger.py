import logging as L
from logging.config import dictConfig

import sys

WARNING = L.WARNING
INFO = L.INFO

dictConfig(dict(
    version=1,
    disable_existing_loggers=False,
    loggers={
        'server': {
            'level': 'INFO',
            'handlers': ['console']
        },
    },
    handlers={
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'default',
            'stream': sys.stderr
        },
    },
    formatters={
        'default': {
            'format': '%(asctime)s %(levelname)s (%(session)s) %(message)s',
            'datefmt': '[%Y-%m-%d %H:%M:%S %z]',
            'class': 'logging.Formatter'
        },
    },
))

LOGGER = L.getLogger('server')


def log(*args, session=None, **kwargs):
    session_str = 'global' if session is None \
        else session.session_id[:7]
    if isinstance(kwargs.get('extra'), dict):
        kwargs.get('extra').update(dict(session=session_str))
    else:
        kwargs['extra'] = dict(session=session_str)
    LOGGER.log(*args, **kwargs)
