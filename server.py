#!/usr/bin/env python3

from bottle import error, post, request, route, run, static_file

@route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='./st_alignment')

@post('/<filepath:path>')
def receiveImage(filepath):
    print(request.body.read())
    return ''

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
