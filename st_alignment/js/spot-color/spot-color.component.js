'use strict';

angular.module('spotColor')
    .component('spotColor', {
        templateUrl: 'templates/spot-color.template.html',
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

                $scope.updateElementStyle = function() {
                    var data = {
                        'spotColour': $scope.spotColour,
                        'spotOpacity': $scope.spotOpacity
                    }
                    var style = {
                        'background-color': 'hsla(' + $scope.spotColour + ', 100%, 50%, ' + $scope.spotOpacity + ')'
                    };
                    $rootScope.$broadcast('colorUpdate', data);
                    return style;
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
