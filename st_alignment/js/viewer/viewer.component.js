angular.module('viewer')
    .component('viewer', {
        templateUrl: 'templates/viewer.template.html',
        controller: [
            '$scope',
            '$rootScope',
            function($scope, $rootScope) {
                $scope.imageLoaded = false; 
                console.log("width " + window.innerWidth);
                console.log("height " + window.innerHeight);
                // this code is to size the canvas to roughly the size of the window.
                // it is a bit of a hack and there should be a better way to do it.
                document.getElementById('my-canvas').width  = window.innerWidth - 60;
                document.getElementById('my-canvas').height = window.innerHeight - 100;
                window.addEventListener('resize', function(event) 
                {
                    console.log("width " + window.innerWidth);
                    console.log("height " + window.innerHeight);
                    document.getElementById('my-canvas').width  = window.innerWidth - 60;
                    document.getElementById('my-canvas').height = window.innerHeight - 100;
                });
            }]
    });
