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
                $scope.spotColour = 0.0;

                $scope.updateElementStyle = function() {
                    var data = {
                        'spotColour': $scope.spotColour,
                        'spotOpacity': $scope.spotOpacity
                    }
                    $rootScope.$broadcast('colourUpdate', data);
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
