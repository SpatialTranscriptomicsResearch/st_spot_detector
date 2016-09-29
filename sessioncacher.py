# -*- coding: utf-8 -*-

import time
import os

class SessionCache:
    def __init__(self, session_id, creation_time):
        self.session_id = session_id
        self.creation_time  = creation_time
        self.thumbnail = None
        self.image = None

class SessionCacher:
    def __init__(self):
        self.session_caches = []
        self.max_session_lifetime = 7200 # seconds (2 hours)

    def create_new_session_id(self):
        unique = False
        while(not unique):
            # from https://gist.github.com/geoffalday/2021517
            new_id = os.urandom(64).encode('hex')
            unique = True
            # check against currently existing IDs
            for session_cache in self.session_caches:
                if(session_cache.session_id == new_id):
                    unique = False
        return new_id

    def create_session_cache(self):
        new_session_id = self.create_new_session_id()
        new_session_cache = SessionCache(new_session_id, time.time())
        self.session_caches.append(new_session_cache)
        return new_session_id

    def set_image(self, session_id, image):
        for session_cache in self.session_caches:
            if(session_cache.session_id == session_id):
                session_cache.image = image
                break

    def set_thumbnail(self, session_id, thumbnail):
        for session_cache in self.session_caches:
            if(session_cache.session_id == session_id):
                session_cache.thumbnail = thumbnail
                break

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
                print(session_cache.session_id[:20] + ": Clearing session; too old.")
                self.session_caches.remove(session_cache)
                break
