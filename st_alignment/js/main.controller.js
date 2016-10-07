'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        function($scope) {
            $scope.state = "start";
            $scope.double = function(n) { return n * 2 };
        }
    ]);
