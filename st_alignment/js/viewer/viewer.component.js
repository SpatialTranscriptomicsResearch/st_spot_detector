angular.module('viewer')
    .component('viewer', {
        templateUrl: 'templates/viewer.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $rootScope.$on('imageUrlSet', function(event, data) {
                })
            }]
    });
