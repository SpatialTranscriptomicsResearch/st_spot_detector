'use strict';

angular.module('spotDetector')
    .component('spotDetector', {
        templateUrl: 'templates/spot-detector.template.html',
        controller: [
            '$scope',
            '$rootScope',
            '$http',
            function($scope, $rootScope, $http) {
                $scope.visible = true;
                $scope.formData = {
                    TL: { x: 1251, y: 676 },
                    BR: { x: 11780, y: 11982 },
                    arraySize: { x: 33, y: 35 }
                };
                $scope.detectSpots = function() {
                    console.log('Detecting spots...');
                    var getUrl = '../detect_spots';
                    var successCallback = function(response) {
                        console.log('Success!');
                    };
                    var errorCallback = function(response) {
                        console.error(response.data);
                    };
                    var config = {
                        params: $scope.formData
                    };
                    $http.get(getUrl, config)
                        .then(successCallback, errorCallback);
                };
                $rootScope.$on('imageLoading', function(event) {
                    $scope.visible = false;
                });
                $rootScope.$on('imageRendered', function(event) {
                    $scope.visible = true;
                });
            }
        ]
    });
