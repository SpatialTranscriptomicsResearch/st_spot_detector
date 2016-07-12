angular.module('viewer')
    .component('viewer', {
        templateUrl: 'templates/viewer.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.imageLoaded = true; // should only be 'true' for debugging purposes
                $scope.cameraPosition = [2500, 2500];
                $scope.cameraScale = 1;
                $scope.tilePosition = [0, 0];
                $scope.imagePosition = [0, 0];
                $scope.zoomOutLevel = 3;
                $scope.panFactor = 100;
                $scope.scaleFactor = 0.99;
            }]
    });
