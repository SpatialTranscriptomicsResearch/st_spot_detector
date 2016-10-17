'use strict';

// this directive is bound to the input button on the menu bar and is used
// to detect an image file being selected and converts the image to a string

angular.module('stSpots')
    .directive('imageUpload', [
        function() {
            var link = function(scope, elem, attrs) {
                // this is triggered when the state of the input button is changed;
                // e.g. it was empty but then a file has been selected
                elem.bind('change', function(event) {
                    // checks that it hasn't gone from file to empty
                    if(event.target.files.length != 0) {
                        scope.$apply(
                            // $apply is required here because this function is executed
                            // outside of the normal AngularJS context, i.e. elem.bind()
                            scope.updateState('state_upload')
                        );
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        // function which runs after loading
                        reader.addEventListener('load', function() {
                            scope.$apply(function() {
                                scope.data.image = reader.result;
                                scope.uploadImage();
                            });
                        }, false);
                        if(img) {
                            reader.readAsDataURL(img);
                        }
                    }
                });
            };
            return {
                restrict: 'A',
                scope: false,
                link: link
            };
        }
    ]);
