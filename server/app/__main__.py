""" Runs the web server
"""

from os import sched_getaffinity

from . import application

application.run(host='0.0.0.0', port=8080, workers=len(sched_getaffinity(0)))
