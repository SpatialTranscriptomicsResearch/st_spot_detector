# -*- coding: utf-8 -*-

import time
import os

class SessionCache:
    def __init__(self, session_id):
        self.session_id = session_id
        self.creation_time  = time.time()
        self.thumbnail = None
        self.image = None

class SessionCacher:
    """A class for maintaining and caching the sessions on the server.
    A session cache is created every time a client uploads an image and
    the image and thumbnail are cached in the session_caches list. A session
    ID is given to the client, which is used for identifying the correct
    image and thumbnail for use in further image processing requests.
    """
    def __init__(self):
        self.session_caches = []
        self.max_session_lifetime = 7200 # seconds (2 hours)

    def create_new_session_id(self):
        unique = False
        while(not unique):
            # from https://gist.github.com/geoffalday/2021517
            new_id = os.urandom(64).encode('hex')
            unique = True
            # Check against currently existing IDs
            # The likelihood for collision is extremely extremely low,
            # but it is good practice to check anyway.
            for session_cache in self.session_caches:
                if(session_cache.session_id == new_id):
                    unique = False
        return new_id

    def create_session_cache(self):
        new_session_id = self.create_new_session_id()
        new_session_cache = SessionCache(new_session_id)
        self.session_caches.append(new_session_cache)
        return new_session_id

    def get_session_cache(self, session_id):
        my_session_cache = None
        for session_cache in self.session_caches:
            if(session_cache.session_id == session_id):
                my_session_cache = session_cache
                break
        return my_session_cache

    def remove_session_cache(self, session_id):
        for session_cache in self.session_caches:
            if(session_cache.session_id == session_id):
                self.session_caches.remove(session_cache)
                break
    
    def clear_old_sessions(self):
        for session_cache in self.session_caches:
            lifetime = time.time() - session_cache.creation_time
            if(lifetime > self.max_session_lifetime):
                print((session_cache.session_id[:20] + ": Session timed out ("
                       + lifetime + " seconds)."))
                self.session_caches.remove(session_cache)
                break
