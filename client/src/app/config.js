/* eslint-disable import/prefer-default-export */
export const MAX_CACHE_SIZE = 104857600;
export const MAX_THREADS = 4;

export const WORKER_PATH = 'worker.js';

// Options for the aligner
export const ROT_POINT_COLOR_DEF = 'hsla(0,  80%, 50%, 0.6)';
export const ROT_POINT_COLOR_HLT = 'hsla(0, 100%, 80%, 1.0)';
export const ROT_POINT_LINE_WGHT = 7;
export const ROT_POINT_RADIUS = 10;

// Options for the calibrator
export const CALIBRATOR_LINE_COL_DEF = 'hsla(0, 0%, 100%, 0.3)';
export const CALIBRATOR_LINE_COL_HLT = 'hsla(0, 0%, 100%, 1.0)';
export const CALIBRATOR_LINE_DASH    = [];
export const CALIBRATOR_LINE_WGHT    = 4;
export const CALIBRATOR_CORNER_COL   = CALIBRATOR_LINE_COL_HLT;
export const CALIBRATOR_CORNER_WGHT  = 0.9 * CALIBRATOR_LINE_WGHT;

export const SELECTION_RECT_COL  = 'rgba(150, 150, 150, 0.95)';
export const SELECTION_RECT_DASH = [4, 3];
export const SELECTION_RECT_WGHT = 2;

// Options for spot rendering
export const SPOT_COL_DEF = 'hsl(  6, 78%, 57%)';
export const SPOT_COL_HLT = 'hsl(140, 63%, 42%)';
export const SPOT_OPACITY = '0.5';

// Options for the loading widget
export const LOADING_FPS = 60;
export const LOADING_TWEEN_TIME = 1000;
