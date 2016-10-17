'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        '$http',
        function($scope, $http) {
            // texts to display in the menu bar panel when clicking the help button
            const helpTexts = {
                'state_start':        "Click on the picture icon to select and upload a Cy3 fluorescence image.",
                'state_upload':       "",
                'state_predetection': "Position the frame to align with the outermost spots.\n"
                                      + "Adjust brightness and contrast for optimal spot detection.\n"
                                      + "Click on detect to begin spot detection.",
                'state_detection':    "",
                'state_adjustment':   "Right click to select spots. Hold in shift to add to a selection.",
                'state_error':        "An error occured. Please try again."
            };

            // texts to display underneath the spinner while loading
            const spinnerTexts = {
                'state_start':        "",
                'state_upload':       "Processing image. This may take a few minutes.",
                'state_predetection': "",
                'state_detection':    "Detecting spots. This may take a few minutes.",
                'state_adjustment':   "",
                'state_error':        ""
            };

            $scope.data = {
                state: 'state_start',
                button: 'button_help',
                sessionId: '',
                image: '',
                errorText: ''
            };

            // visible bools
            $scope.visible = {
                menuBar: true,
                menuBarPanel: false,
                spinner: false,
                canvas: true,
                error: false
            };

            // strings which determine the clickable state of the menu bar buttons 
            $scope.menuButtonDisabled = {
                uploader: '',
                detector: 'disabled',
                adjuster: 'disabled',
                exporter: 'disabled',
                help: '',
                info: ''
            };

            var toggleMenuBarPanelVisibility = function(previousButton, thisButton) {
                // the panel is closed if the same button is pressed again
                // but stays open otherwise
                if(previousButton != thisButton) {
                    $scope.visible.menuBarPanel = true;
                }
                else {
                    $scope.visible.menuBarPanel = !$scope.visible.menuBarPanel;
                }
            };

            $scope.updateState = function(new_state) {
                $scope.data.state = new_state;
                if($scope.data.state === 'state_start') {
                    // reinitialise things
                }
                else if($scope.data.state === 'state_upload') {
                    $scope.visible.menuBar = false;
                    $scope.visible.spinner = true;
                    $scope.visible.canvas = false;
                    $scope.visible.errorText = false;
                }
                else if($scope.data.state === 'state_predetection') {
                    $scope.visible.menuBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = true;
                    $scope.visible.errorText = false;

                    $scope.menuButtonDisabled.detector = '';
                    $scope.data.button = "button_detector";
                    toggleMenuBarPanelVisibility();
                }
                else if($scope.data.state === 'state_error') {
                    $scope.visible.menuBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = false;
                    $scope.visible.errorText = true;
                }
            };

            $scope.checkDisabled = function(state) {
                if(state === 'state_start') {
                    // reinitialise things
                }
                else if(state === 'state_upload') {
                    $scope.visible.menuBar = false;
                    $scope.visible.spinner = true;
                    $scope.visible.errorText = false;
                }
                else if(state === 'state_predetection') {
                    $scope.visible.menuBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.errorText = false;
                    // set 
                }
                else if(state === 'state_error') {
                    $scope.visible.menuBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.errorText = true;
                }
            };

            $scope.menuButtonClick = function(button) {
                toggleMenuBarPanelVisibility($scope.data.button, button);
                $scope.data.button = button;
            };

            $scope.getPanelText = function(button, state) {
                var text = "";
                if(button == "button_help") {
                    text = helpTexts[state];
                }
                else if(button == "button_detector") {
                    text = "Detection mode.";
                }
                return text;
            };

            $scope.getSpinnerText = function(state) {
                return spinnerTexts[state];
            };

            $scope.uploadImage = function() {
                var getTileData = function() {
                    var tileSuccessCallback = function(response) {

                        $scope.receiveTilemap(response.data);
                        $scope.updateState('state_predetection');
                    };
                    var tileErrorCallback = function(response) {
                        $scope.data.errorText = response.data;
                        console.error(response.data);
                        $scope.updateState('state_error');
                    };
                    $http.post('../tiles', {image: $scope.data.image, session_id: $scope.data.sessionId})
                        .then(tileSuccessCallback, tileErrorCallback);
                };

                var getSessionId = function() {
                    var sessionSuccessCallback = function(response) {
                        $scope.data.sessionId = response.data;
                        getTileData();
                    };
                    var sessionErrorCallback = function(response) {
                        $scope.data.errorText = response.data;
                        console.error(response.data);
                        $scope.updateState('state_error');
                    };
                    $http.get('../session_id')
                        .then(sessionSuccessCallback, sessionErrorCallback);
                };
                getSessionId();
            };
        }
    ]);

