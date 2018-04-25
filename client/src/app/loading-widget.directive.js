/**
 * @module aligner.directive
 *
 * Directive for the loading widget.
 */

import $ from 'jquery';

import {
    LOADING_FPS as FPS,
    LOADING_TWEEN_TIME as TWEEN_TIME,
} from './config';

const STAGE = Object.freeze({
    INIT: 0,
    UPLOAD: 1,
    WAIT: 2,
    DOWNLOAD: 3,
});

async function animate(initialScene, cancel, animators, render) {
    const stepTime = 1000 / FPS;
    const step = async (prevScene, prevTime) => {
        if (cancel()) {
            return undefined;
        }
        const nextTime = prevTime + stepTime;
        const timeLeft = nextTime - Date.now();
        if (timeLeft > 0) {
            await new Promise(r => setTimeout(r, timeLeft));
        }
        const newScene = animators.reduce(
            (a, x) => x(a, prevTime, nextTime),
            prevScene,
        );
        render(newScene);
        return step(newScene, nextTime);
    };
    return step(initialScene, Date.now());
}

function getRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const coords = (x, y) => [canvas.width * x, canvas.height * y];

    const updateResolution = () => {
        /* eslint-disable no-param-reassign */
        canvas.width = $(canvas).width();
        canvas.height = $(canvas).height();
    };

    return ({ title, text, uploadProgress, downloadProgress }) => {
        updateResolution();

        ctx.clearRect(0, 0, ...coords(1, 1));

        ctx.textAlign = 'center';
        ctx.font = '1.0em bold sans';
        ctx.fillText(title, ...coords(0.5, 0.25));

        ctx.textAlign = 'center';
        ctx.font = '0.9em monospace';
        ctx.fillText(text, ...coords(0.5, 0.50));

        ctx.beginPath();
        ctx.moveTo(...coords(0.1, 0.75));
        ctx.lineTo(...coords(0.9, 0.75));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(...coords(0.9, 0.75));
        ctx.lineTo(...coords(0.9 - (0.8 * uploadProgress), 0.75));
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (downloadProgress > 0) {
            ctx.beginPath();
            ctx.moveTo(...coords(0.1, 0.75));
            ctx.lineTo(...coords(0.1 + (0.8 * downloadProgress), 0.75));
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    };
}

function getAnimators(state) {
    const fmtBytes = (n, [x, ...xs] = ['B', 'kB', 'MB']) => {
        if (xs.length === 0 || n < 1000) {
            return [n, x];
        }
        return fmtBytes(n / 1000, xs);
    };

    const fmtTime = (n) => {
        const m = Math.floor(n / 60);
        return [m, n - (60 * m)];
    };

    const showRateInfo = (rate, remaining) => {
        const [fmtRate, unit] = fmtBytes(rate);
        const [m, s] = fmtTime(remaining / rate);
        return [
            `${fmtRate.toFixed(2)} ${unit}/s`.padStart(11),
            `${m}:${`${Math.round(s)}`.padStart(2, '0')} left`,
        ].join(', ');
    };

    return [
        /* text animator */
        (scene) => {
            const title = (() => {
                switch (state.stage) {
                case STAGE.UPLOAD:
                    return 'Uploading';
                case STAGE.DOWNLOAD:
                    return 'Downloading';
                default:
                    return 'Waiting for response...';
                }
            })();
            const text = (() => {
                switch (state.stage) {
                case STAGE.UPLOAD:
                    return showRateInfo(
                        state.uploadSpeed,
                        state.uploadSize - state.uploaded,
                    );
                case STAGE.DOWNLOAD:
                    return showRateInfo(
                        state.downloadSpeed,
                        state.downloadSize - state.downloaded,
                    );
                default: {
                    const n = Math.trunc((Date.now() / 500)) % 20;
                    const m = n > 10 ? 20 - n : n;
                    return `[${' '.repeat(m)}*${' '.repeat(10 - m)}]`;
                }
                }
            })();
            return Object.assign(scene, { title, text });
        },

        /* progress bar animator */
        (scene, prevTime, time) => {
            const { uploadProgress, downloadProgress } = scene;
            const dt = Math.min((time - state.timestamp) / TWEEN_TIME, 1);
            const tweenProgress = (x, y) => {
                const d = y - x;
                return x + (d * (1 - ((1 - dt) ** 2)));
            };
            return Object.assign(scene, {
                uploadProgress: tweenProgress(
                    uploadProgress,
                    state.uploaded / Math.max(1, state.uploadSize),
                ),
                downloadProgress: tweenProgress(
                    downloadProgress,
                    state.downloaded / Math.max(1, state.downloadSize),
                ),
            });
        },
    ];
}

class State {
    constructor({
        canvas,
        initialStage,
    }) {
        this.canvas = canvas;
        this.stopped = false;
        this.stage = initialStage;
        this.uploaded = initialStage > STAGE.UPLOAD ? 1 : 0;
        this.uploadSize = this.uploaded;
        this.uploadSpeed = 0;
        this.downloaded = 0;
        this.downloadSize = 0;
        this.downloadSpeed = 0;
        this.timestamp = Date.now();
        this.animator = animate(
            {
                title: '',
                text: '',
                uploadProgress: initialStage > STAGE.UPLOAD,
                downloadProgress: 0,
            },
            () => this.stopped,
            getAnimators(this),
            getRenderer(this.canvas),
        );
    }
}

function loadingWidget() {
    return {
        link(scope, element) {
            scope.init = (initialStage = STAGE.INIT) => new State({
                canvas: $('<canvas>').appendTo(element)[0],
                initialStage,
            });

            scope.update = (state, {
                stage,
                loaded,
                total,
            }) => {
                const time = Date.now();
                state.stage = stage;
                switch (stage) {
                case STAGE.UPLOAD:
                    state.uploadSpeed =
                            (loaded - state.uploaded) *
                            (1000 / (time - state.timestamp));
                    state.uploaded = loaded;
                    state.uploadSize = total;
                    break;
                case STAGE.DOWNLOAD:
                    state.downloadSpeed =
                            (loaded - state.downloaded) *
                            (1000 / (time - state.timestamp));
                    state.downloaded = loaded;
                    state.downloadSize = total;
                    break;
                default:
                    break;
                }
                state.timestamp = time;
                return state;
            };

            scope.exit = async (state) => {
                state.stopped = true;
                await state.animator;
                $(state.canvas).remove();
            };
        },
        restrict: 'E',
        scope: {
            /* provides */
            exit: '=',
            init: '=',
            update: '=',
        },
    };
}

export default loadingWidget;
export { STAGE as LOAD_STAGE };
