'use strict';

angular.module('core.image')
    .service('Image', function() {
        var self = this;
        self.setImageURL = function(URL) {
            self.imageURL = URL;
        };
        self.getImageURL = function() {
            return self.imageURL;
        }
    });
