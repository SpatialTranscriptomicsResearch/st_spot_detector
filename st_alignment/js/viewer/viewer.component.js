angular.module('viewer')
    .component('viewer', {
        templateUrl: 'templates/viewer.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.imageLoaded = true; // should only be 'true' for debugging purposes
            }]
    });
