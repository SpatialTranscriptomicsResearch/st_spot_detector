import _ from 'underscore';

import imageToggleCy from 'assets/images/imageToggleCy3.png';
import imageToggleHE from 'assets/images/imageToggleHE.png';

import LayerManager from './viewer/layer-manager';
import modal from './modal';

function error(message) {
    modal(
        'Error',
        `<b>Error</b>: ${message === null ? 'Unkown error' : message}`,
    );
}

function warning(message) {
    modal(
        'Warning',
        `<b>Warning</b>: ${message === null ? 'Unkown warning' : message}`,
    );
}

function unwrapRequest(request) {
    return new Promise(
        (resolve, reject) => {
            request
                .then((response) => {
                    const success = response.data.success;
                    const warnings = response.data.warnings;
                    const result = response.data.result;
                    _.each(warnings, warning);
                    if (!success) {
                        error(result);
                        return reject(result);
                    }
                    return resolve(result);
                })
                .catch((response) => {
                    const result = response.data;
                    error(result);
                    reject(result);
                })
            ;
        },
    );
}

function tryState(scope, state, request) {
    const oldState = scope.data.state;
    scope.updateState(state);
    return new Promise(
        (resolve, reject) => {
            request.then(resolve).catch((result) => {
                scope.updateState(oldState);
                reject(result);
            });
        },
    );
}

