'use strict';

angular.module('buttonBar')
    .component('buttonBar', {
        templateUrl: 'templates/button-bar.template.html',
        controller: [
            '$scope',
            function($scope) {
                $scope.poop = 123;
                $scope.$on('imageSelected', function(event, args) {
                    /* run on the selection of a new image */
                    $scope.$apply(function() {
                        $scope.imageURL = args.imageURL;
                    });
                });
            }
        ]
    })
    .directive('imageUpload', function() {
    /* detects the selection of an image upon pressing the upload button
     * and using the FileReader, converts the image data into a data URL,
     * which $emits a message upon loading and reading the result */
        return {
            scope: true,
            link: function(scope, elem, attrs) {
                elem.bind('change', function(event) {
                    var img = event.target.files[0];
                    var reader = new FileReader();
                    reader.addEventListener('load', function() {
                        scope.$emit('imageSelected', {
                            imageURL: reader.result
                        });
                    }, false);
                    if(img) {
                        reader.readAsDataURL(img);
                    }
                });
            }
        };
    });
