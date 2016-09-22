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
                $scope.addSpots = function() {
                    $rootScope.$broadcast('addSpots');
                };
                $scope.deleteSpots = function() {
                    $rootScope.$broadcast('deleteSpots');
                };
                $scope.editSpots = function() {
                    $rootScope.$broadcast('editSpots');
                };
                $rootScope.$on('imageLoading', function(event) {
                    $scope.visible = false;
                });
                $rootScope.$on('finishedDetecting', function(event, data) {
                    $scope.visible = true;
                });
            }
        ]
    });
