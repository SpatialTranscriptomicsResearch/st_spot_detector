'use strict';

// this directive is bound to the input button on the menu bar and is used
// to detect an image file being selected and converts the image to a string

angular.module('stSpots')
    .directive('imageUpload', [
        function() {
            var link = function(scope, elem, attrs) {
                var cy3File = angular.element(elem[0].querySelector('#cy3-upload-filename'));
                var cy3Input = angular.element(elem[0].querySelector('#cy3-upload'));

                var bfFile = angular.element(elem[0].querySelector('#bf-upload-filename'));
                var bfInput = angular.element(elem[0].querySelector('#bf-upload'));

                // this is triggered when the state of the input button is changed;
                // e.g. it was empty but then a file has been selected
                cy3Input.bind('change', function(event) {
                    // checks that it hasn't gone from file to empty
                    if(event.target.files.length != 0) {
                        cy3File.text(event.target.files[0].name);
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        // function which runs after loading
                        reader.addEventListener('load', function() {
                            scope.$apply(function() {
                                scope.data.cy3Image = reader.result;
                            });
                        }, false);
                        if(img) {
                            reader.readAsDataURL(img);
                        }
                    }
                });

                bfInput.bind('change', function(event) {
                    // checks that it hasn't gone from file to empty
                    if(event.target.files.length != 0) {
                        bfFile.text(event.target.files[0].name);
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        reader.addEventListener('load', function() {
                            scope.$apply(function() {
                                scope.data.bfImage = reader.result;
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
