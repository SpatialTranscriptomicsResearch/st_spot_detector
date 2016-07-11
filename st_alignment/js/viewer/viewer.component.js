angular.module('viewer')
    .component('viewer', {
        templateUrl: 'templates/viewer.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.imageLoaded = false;
                $scope.cameraPosition = [0, 0];
                $scope.cameraScale = [1, 1];
                $scope.zoomOutLevel = 1;
                $scope.panFactor = 80;
            }]
    });
