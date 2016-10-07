'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        function($scope) {
            const states = {
                'state_start':        "state_start",
                'state_upload':       "state_upload",
                'state_predetection': "state_predetection",
                'state_detection':    "state_detection",
                'state_adjustment':   "state_adjustment"
            };
            const helpTexts = {
                'state_start':        "Click on the picture icon to select and upload a Cy3 fluorescence image.",
                'state_upload':       "",
                'state_predetection': "Position the frame to align with the outermost spots. Adjust brightness and contrast for optimal spot detection."
                                      + "Click on detect to begin spot detection.",
                'state_detection':    "",
                'state_adjustment':   "Right click to select spots. Hold in shift to add to a selection."
            };

            $scope.state = states.state_start;
            $scope.button = "button_help";
            $scope.menuBarPanelVisibility = true;

            $scope.helpButton = function() {
                $scope.button = "button_help";
            };

            $scope.getPanelText = function(state, button) {
                var text = "";
                if(button == "button_help") {
                    text = helpTexts[state];
                }
                return text;
            };
        }
    ]);
