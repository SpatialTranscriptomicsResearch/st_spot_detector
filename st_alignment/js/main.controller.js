'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        '$http',
        function($scope, $http) {
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
            }

            // visibility bools
            $scope.visibility = {
                menuBar: true,
                menuBarPanel: false,
                spinner: false,
                error: false
            }

            var toggleMenuBarPanelVisibility = function() {
                $scope.visibility.menuBarPanel = !$scope.visibility.menuBarPanel;
            };

            $scope.updateState = function(new_state) {
                $scope.data.state = new_state;
                if($scope.data.state === 'state_start') {
                    // reinitialise things
                }
                else if($scope.data.state === 'state_upload') {
                    $scope.visibility.menuBar = false;
                    $scope.visibility.spinner = true;
                    $scope.visibility.errorText = false;
                }
                else if($scope.data.state === 'state_predetection') {
                    $scope.visibility.menuBar = true;
                    $scope.visibility.spinner = false;
                    $scope.visibility.errorText = false;
                }
                else if($scope.data.state === 'state_error') {
                    $scope.visibility.menuBar = true;
                    $scope.visibility.spinner = false;
                    $scope.visibility.errorText = true;
                }
            };

            $scope.helpButton = function() {
                toggleMenuBarPanelVisibility();
                $scope.data.button = "button_help";
            };

            $scope.getPanelText = function(button, state) {
                var text = "";
                if(button == "button_help") {
                    text = helpTexts[state];
                }
                return text;
            };

            $scope.getSpinnerText = function(state) {
                return spinnerTexts[state];
            };

            $scope.uploadImage = function() {
                var getTileData = function() {
                    var tileSuccessCallback = function(response) {

                        //tilemap.loadTilemap(response.data);
                        //scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                        //tilePosition = tilemap.getTilePosition(cameraPosition, tilemapLevel);
                        //images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 

                        //logicHandler.currentState = logicHandler.state.calibrate;
                        //getThumbnail();
                        //updateCanvas();
                        $scope.updateState('state_predetection');
                    };
                    var tileErrorCallback = function(response) {
                        $scope.data.errorText = response.data;
                        console.error(response.data);
                        $scope.updateState('state_error');
                    };
                    console.log('now I am sending data');
                    $http.post('../tiles', {image: $scope.data.image, session_id: $scope.data.sessionId})
                        .then(tileSuccessCallback, tileErrorCallback);
                };

                var getSessionId = function() {
                    var sessionSuccessCallback = function(response) {
                        $scope.data.sessionId = response.data;
                        console.log("My session ID is " + $scope.data.sessionId);
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

