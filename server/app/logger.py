""" Provides utility functions for logging
"""

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
            'format': '%(asctime)s %(levelname)s %(message)s',
            'datefmt': '[%Y-%m-%d %H:%M:%S %z]',
            'class': 'logging.Formatter'
        },
    },
))

LOGGER = L.getLogger('server')

log = LOGGER.log  # pylint: disable=invalid-name
