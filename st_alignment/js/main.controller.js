'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        function($scope) {
            const helpTexts = {
                'state_start':        "Click on the picture icon to select and upload a Cy3 fluorescence image.",
                'state_upload':       "",
                'state_predetection': "Position the frame to align with the outermost spots. Adjust brightness and contrast for optimal spot detection."
                                      + "Click on detect to begin spot detection.",
                'state_detection':    "",
                'state_adjustment':   "Right click to select spots. Hold in shift to add to a selection."
            };

            $scope.things = {
                state: 'state_start',
                button: 'button_help'
            }
            /*
            $scope.state = 'state_start';
            $scope.button = "button_help";
            */

            // visibility bools
            $scope.visibility = {
                menuBar: true,
                menuBarPanel: false,
                spinner: false
            }

            $scope.toggleMenuBarVisibility = function() {
                $scope.visibility.menuBarPanel = !$scope.visibility.menuBarPanel;
            };
            $scope.toggleSpinnerVisibility = function() {
                $scope.visibility.spinner = !$scope.visibility.spinner;
            };

            $scope.updateState = function(new_state) {
                $scope.things.state = new_state;
                console.log("thes state is now: " + $scope.things.state);
                if($scope.things.state === 'state_upload') {
                    $scope.visibility.menuBar = false;
                    $scope.visibility.spinner = true;
                    /*
                    console.log($scope.visibility.menuBar);
                    console.log($scope.visibility.spinner);
                    */
                }
            };

            $scope.helpButton = function() {
                $scope.toggleMenuBarVisibility();
                $scope.things.button = "button_help";
            };

            $scope.getPanelText = function(things) {
                var text = "";
                if(things.button == "button_help") {
                    text = helpTexts[things.state];
                }
                return text;
            };
        }
    ]);
