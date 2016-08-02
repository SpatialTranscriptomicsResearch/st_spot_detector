'use strict';

angular.module('spotManipulator')
    .component('spotManipulator', {
        templateUrl: 'templates/spot-manipulator.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.spotOpacity = 0.5;
                $scope.spotColour = 0;
                $scope.updateElementStyle = function(colour, opacity) {
                    var style = {
                        'background-color': 'hsla(' + colour + ', 100%, 50%, ' + opacity + ')'
                    }
                    $rootScope.$broadcast('colourUpdate', style);
                    return style;
                }
            }
        ]
    });
