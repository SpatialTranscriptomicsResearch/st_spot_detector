#!/usr/bin/env python3

from bottle import route, run, post, static_file, error

@route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='./st_alignment')

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
