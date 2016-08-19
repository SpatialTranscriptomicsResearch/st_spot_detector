'use strict';

angular.module('spotManipulator')
    .component('spotManipulator', {
        templateUrl: 'templates/spot-manipulator.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.visible = false;
                $scope.spotOpacity = 0.5;
                $scope.spotColour = 0;
                $scope.previousOpacity = $scope.spotOpacity;
                $scope.previousColour = $scope.spotColour;
                $scope.style = {
                    'background-color': 'hsla(' + $scope.spotColour + ', 100%, 50%, ' + $scope.spotOpacity + ')'
                };

                $scope.updateElementStyle = function() {
                    if($scope.spotOpacity != $scope.previousOpacity ||
                       $scope.spotColour != $scope.previousColour) {
                        $scope.style = {
                            'background-color': 'hsla(' + $scope.spotColour + ', 100%, 50%, ' + $scope.spotOpacity + ')'
                        };
                        $rootScope.$broadcast('colourUpdate', $scope.style);
                    }
                    return $scope.style;
                };
                $scope.stateChange = function(state) {
                    $rootScope.$broadcast(state);
                };
                $rootScope.$on('imageLoading', function(event) {
                    $scope.visible = false;
                });
                $rootScope.$on('imageRendered', function(event) {
                    $scope.visible = true;
                });
            }
        ]
    })
    .directive('toggleButton', [
        '$rootScope',
        function($rootScope) {
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
        }
    ]);
