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
    })
    .directive('toggleButton', function() {
        /* directive to make sure that the bootstrap move and
           select buttons are toggled and kept active properly */
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.bind('click', function(e) {
                    element.parent().children().removeClass('active');
                    element.addClass('active');
                });
            }
        };
    });
