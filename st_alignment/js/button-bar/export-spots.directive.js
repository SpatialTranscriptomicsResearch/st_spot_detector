'use strict';

angular.module('buttonBar')
    .directive('exportSpots', [
        '$rootScope',
        function($rootScope) { return {
            scope: true,
            link: function(scope, elem, attrs) {
                elem.bind('click', function(event) {
                    $rootScope.$broadcast('exportSpotData');
                });
            }
        };}
    ]);
