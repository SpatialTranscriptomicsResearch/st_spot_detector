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
                    var img = event.target.files[0];
                    var reader = new FileReader();
                    reader.addEventListener('load', function() {
                        var postUrl = '../server.py';
                        var imageData = reader.result;
                        var successCallback = function(response) {
                            $rootScope.$broadcast('imageLoaded', response.data);
                            console.log('success!');
                            $http.get('../tiles/')
                            //$http.get('../spots')
                                .then(function(response) {
                                    console.log(response.data);
                                }, function() {
                                    console.log('error');
                                });
                        };
                        var errorCallback = function() {
                            console.log('error');
                        };
                        $http.post(postUrl, imageData)
                            .then(successCallback, errorCallback);

                    }, false);
                    if(img) {
                        reader.readAsDataURL(img);
                    }
                });
            };
            return {
                scope: true,
                link: link
            };
        }
    ]);
