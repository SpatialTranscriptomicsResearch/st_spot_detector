'use strict';

angular.module('core.image')
    .factory('Image', function() {
        var self = this;
        self.imageURL = '';
        self.setImageURL = function(URL) {
            self.imageURL = URL;
        };
        self.getImageURL = function() {
            return self.imageURL;
        }
        return self;
    });
