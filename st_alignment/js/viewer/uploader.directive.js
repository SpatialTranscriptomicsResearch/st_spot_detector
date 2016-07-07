'use strict';

angular.module('viewer')
    .directive('stUploader', [
        '$rootScope',
        function($rootScope){
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = "green";
                ctx.fillRect(10, 10, 100, 100);

                $rootScope.$on('imageUrlSet', function(event, data) {
                    ctx.fillStyle = "pink";
                    ctx.fillRect(500, 500, 100, 100);
                });
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