const main = [
    '$scope',
    '$http',
    '$sce',
    '$compile',
    '$q',
    function($scope, $http, $sce, $compile, $q) {
        // texts to display in the menu bar panel when clicking the help button
        const helpTexts = {
            state_start:         "Click on the top-most icon to select and upload image(s). The image(s) must be in .jpg format and rotated so that the frame cluster appears at the top left of the image.",
            state_upload:        "",
            state_predetection:  "Adjust the lines to align on top of the outermost spot frame.\n" +
            "Click on 'Detect spots' to begin spot detection.",
            state_detection:     "",
            state_adjustment:    "Left click or Ctrl+click to select spots. Hold in shift to add to a selection.\n" +
            "Right click to move selected spots or navigate the canvas.\n" +
            "Click 'Delete spots' to delete selected spots.\n" +
            "Click 'Add spots' to change to spot addition mode, then right click or Ctrl+click to add spots.\n" +
            "(HE only) Click 'Select spots within tissue' to automatically select spots within the tissue.\n" +
            "Click 'Finish Adding Spots' to return to selection mode.\n",
            state_error:         "An error occured. Please try again."
        };

        // texts to display underneath the spinner while loading
        const spinnerTexts = {
            state_start:         "",
            state_upload:        "Processing image(s). This may take a few minutes.",
            state_predetection:  "",
            state_detection:     "Detecting spots.",
            state_adjustment:     "",
            state_error:         ""
        };

        // texts to display as a title on the menu bar panel
        const panelTitles = {
            button_uploader: 'Uploader',
            button_aligner: 'Alignment',
            button_detector: 'Detection Parameters',
            button_adjuster: 'Spot adjustment',
            button_exporter: 'Export',
            button_help: 'Help',
            button_info: 'Info'
        };

        // variables which hold more "global" important information, some shared between
        // other controllers/directives
        $scope.data = {
            state: '',
            logicHandler: null,
            button: 'button_uploader',
            sessionId: '',
            cy3Image: '',
            heImage: '',
            cy3Active: null,
            cy3Filename: '',
        };

        $scope.classes = {
            canvas: "grabbable"
        };

        $scope.exportForm = {
            selection: 'selection',
            includeImageSize: false,
            /*
            includeImageSizeLatent: true,
            includeImageSize(value) {
                if (arguments.length !== 0) {
                    this.includeImageSizeLatent = value;
                }
                if (this.coordinateType === 'pixel') {
                    return this.includeImageSizeLatent;
                }
                return false;
            },
            */
        };

        // bools which control the visibilty of various elements on the page
        $scope.visible = {
            menuBar: Boolean(),
            menuBarPanel: Boolean(),
            zoomBar: Boolean(),
            imageToggleBar: Boolean(),
            spinner: Boolean(),
            canvas: Boolean(),
            undo: {
                undo: Boolean(),
                redo: Boolean(),
            },
            panel: {
                button_uploader: Boolean(),
                button_aligner: Boolean(),
                button_detector: Boolean(),
                button_adjuster: Boolean(),
                button_exporter: Boolean(),
                button_help: Boolean(),
                button_info: Boolean(),
            },
            spotAdjuster: {
                button_addSpots: Boolean(),
                button_finishAddSpots: Boolean(),
                button_deleteSpots: Boolean(),
                div_insideTissue: Boolean(),
            },
        };

        // strings which determine the clickable state of the menu bar buttons 
        $scope.menuButtonDisabled = {
            button_uploader: Boolean(),
            button_aligner: Boolean(),
            button_detector: Boolean(),
            button_adjuster: Boolean(),
            button_exporter: Boolean(),
            button_help: Boolean(),
            button_info: Boolean(),
        };

        $scope.layerManager = new LayerManager();

        function init_state() {
            $scope.data.state = 'state_start';

            $scope.visible.menuBar = true;
            $scope.visible.menuBarPanel = true;
            $scope.visible.zoomBar = false;
            $scope.visible.imageToggleBar = false;
            $scope.visible.spinner = false;
            $scope.visible.canvas = false;
            $scope.visible.undo.undo = true;
            $scope.visible.undo.redo = true;
            $scope.visible.panel.button_uploader = true;
            $scope.visible.panel.button_aligner = false;
            $scope.visible.panel.button_detector = false;
            $scope.visible.panel.button_adjuster = false;
            $scope.visible.panel.button_exporter = false;
            $scope.visible.panel.button_help = false;
            $scope.visible.panel.button_info = false;
            $scope.visible.spotAdjuster.button_addSpots = true;
            $scope.visible.spotAdjuster.button_finishAddSpots = false;
            $scope.visible.spotAdjuster.button_deleteSpots = true;
            $scope.visible.spotAdjuster.div_insideTissue = false;

            $scope.menuButtonDisabled.button_uploader = false;
            $scope.menuButtonDisabled.button_aligner = true;
            $scope.menuButtonDisabled.button_detector = true;
            $scope.menuButtonDisabled.button_adjuster = true;
            $scope.menuButtonDisabled.button_exporter = true;
            $scope.menuButtonDisabled.button_help = false;
            $scope.menuButtonDisabled.button_info = false;
        }

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

        function updateVisibility() {
            $scope.layerManager.getLayer('cy3')
                .set('visible', $scope.data.cy3Active)
                .set('alpha', 1.0);
            if ('he' in $scope.layerManager.getLayers()) {
                $scope.layerManager.getLayer('he')
                    .set('visible', !$scope.data.cy3Active)
                    .set('alpha', 1.0);
            }
        }

        $scope.updateState = function(new_state) {
            $scope.data.state = new_state;

            if($scope.data.state === 'state_start') {
                init_state();
            }
            else if($scope.data.state === 'state_upload') {
                $scope.visible.menuBar = false;
                $scope.visible.zoomBar = false;
                $scope.visible.spinner = true;
                $scope.visible.canvas = false;
            }
            else if($scope.data.state === 'state_predetection') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.spinner = false;
                $scope.visible.canvas = true;

                $scope.data.logicHandler = $scope.predetectionLH;
            }
            else if($scope.data.state === 'state_alignment') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.spinner = false;
                $scope.visible.canvas = true;
                $scope.visible.imageToggleBar = false;

                $scope.aligner.initialize();

                $scope.data.logicHandler = $scope.aligner.logicHandler;
            }
            else if($scope.data.state === 'state_detection') {
                $scope.visible.menuBar = false;
                $scope.visible.zoomBar = false;
                $scope.visible.spinner = true;
                $scope.visible.canvas = false;
            }
            else if($scope.data.state === 'state_adjustment') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.spinner = false;
                $scope.visible.canvas = true;

                $scope.data.logicHandler = $scope.adjustmentLH;
            }

            if ('he' in $scope.layerManager.getLayers() && new_state !== 'state_alignment') {
                // toggle bar should have the same visibility as the zoom bar if HE tiles
                // uploaded and we're not in the alignment view
                $scope.visible.imageToggleBar = $scope.visible.zoomBar;
                updateVisibility();
            } else {
                $scope.visible.imageToggleBar = false;
            }

        };

        function openPanel(button, ...args) {
            // undisable the button
            $scope.menuButtonDisabled[button] = false;
            // click the button
            $scope.menuButtonClick(button, ...args);
        }

        $scope.undoButtonClick = function(direction) {
            $scope.undo(direction); // defined in the viewer directive
        };

        $scope.zoomButtonClick = function(direction) {
            $scope.zoom(direction); // defined in the viewer directive
        };

        $scope.imageToggleButtonClick = function() {
            $scope.data.cy3Active = !$scope.data.cy3Active;
            updateVisibility();
        };

        let prevState = null;

        $scope.menuButtonClick = function(button, state) {
            // only clickable if not disabled
            if (!$scope.menuButtonDisabled[button]) {
                // switch off all the panel visibilities
                for(var panel in $scope.visible.panel) {
                    $scope.visible.panel[panel] = false;
                }
                // except for the one we just selected
                $scope.visible.panel[button] = true;
                toggleMenuBarPanelVisibility($scope.data.button, button);
                $scope.data.button = button;

                if (state !== undefined) {
                    if (state !== $scope.data.state) {
                        prevState = $scope.data.state;
                        $scope.updateState(state);
                    }
                } else if (prevState !== null) {
                    $scope.updateState(prevState);
                    prevState = null;
                }
            }
        };

        $scope.detectSpots = function() {
            // we want to send the calibration data to the server,
            // so we retrieve it from the viewer directive
            const calibrationData = $scope.getCalibrationData();
            // append the session id to this data so the server knows
            // who we are
            calibrationData.session_id = $scope.data.sessionId;

            $q.when(tryState(
                $scope,
                'state_detection',
                unwrapRequest($http.get('../detect_spots', { params: calibrationData })),
            )).then((result) => {
                $scope.updateState('state_adjustment');
                openPanel('button_exporter');
                openPanel('button_adjuster');
                $scope.loadSpots(result); // defined in the viewer directive
                $scope.data.spotTransformMatrx = result.transform_matrix;
            }, _.noop);
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

        $scope.getImageToggleImage = function() {
            if ($scope.data.cy3Active) {
                return imageToggleHE;
            }
            return imageToggleCy;
        };

        $scope.getImageToggleText = function() {
            if ($scope.data.cy3Active) {
                return 'HE';
            }
            return 'Cy3';
        };

        $scope.uploadImage = function() {
            if($scope.data.cy3Image != '') {
                $scope.updateState('state_start');

                unwrapRequest($http.get('../session_id')).then((response) => {
                    $scope.data.sessionId = response;
                    $q.when(tryState(
                        $scope,
                        'state_upload',
                        unwrapRequest(
                            $http.post(
                                '../tiles',
                                {
                                    cy3_image: $scope.data.cy3Image,
                                    he_image: $scope.data.heImage,
                                    session_id: $scope.data.sessionId,
                                },
                            ),
                        ),
                    )).then((result) => {
                        $scope.receiveTilemap(result); // defined in the viewer directive
                        $scope.data.cy3Active = true;
                        if (result.he !== undefined) {
                            $scope.visible.spotAdjuster.div_insideTissue = true;
                            $scope.menuButtonDisabled.button_detector = false;
                            $scope.updateState('state_predetection');
                            openPanel('button_aligner', 'state_alignment');
                        } else {
                            $scope.visible.spotAdjuster.div_insideTissue = false;
                            $scope.updateState('state_predetection');
                            openPanel('button_detector');
                        }
                    }, _.noop);
                }, _.noop);
            }
        };

        init_state();
    }
];

export default main;
