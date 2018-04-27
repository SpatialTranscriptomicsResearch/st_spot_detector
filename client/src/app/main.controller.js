import _ from 'underscore';

import imageToggleCy from 'assets/images/imageToggleCy3.png';
import imageToggleHE from 'assets/images/imageToggleHE.png';

import LayerManager from './viewer/layer-manager';
import modal from './modal';

import { LOAD_STAGE } from './loading-widget.directive';

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
            loadingWidget: Boolean(),
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

        function openPanel(button, state) {
            // undisable the button
            $scope.menuButtonDisabled[button] = false;
            // click the button
            $scope.menuButtonClick(button, state);
        }

        function init_state() {
            $scope.visible.menuBarPanel = false;
            $scope.visible.imageToggleBar = false;
            $scope.visible.undo.undo = true;
            $scope.visible.undo.redo = true;
            $scope.visible.panel.button_uploader = false;
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

            openPanel('button_uploader', 'state_start');
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
            const setVisibility = (layer, value) => {
                if (layer in $scope.layerManager.getLayers()) {
                    $scope.layerManager.getLayer(layer).set('visible', value);
                }
            };
            if ($scope.data.state === 'state_alignment') {
                setVisibility('cy3', true);
                setVisibility('he', true);
            } else {
                setVisibility('cy3', $scope.data.cy3Active);
                setVisibility('he', !$scope.data.cy3Active);
            }
        }

        $scope.updateState = function(new_state) {
            if ($scope.data.state === 'state_alignment') {
                $scope.exitAlignment();
            }

            $scope.data.state = new_state;

            if($scope.data.state === 'state_start') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = false;
                $scope.visible.loadingWidget = false;
                $scope.visible.canvas = false;
            }
            else if($scope.data.state === 'state_upload') {
                $scope.visible.menuBar = false;
                $scope.visible.zoomBar = false;
                $scope.visible.loadingWidget = true;
                $scope.visible.canvas = false;
            }
            else if($scope.data.state === 'state_predetection') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.loadingWidget = false;
                $scope.visible.canvas = true;

                $scope.data.logicHandler = $scope.predetectionLH;
            }
            else if($scope.data.state === 'state_alignment') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.loadingWidget = false;
                $scope.visible.canvas = true;
                $scope.visible.imageToggleBar = false;

                $scope.initAlignment();

                $scope.data.logicHandler = $scope.alignerLH;
            }
            else if($scope.data.state === 'state_detection') {
                $scope.visible.menuBar = false;
                $scope.visible.zoomBar = false;
                $scope.visible.loadingWidget = true;
                $scope.visible.canvas = false;
            }
            else if($scope.data.state === 'state_adjustment') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.loadingWidget = false;
                $scope.visible.canvas = true;

                $scope.data.logicHandler = $scope.adjustmentLH;
            }

            if ('he' in $scope.layerManager.getLayers() && new_state !== 'state_alignment') {
                // toggle bar should have the same visibility as the zoom bar if HE tiles
                // uploaded and we're not in the alignment view
                $scope.visible.imageToggleBar = $scope.visible.zoomBar;
            } else {
                $scope.visible.imageToggleBar = false;
            }

            updateVisibility();
        };

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
                    $scope.updateState(state);
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

            let loadingState = $scope.initLoading(LOAD_STAGE.WAIT);

            $q.when(tryState(
                $scope,
                'state_detection',
                unwrapRequest($http({
                    method: 'GET',
                    url: '../detect_spots',
                    params: calibrationData,
                    eventHandlers: {
                        progress(e) {
                            loadingState = $scope.updateLoading(
                                loadingState,
                                {
                                    stage: LOAD_STAGE.DOWNLOAD,
                                    loaded: e.loaded,
                                    total: e.total,
                                },
                            );
                        },
                    },
                })),
            )).then((result) => {
                $scope.updateState('state_adjustment');
                openPanel('button_exporter');
                openPanel('button_adjuster');
                $scope.loadSpots(result); // defined in the viewer directive
                $scope.data.spotTransformMatrx = result.transform_matrix;
            }).catch(
                _.noop,
            ).finally(() => {
                $scope.exitLoading(loadingState);
            });
        };

        $scope.getPanelTitle = function(button) {
            return panelTitles[button];
        };

        $scope.getHelpTexts = function(state) {
            return helpTexts[state];
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
                init_state();

                let loadingState = $scope.initLoading();

                $q.when(tryState(
                    $scope,
                    'state_upload',
                    unwrapRequest($http.get('../session_id')).then((response) => {
                        $scope.data.sessionId = response;
                        return unwrapRequest($http({
                            method: 'POST',
                            url: '../tiles',
                            uploadEventHandlers: {
                                progress(e) {
                                    loadingState = $scope.updateLoading(
                                        loadingState,
                                        {
                                            stage: LOAD_STAGE.UPLOAD,
                                            loaded: e.loaded,
                                            total: e.total,
                                        },
                                    );
                                },
                                load() {
                                    loadingState = $scope.updateLoading(
                                        loadingState,
                                        { stage: LOAD_STAGE.WAIT },
                                    );
                                },
                            },
                            eventHandlers: {
                                progress(e) {
                                    loadingState = $scope.updateLoading(
                                        loadingState,
                                        {
                                            stage: LOAD_STAGE.DOWNLOAD,
                                            loaded: e.loaded,
                                            total: e.total,
                                        },
                                    );
                                },
                            },
                            data: {
                                cy3_image: $scope.data.cy3Image,
                                he_image: $scope.data.heImage,
                                session_id: $scope.data.sessionId,
                            },
                        }));
                    }),
                )).then((result) => {
                    $scope.receiveTilemap(result);
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
                }).catch(
                    _.noop,
                ).finally(() => {
                    $scope.exitLoading(loadingState);
                });
            }
        };

        init_state();
    }
];

export default main;
