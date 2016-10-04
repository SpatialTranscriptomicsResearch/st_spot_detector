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
                $scope.visibools = {
                };
                $scope.visibools.addSpotsVisible = true;
                $scope.visibools.finishAddSpotsVisible = false;
                $scope.visibools.deleteSpotsVisible = false;

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
                    $scope.visibools.addSpotsVisible = false;
                    $scope.visibools.finishAddSpotsVisible = true;
                    $scope.visibools.deleteSpotsVisible = false;
                    $rootScope.$broadcast('addSpots');
                };
                $scope.finishAddSpots = function() {
                    $scope.visibools.addSpotsVisible = true;
                    $scope.visibools.finishAddSpotsVisible = false;
                    $scope.visibools.deleteSpotsVisible = false;
                    $rootScope.$broadcast('finishedAddSpots');
                };
                $scope.deleteSpots = function() {
                    $scope.visibools.addSpotsVisible = true;
                    $scope.visibools.finishAddSpotsVisible = false;
                    $scope.visibools.deleteSpotsVisible = false;
                    $rootScope.$broadcast('deleteSelectedSpots');
                };
                $rootScope.$on('imageLoading', function(event) {
                    $scope.visible = false;
                });
                $rootScope.$on('finishedDetecting', function(event, data) {
                    $scope.visible = true;
                });
                $rootScope.$on('selectedSpots', function(event, data) {
                    console.log('selected');
                    $scope.visibools.addSpotsVisible = false;
                    $scope.visibools.finishAddSpotsVisible = false;
                    $scope.visibools.deleteSpotsVisible = true;
                    console.log($scope.visibools);
                });
                $rootScope.$on('unSelectedSpots', function(event, data) {
                    console.log('unselected');
                    $scope.visibools.addSpotsVisible = true;
                    $scope.visibools.finishAddSpotsVisible = false;
                    $scope.visibools.deleteSpotsVisible = false;
                    console.log($scope.visibools);
                });
            }
        ]
    });
