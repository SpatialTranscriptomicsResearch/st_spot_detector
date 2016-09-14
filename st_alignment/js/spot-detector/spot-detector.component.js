'use strict';

angular.module('spotDetector')
    .component('spotDetector', {
        templateUrl: 'templates/spot-detector.template.html',
        controller: [
            '$scope',
            '$rootScope',
            '$http',
            function($scope, $rootScope, $http) {
                $scope.visible = false;
                $scope.formData = {
                    // these values may be unnecessary; may change it so that the
                    // values are only manipulable by dragging around the spots
                    TL: { x: 0, y: 0 },
                    BR: { x: 0, y: 0 },
                    arraySize: { x: 33, y: 35 },
                    brightness: 0,
                    contrast: 0,
                    threshold: 50,
                };
                $scope.detectSpots = function() {
                    $rootScope.$broadcast('spotDetecting');
                };
                $scope.formChange = function(bctChanged) {
                    var data = {
                        data: $scope.formData,
                        bctChanged: bctChanged
                    }
                    $rootScope.$broadcast('spotDetectorAdjusted', data);
                };
                $rootScope.$on('imageLoading', function(event) {
                    $scope.visible = false;
                });
                $rootScope.$on('imageRendered', function(event) {
                    $scope.visible = true;
                });
                $rootScope.$on('calibratorAdjusted', function(event, data) {
                    $scope.formData = data;
                });
                $rootScope.$on('finishedDetecting', function(event, data) {
                    $scope.visible = false;
                });
            }
        ]
    });
