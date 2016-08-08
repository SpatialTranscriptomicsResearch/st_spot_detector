'use strict';

angular.module('buttonBar')
    .component('buttonBar', {
        templateUrl: 'templates/button-bar.template.html',
        controller: [
            '$scope',
            function($scope) {
            }
        ]
    })
    /* Detects the selection of an image upon pressing the upload button
     * and using the FileReader, converts the image data into a data URL.
     * This data URL is sent to the Image service for storage */
    .directive('imageUpload', [
        '$rootScope',
        function($rootScope) {
            return {
                scope: true,
                link: function(scope, elem, attrs) {
                    elem.bind('change', function(event) {
                        var img = event.target.files[0];
                        var reader = new FileReader();
                        reader.addEventListener('load', function() {
                            $rootScope.$broadcast('imageLoaded', reader.result);
                        }, false);
                        if(img) {
                            //reader.readAsArrayBuffer(img);
                            reader.readAsDataURL(img);
                        }
                    });
                }
            };
        }
    ])
    .directive('alignButton', [
        '$rootScope',
        function($rootScope) { return {
            scope: true,
            link: function(scope, elem, attrs) {
                elem.bind('click', function(event) {
                    $rootScope.$broadcast('spotsCalculated');
                });
            }
        };}
    ])
    .directive('exportSpots', [
        '$rootScope',
        function($rootScope) { return {
            scope: true,
            link: function(scope, elem, attrs) {
                elem.bind('click', function(event) {
                    $rootScope.$broadcast('exportSpotData');
                });
            }
        };}
    ]);
