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
                        img = {test: "testing"};
                        var config = {};
                        var postUrl = '../server.py';
                        var successCallback = function(response) {
                            console.log(response.data);
                        };
                        var errorCallback = function() {
                            console.log('error');
                        };
                        $http.post(postUrl, img, config)
                            .then(successCallback, errorCallback);

                    }, false);
                    if(img) {
                        //reader.readAsArrayBuffer(img);
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
