import $ from 'jquery';
import _ from 'lodash';
import math from 'mathjs';

import imageToggleCy from 'assets/images/imageToggleCy3.png';
import imageToggleHE from 'assets/images/imageToggleHE.png';

import LayerManager from './viewer/layer-manager';
import {
    create as createLWidget,
    update as updateLWidget,
    stop as stopLWidget,
    LOAD_STAGE,
} from './loading-widget';
import { error, warning } from './modal';
import send, { SOCKET_STATUS } from './socket';
import { setCursor } from './utils';


const main = [
    '$scope',
    '$http',
    '$sce',
    '$compile',
    '$q',
    function($scope, $http, $sce, $compile, $q) {
        // texts to display in the menu bar panel when clicking the help button
        const helpTexts = _.mapValues({
            state_start:      `<p>Select images to upload.
                               The Cy3 image is required but the HE image is optional.
                               If an HE image is uploaded, exported pixel coordinates will correspond to spot positions on the HE image.</p>

                               <p>The uploaded image(s) must be in .jpg format.</p>`,

            state_alignment:  `<p>This view can be used to make adjustments to the uploaded images.</p>

                               <p>If you have uploaded an HE image, make sure that the Cy3 and HE images are correctly aligned.</p>`,

            state_adjustment: `<p>Make sure that the spots and the frame of the array have been detected correctly.
                               The frame can be adjusted by dragging the outermost lines.
                               Similarly, misplaced spots can be dragged to their correct positions.
                               Missing spots can be added back from the 'Add spots' menu.</p>

                               <p>Each spot has a corresponding <i>assignment line</i>.
                               The assignment line is displayed as a white line between the center of the spot and the array position that the spot has been mapped to.
                               If multiple spots map to the same array position, the assignment lines of the affected spots turn red.
                               To correct an assignment, click 'Edit assignments' and then click the spot and drag the mouse to the correct array position.</p>

                               <p>Spots can be selected in order to adjust their positions simultaneously, to delete them, or to export them selectively.
                               To add (remove) spots to the current selection, left (right) click and drag the mouse over them.</p>`,
        }, $sce.trustAsHtml);

        // texts to display as a title on the menu bar panel
        const panelTitles = {
            button_uploader: 'Image upload',
            button_aligner: 'Image adjustment',
            button_adjuster: 'Spot adjustment',
            button_exporter: 'Data export',
            button_help: 'Help',
            button_settings: 'Settings',
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
            selectionFlag(v) {
                if (arguments.length) {
                    this.selectionFlagValue = v;
                    return v;
                }
                return this.selection === 'all' && this.selectionFlagValue;
            },
            selectionFlagValue: true,
        };

        // bools which control the visibilty of various elements on the page
        $scope.visible = {
            menuBar: Boolean(),
            menuBarPanel: Boolean(),
            zoomBar: Boolean(),
            imageToggleBar: Boolean(),
            loading: Boolean(),
            canvas: Boolean(),
            undo: {
                undo: Boolean(),
                redo: Boolean(),
            },
            panel: {
                button_uploader: Boolean(),
                button_aligner: Boolean(),
                button_adjuster: Boolean(),
                button_exporter: Boolean(),
                button_help: Boolean(),
                button_settings: Boolean(),
            },
            spotAdjuster: String(),
        };

        // strings which determine the clickable state of the menu bar buttons 
        $scope.menuButtonDisabled = {
            button_uploader: Boolean(),
            button_aligner: Boolean(),
            button_adjuster: Boolean(),
            button_exporter: Boolean(),
            button_help: Boolean(),
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
            $scope.visible.panel.button_adjuster = false;
            $scope.visible.panel.button_exporter = false;
            $scope.visible.panel.button_help = false;
            $scope.visible.panel.button_settings = false;
            $scope.visible.spotAdjuster = 'default';

            $scope.menuButtonDisabled.button_uploader = false;
            $scope.menuButtonDisabled.button_aligner = true;
            $scope.menuButtonDisabled.button_adjuster = true;
            $scope.menuButtonDisabled.button_exporter = true;
            $scope.menuButtonDisabled.button_help = false;

            openPanel('button_uploader', 'state_start');
        }

        $scope.hasHE = function() {
            return 'HE' in $scope.layerManager.getLayers();
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

        function updateVisibility() {
            const setVisibility = (layer, value) => {
                if (layer in $scope.layerManager.getLayers()) {
                    $scope.layerManager.getLayer(layer).set('visible', value);
                }
            };
            if ($scope.data.state === 'state_alignment') {
                setVisibility('Cy3', true);
                setVisibility('HE', true);
            } else {
                setVisibility('Cy3', $scope.data.cy3Active);
                setVisibility('HE', !$scope.data.cy3Active);
            }
        }

        $scope.updateState = function(new_state) {
            const transformAnnotations = (tmat) => {
                const doTransform = _.flow(
                    xs => [[...xs, 1]],
                    math.transpose,
                    _.partial(math.multiply, tmat),
                    math.flatten,
                    /* eslint-disable no-underscore-dangle */
                    xs => xs._data,
                    _.partial(_.take, _, 2),
                );

                $scope.calibrator.points = _.map(
                    $scope.calibrator.points, doTransform);
                $scope.spotManager.spots = _.map(
                    $scope.spotManager.spots,
                    (s) => {
                        /* eslint-disable no-param-reassign */
                        [s.x, s.y] = doTransform([s.x, s.y]);
                        return s;
                    },
                );
            };

            if ($scope.data.state === 'state_alignment') {
                $scope.exitAlignment();
                transformAnnotations(
                    $scope.layerManager.getLayer('Cy3').tmat);
            }

            $scope.data.state = new_state;

            if($scope.data.state === 'state_start') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = false;
                $scope.visible.loading = false;
                $scope.visible.canvas = false;
                setCursor('default');
            }
            else if($scope.data.state === 'state_upload') {
                $scope.visible.menuBar = false;
                $scope.visible.zoomBar = false;
                $scope.visible.loading = true;
                $scope.visible.canvas = false;
            }
            else if($scope.data.state === 'state_alignment') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.loading = false;
                $scope.visible.canvas = true;
                $scope.visible.imageToggleBar = false;

                transformAnnotations(math.inv(
                    $scope.layerManager.getLayer('Cy3').tmat));
                $scope.initAlignment();

                $scope.data.logicHandler = $scope.alignerLH;
            }
            else if($scope.data.state === 'state_adjustment') {
                $scope.visible.menuBar = true;
                $scope.visible.zoomBar = true;
                $scope.visible.loading = false;
                $scope.visible.canvas = true;

                $scope.collisionTracker.update();

                $scope.data.logicHandler = $scope.adjustmentLH;
            }

            if ($scope.hasHE() && new_state !== 'state_alignment') {
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

                const oldState = $scope.data.state;

                const lel = $('#loading');
                lel.empty();

                const LWidgets = {};
                const update = (name, state) => {
                    const getWidget = () => {
                        if (!(name in LWidgets)) {
                            const ret = createLWidget(lel, name);
                            const [, canvas] = ret;
                            LWidgets[name] = ret;
                            canvas.hide().appendTo(lel).slideDown(500);
                            return ret;
                        }
                        return LWidgets[name];
                    };
                    const [widget, canvas] = getWidget();
                    updateLWidget(widget, state);
                    if (state.stage === LOAD_STAGE.DOWNLOAD &&
                            state.loaded === state.total) {
                        stopLWidget(widget);
                        canvas.slideUp(500, () => { canvas.remove(); });
                    }
                };

                const addStatusMessage = (message) => {
                    $(`<p>${message}<i class="fa fa-spinner fa-pulse"></i></p>`)
                        .hide().prependTo(lel).slideDown(500);
                };

                const removeStatusMessages = () => {
                    const statusMessages = lel.children('p');
                    statusMessages.children('i')
                        .removeClass('fa-spinner fa-pulse')
                        .addClass('fa-check');
                    $.when(statusMessages.slideUp(500))
                        .done(() => { statusMessages.remove(); });
                };

                $scope.updateState('state_upload');

                $q.when(
                    send(
                        `${window.location.origin.replace(/^http/, 'ws')}/run`,
                        [
                            ..._.filter(
                                _.map(
                                    [
                                        ['Cy3', $scope.data.cy3Image],
                                        ['HE', $scope.data.heImage],
                                    ],
                                    ([identifier, data]) => {
                                        if (data.length === 0) {
                                            return undefined;
                                        }
                                        return { type: 'image', identifier, data };
                                    },
                                ),
                                _.identity,
                            ),
                        ],
                        ([status, data]) => {
                            if (status & (SOCKET_STATUS.RECEIVING | SOCKET_STATUS.PROCESSING)) {
                                removeStatusMessages();
                            }
                            switch (status) {
                            case SOCKET_STATUS.SENDING: {
                                const state = data.loaded === data.total
                                    ? {
                                        stage: LOAD_STAGE.WAIT,
                                        message: 'Waiting',
                                    }
                                    : {
                                        stage: LOAD_STAGE.UPLOAD,
                                        loaded: data.loaded,
                                        total: data.total,
                                    }
                                ;
                                update(data.identifier, state);
                            } break;
                            case SOCKET_STATUS.RECEIVING:
                                update(
                                    data.identifier,
                                    {
                                        stage: LOAD_STAGE.DOWNLOAD,
                                        loaded: data.loaded,
                                        total: data.total,
                                    },
                                );
                                break;
                            case SOCKET_STATUS.PROCESSING:
                                addStatusMessage(data.message);
                                break;
                            default:
                                // ignore
                            }
                        },
                    ),
                ).then(
                    (result) => {
                        const tiles = _.omit(result, ['spots', 'mask']);
                        $scope.receiveTilemap(tiles);
                        $scope.loadSpots(result.spots, result.mask);
                        $scope.data.cy3Active = true;
                        $scope.menuButtonDisabled.button_exporter = false;
                        if ($scope.hasHE()) {
                            $scope.menuButtonDisabled.button_adjuster = false;
                            openPanel('button_aligner', 'state_alignment');
                        } else {
                            $scope.menuButtonDisabled.button_aligner = false;
                            openPanel('button_adjuster', 'state_adjustment');
                        }
                    },
                ).catch(
                    (e) => {
                        error(e);
                        $scope.updateState(oldState);
                    },
                ).finally(
                    /* eslint-disable no-new */
                    () => { new Notification('Spot detection complete!'); },
                );
            }
        };

        init_state();
    }
];

export default main;
