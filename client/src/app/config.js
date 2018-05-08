import _ from 'lodash';

/* eslint-disable import/prefer-default-export */
export const MAX_CACHE_SIZE = 104857600;
export const MAX_THREADS = 4;

export const WORKER_PATH = 'worker.js';

// Options for the aligner
export const ROT_POINT_COLOR_DEF = 'hsla(0,  80%, 50%, 0.6)';
export const ROT_POINT_COLOR_HLT = 'hsla(0, 100%, 80%, 1.0)';
export const ROT_POINT_LINE_WGHT = 7;
export const ROT_POINT_RADIUS = 10;

// Options for the adjustment view
export const CALIBRATOR_LINE_COL_DEF = 'hsla(0, 0%, 100%, 0.3)';
export const CALIBRATOR_LINE_COL_HLT = 'hsla(0, 0%, 100%, 1.0)';
export const CALIBRATOR_LINE_WGHT    = 4;
export const CALIBRATOR_GRID_COL     = 'hsla(0, 0%, 100%, 0.2)';
export const CALIBRATOR_GRID_WGHT    = 3;
export const CALIBRATOR_CORNER_COL   = CALIBRATOR_LINE_COL_HLT;
export const CALIBRATOR_CORNER_WGHT  = 0.9 * CALIBRATOR_LINE_WGHT;

export const COLLISION_LINE_DEF  = 'white';
export const COLLISION_LINE_HLT  = 'red';
export const COLLISION_LINE_WGHT = 3;

export const SELECTION_RECT_COL  = 'rgba(150, 150, 150, 0.95)';
export const SELECTION_RECT_DASH = [4, 3];
export const SELECTION_RECT_WGHT = 2;

// Options for spot rendering
export const SPOT_COLS = _.map(
    _.range(0, 360, 360 / 8),
    x => `hsl(${x}, 100%, 50%)`,
);
export const SPOT_COL_DEF = _.first(SPOT_COLS);
export const SPOT_COL_HLT = 'hsl(140, 100%, 50%)';
export const SPOT_OPACITIES = _.range(0, 1.2, 0.2);
export const SPOT_OPACITY_DEF = SPOT_OPACITIES[
    Math.trunc(SPOT_OPACITIES.length / 2)];

// Options for the loading widget
export const LOADING_FPS = 60;
export const LOADING_TWEEN_TIME = 1000;
