angular.module('viewer')
    .component('viewer', {
        templateUrl: 'templates/viewer.template.html',
        controller: [
            '$scope',
            'Image',
            function($scope, Image) {
                $scope.service = Image;
                $scope.viewerClicked = function() {
                    $scope.service.setImageURL('a new imageURL');
                };
                $scope.$watch('service.imageURL', function() {
                    console.log('service imageURL changed');
                })
            }]
    });
