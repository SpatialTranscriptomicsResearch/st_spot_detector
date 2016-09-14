'use strict';

angular.module('buttonBar')
    /* Detects the selection of an image upon pressing the upload button
     * and using the FileReader, converts the image data into a data URL.
     * This data URL is sent to an AJAX request for server-side processing */
    .directive('imageUpload', [
        '$rootScope',
        '$http',
        function($rootScope, $http) {
            var link = function(scope, elem, attrs) {
                elem.bind('change', function(event) {
                    if(event.target.files.length != 0) {
                        $rootScope.$broadcast('imageLoading');
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        reader.addEventListener('load', function() {
                            var postUrl = '../server.py';
                            //var postUrl = '../dummy_image';
                            var imageData = reader.result;
                            var successCallback = function(response) {
                                $rootScope.$broadcast('imageLoaded', response.data);
                            };
                            var errorCallback = function(response) {
                                console.error(response.data);
                                $rootScope.$broadcast('imageLoadingError', response.data);
                            };
                            $http.post(postUrl, imageData)
                                .then(successCallback, errorCallback);
                        }, false);
                        if(img) {
                            reader.readAsDataURL(img);
                        }
                    }
                });
            };
            return {
                scope: true,
                link: link
            };
        }
    ]);
