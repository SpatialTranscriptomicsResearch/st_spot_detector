'use strict';

angular.module('spotAdjuster')
    .component('spotAdjuster', {
        templateUrl: 'templates/spot-adjuster.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.visible = false;
                $scope.spotOpacity = 0.5;
                $scope.spotColour = 0.0;
                $scope.addSpotsVisible = true;
                $scope.finishAddSpotsVisible = false;
                $scope.deleteSpotsVisible = false;

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
                    $rootScope.$broadcast('finishedAddSpots');
                };
                $scope.deleteSpots = function() {
                    $rootScope.$broadcast('deleteSelectedSpots');
                };
                $scope.exportSpots = function(type) {
                    $rootScope.$broadcast('exportSpotData', type);
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
