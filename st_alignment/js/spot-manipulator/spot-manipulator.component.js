'use strict';

angular.module('spotManipulator')
    .component('spotManipulator', {
        templateUrl: 'templates/spot-manipulator.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.visible = true;
                $scope.spotOpacity = 0.5;
                $scope.spotColour = 0.0;
                $scope.addSpotsVisible = true;
                $scope.finishAddSpotsVisible = false;
                $scope.deleteSpotsVisible = false;

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
                    $scope.addSpotsVisible = false;
                    $scope.finishAddSpotsVisible = true;
                    $scope.deleteSpotsVisible = false;
                    $rootScope.$broadcast('addSpots');
                };
                $scope.finishAddSpots = function() {
                    $scope.addSpotsVisible = true;
                    $scope.finishAddSpotsVisible = false;
                    $scope.deleteSpotsVisible = false;
                    $rootScope.$broadcast('finishAddSpots');
                };
                $scope.deleteSpots = function() {
                    $scope.addSpotsVisible = true;
                    $scope.finishAddSpotsVisible = false;
                    $scope.deleteSpotsVisible = false;
                    $rootScope.$broadcast('deleteSpots');
                };
                $rootScope.$on('imageLoading', function(event) {
                    $scope.visible = false;
                });
                $rootScope.$on('finishedDetecting', function(event, data) {
                    $scope.visible = true;
                });
                $rootScope.$on('finishAddSpots', function(event) {
                    $scope.finishAddSpots();
                });
            }
        ]
    });
