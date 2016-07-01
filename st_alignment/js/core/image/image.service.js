'use strict';

angular.module('core.image')
    .factory('Image', [
        '$rootScope',
        function($rootScope) {
            var self = this;
            self.imageUrl = '';
            self.setImageUrl = function(Url) {
                self.imageUrl = Url;
                $rootScope.$broadcast('imageUrlSet', Url);
            };
            return self;
        }
    ]);
