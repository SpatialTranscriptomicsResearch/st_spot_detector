'use strict';

// this directive is bound to the input button on the menu bar and is used
// to detect an image file being selected and converts the image to a string

angular.module('stSpots')
    .directive('imageUpload', [
        function() {
            var link = function(scope, elem, attrs) {
                var cy3File = angular.element(elem[0].querySelector('#cy3-upload-filename'));
                var cy3Input = angular.element(elem[0].querySelector('#cy3-upload'));

                var heFile = angular.element(elem[0].querySelector('#he-upload-filename'));
                var heInput = angular.element(elem[0].querySelector('#he-upload'));

                // this is triggered when the state of the input button is changed;
                // e.g. it was empty but then a file has been selected
                cy3Input.bind('change', function(event) {
                    // checks that it hasn't gone from file to empty
                    if(event.target.files.length != 0) {
                        var filename = event.target.files[0].name;
                        scope.data.cy3Filename = filename;
                        filename = shortenFilename(filename, 20);
                        cy3File.text(filename);
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

                heInput.bind('change', function(event) {
                    if(event.target.files.length != 0) {
                        var filename = event.target.files[0].name;
                        filename = shortenFilename(filename, 15);
                        heFile.text(filename);
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        reader.addEventListener('load', function() {
                            scope.$apply(function() {
                                scope.data.heImage = reader.result;
                            });
                        }, false);
                        if(img) {
                            reader.readAsDataURL(img);
                        }
                    }
                });

				/* from https://gist.github.com/solotimes/2537334 */
				function shortenFilename(n, len) {
					if(len == undefined) len = 20;
					var ext = n.substring(n.lastIndexOf(".") + 1, n.length).toLowerCase();
					var filename = n.replace('.' + ext,'');
					if(filename.length <= len) {
						return n;
					}
					filename = filename.substr(0, len) + (n.length > len ? '[...]' : '');
					return filename + '.' + ext;
				};
            };
            return {
                restrict: 'A',
                scope: false,
                link: link
            };
        }
    ]);
