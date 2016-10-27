'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        '$http',
        '$sce',
        '$compile',
        function($scope, $http, $sce, $compile) {
            var addSpotsToastsDisplayed = false;

            // texts to display in the menu bar panel when clicking the help button
            const helpTexts = {
                state_start:        "Click on the top-most icon to select and upload a Cy3 fluorescence image.",
                state_upload:       "",
                state_predetection: "Adjust the lines to align on top of the outermost spot frame.<br>"
                                  + "Click on DETECT SPOTS to begin spot detection.",
                state_detection:    "",
                state_adjustment:   "Right click or Ctrl+click to select spots. Hold in shift to add to a selection.<br>"
                                  + "Left click to move selected spots or navigate the canvas.<br>"
                                  + "Click DELETE SPOTS to delete selected spots.<br>"
                                  + "Click ADD SPOTS to change to spot addition mode, then right click or Ctrl+click to add spots.<br>"
                                  + "Click FINISH ADDING SPOTS to return to selection mode.<br>",
                state_error:        "An error occured. Please try again."
            };

            // texts to display underneath the spinner while loading
            const spinnerTexts = {
                state_start:        "",
                state_upload:       "Processing image. This may take a few minutes.",
                state_predetection: "",
                state_detection:    "Detecting spots. This may take a few minutes.",
                state_adjustment:    "",
                state_error:        ""
            };

            // texts to display as a title on the menu bar panel
            const panelTitles = {
                button_uploader: '',
                button_detector: 'Detection Parameters',
                button_adjuster: 'Spot adjustment',
                button_exporter: 'Spot export',
                button_help: 'Help',
                button_info: ''
            };

            // variables which hold more "global" important information, some shared between
            // other controllers/directives
            $scope.data = {
                state: 'state_start',
                button: 'button_help',
                sessionId: '',
                image: '',
                errorText: ''
            };

            $scope.exportForm = {
                selection: 'selection',
                coordinateType: 'array'
            };

            // bools which control the visibilty of various elements on the page
            $scope.visible = {
                menuBar: true,
                menuBarPanel: false,
                spinner: false,
                canvas: true,
                error: false,
                panel: {
                    button_detector: false,
                    button_adjuster: false,
                    button_exporter: false,
                    button_help: false
                },
                spotAdjuster: {
                    button_addSpots: true,
                    button_finishAddSpots: false,
                    button_deleteSpots: true
                }
            };

            // strings which determine the clickable state of the menu bar buttons 
            $scope.menuButtonDisabled = {
                button_uploader: '',
                button_detector: 'disabled',
                button_adjuster: 'disabled',
                button_exporter: 'disabled',
                button_help: '',
                button_info: ''
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
            
            function displayToasts(toastTexts) {
                // triggers the chain of recursion
                chainToast(toastTexts, 0);
            }

            function chainToast(toastTexts, toastIndex) {
                // recursive function for displaying several toasts in a row
                // if last toast in list of toasts
                if(toastTexts.length == toastIndex) { 
                    // do nothing, end recursion
                }
                else {
                    toastr.options.onHidden = function() {
                        chainToast(toastTexts, toastIndex + 1);
                    };
                    toastr["info"](toastTexts[toastIndex]);
                }
            }

            $scope.addSpotsToasts = function() {
                if(!addSpotsToastsDisplayed) {
                    addSpotsToastsDisplayed = true;
                    var toasts = [
                        "Right click or Ctrl+click to add spots.",
                        "Left click to navigate the canvas.",
                        "Click FINISH ADDING SPOTS to return to selection mode."
                    ];
                    displayToasts(toasts);
                }
            };

            function toast() {
                if($scope.data.state === 'state_start') {
                }
                else if($scope.data.state === 'state_upload') {
                    toastr.clear();
                }
                else if($scope.data.state === 'state_predetection') {
                    toastr["info"](
                        "Adjust the lines to align on top of the outermost spot frame.<br>" +
                        "Click DETECT SPOTS to begin automatic spot detection."
                    );
                }
                else if($scope.data.state === 'state_detection') {
                    toastr.clear();
                }
                else if($scope.data.state === 'state_adjustment') {
                    toastr.options.timeOut = "7000";
                    var toasts = [
                        "Detected spots are shown in red.",
                        "Right click or Ctrl+click to select spots. Holding in Shift adds to the selection.<br>" +
                        "Left click to move selected spots or navigate the canvas.",
                        "Click DELETE SPOTS to deleted selected spots.<br>" + 
                        "Click ADD SPOTS to add additional spots."
                    ];
                    displayToasts(toasts);
                }
                else if($scope.data.state === 'state_error') {
                    toastr.clear();
                }
            }

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

                    openPanel('button_detector');
                }
                else if($scope.data.state === 'state_detection') {
                    $scope.visible.menuBar = false;
                    $scope.visible.spinner = true;
                    $scope.visible.canvas = false;
                    $scope.visible.errorText = false;
                }
                else if($scope.data.state === 'state_adjustment') {
                    $scope.visible.menuBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = true;
                    $scope.visible.errorText = false;

                    openPanel('button_exporter');
                    openPanel('button_adjuster');
                }
                else if($scope.data.state === 'state_error') {
                    $scope.visible.menuBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = false;
                    $scope.visible.errorText = true;
                }
                toast();
            };

            function openPanel(button) {
                $scope.menuButtonDisabled[button] = '';
                $scope.data.button = button;
                $scope.menuButtonClick(button);
            }

            $scope.menuButtonClick = function(button) {
                // switch off all the panel visibilities
                for(var panel in $scope.visible.panel) {
                    $scope.visible.panel[panel] = false;
                }
                // except for the one we just selected
                $scope.visible.panel[button] = true;
                toggleMenuBarPanelVisibility($scope.data.button, button);
                $scope.data.button = button;
            };

            $scope.detectSpots = function() {
                $scope.updateState('state_detection');

                var getSpotData = function() {
                    var successCallback = function(response) {
                        $scope.updateState('state_adjustment');
                        $scope.loadSpots(response.data); // defined in the viewer directive
                    };
                    var errorCallback = function(response) {
                        $scope.data.errorText = response.data;
                        console.error(response.data);
                        $scope.updateState('state_error');
                    };

                    // we want to send the calibration data to the server,
                    // so we retrieve it from the viewer directive
                    var calibrationData = $scope.getCalibrationData();
                    // append the session id to this data so the server knows
                    // who we are
                    calibrationData.session_id = $scope.data.sessionId;

                    var config = {
                        params: calibrationData
                    };
                    $http.get('../detect_spots', config)
                        .then(successCallback, errorCallback);
                };
                getSpotData();
            };

            $scope.getPanelTitle = function(button) {
                return panelTitles[button];
            };

            $scope.getHelpTexts = function(state) {
                return helpTexts[state];
            };

            $scope.getSpinnerText = function(state) {
                return spinnerTexts[state];
            };

            $scope.uploadImage = function() {
                var getTileData = function() {
                    var tileSuccessCallback = function(response) {
                        $scope.updateState('state_predetection');
                        $scope.receiveTilemap(response.data); // defined in the viewer directive
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

            toastr.options = {
                "closeButton": false,
                "debug": false,
                "newestOnTop": true,
                "progressBar": false,
                "positionClass": "toast-top-center",
                "preventDuplicates": true,
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "0",
                "extendedTimeOut": "10000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            };
            toastr["info"]("Welcome to the Spatial Transcriptomics Spot Detection Tool. Begin by clicking the top-most icon to upload a Cy3 fluorescence image.", "");
        }
    ]);

