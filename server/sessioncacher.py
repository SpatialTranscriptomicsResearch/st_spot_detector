# -*- coding: utf-8 -*-

import time
import os

from logger import log, INFO

class SessionCache:
    def __init__(self, session_id):
        self.session_id = session_id
        self.creation_time  = time.time()
        # cy3 image saved for spot detection
        self.spot_image = None
        self.tissue_image = None
        # how much the spot_image is scaled down, to calculate the spot
        # coordinates properly
        self.spot_scaling_factor = None
        self.tiles = {'cy3': None, 'he': None}

class SessionCacher:
    """A class for maintaining and caching the sessions on the server.
    A session cache is created every time a client uploads an image.
    Various data associated with the image are cached in the session_caches
    list. A session ID is given to the client, which is used for identifying
    the correct data for use in further image processing requests.
    """
    session_caches = []

    def __init__(self):
        self.max_session_lifetime = 7200 # seconds (2 hours)

    def create_new_session_id(self):
        unique = False
        while(not unique):
            # from https://gist.github.com/geoffalday/2021517
            new_id = os.urandom(64).hex()
            unique = True
            # Check against currently existing IDs
            # The likelihood for collision is extremely extremely low,
            # but it is good practice to check anyway.
            for session_cache in SessionCacher.session_caches:
                if(session_cache.session_id == new_id):
                    unique = False
        return new_id

    def create_session_cache(self):
        new_session_id = self.create_new_session_id()
        new_session_cache = SessionCache(new_session_id)
        SessionCacher.session_caches.append(new_session_cache)
        return new_session_cache

    def get_session_cache(self, session_id):
        my_session_cache = None
        for session_cache in SessionCacher.session_caches:
            if(session_cache.session_id == session_id):
                my_session_cache = session_cache
                break
        return my_session_cache

    def remove_session_cache(self, session_id):
        for session_cache in SessionCacher.session_caches:
            if(session_cache.session_id == session_id):
                SessionCacher.session_caches.remove(session_cache)
                log(INFO, f'Removing session {session_id}')
                break
    
    def clear_old_sessions(self):
        log(INFO, 'Pruning session caches')
        for session_cache in SessionCacher.session_caches:
            lifetime = time.time() - session_cache.creation_time
            if(lifetime > self.max_session_lifetime):
                SessionCacher.session_caches.remove(session_cache)
                break
        log(INFO, 'Active sessions: '
            f'{", ".join([x.session_id[:7] for x in self.session_caches])}')
