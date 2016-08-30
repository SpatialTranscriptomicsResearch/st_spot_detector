'use strict';

angular.module('spotManipulator')
    .directive('toggleButton', [
        '$rootScope',
        function($rootScope) {
            /* directive to make sure that the bootstrap move and
               select buttons are toggled and kept active properly */
            return {
                restrict: 'A',
                link: function(scope, element) {
                    element.bind('click', function(e) {
                        element.parent().children().removeClass('active');
                        element.addClass('active');
                    });
                }
            };
        }
    ]);
