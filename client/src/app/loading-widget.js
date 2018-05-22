/**
 * @module aligner.directive
 *
 * Directive for the loading widget.
 */

import $ from 'jquery';
import _ from 'lodash';

import {
    LOADING_FPS as FPS,
    LOADING_HIST_SIZE as HIST_SIZE,
    LOADING_MEASURE_TIME as MEASURE_TIME,
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

        ctx.textAlign = 'left';
        ctx.font = '1.0em bold sans';
        ctx.fillText(title, ...coords(0.1, 0.4));

        ctx.textAlign = 'right';
        ctx.font = '0.9em monospace';
        ctx.fillText(text, ...coords(0.9, 0.4));

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

    const computeRate = () => {
        const lagged = _.first(_.map(
            _.takeRightWhile(
                state.history,
                s => s.stage === state.stage &&
                    s.timestamp > state.timestamp - MEASURE_TIME,
            ),
            s => [s.timestamp, s.loaded],
        ));
        if (lagged) {
            const [laggedTime, laggedLoaded] = lagged;
            return (state.loaded - laggedLoaded) *
                (1000 / (state.timestamp - laggedTime));
        }
        return 0;
    };

    const showRateInfo = () => {
        const rate = computeRate();
        const remaining = state.total - state.loaded;
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
                    return `${state.title}: Uploading`;
                case STAGE.DOWNLOAD:
                    return `${state.title}: Downloading`;
                default:
                    return `${state.title}: ${state.message}`;
                }
            })();
            const text = (() => {
                switch (state.stage) {
                case STAGE.UPLOAD:
                case STAGE.DOWNLOAD:
                    return showRateInfo();
                default: {
                    const n = Math.trunc((Date.now() / 500)) % 20;
                    const m = n > 10 ? 20 - n : n;
                    return `[${' '.repeat(m)}○${' '.repeat(10 - m)}]`;
                }
                }
            })();
            return Object.assign(scene, { title, text });
        },

        /* progress bar animator */
        (scene, prevTime, time) => {
            const { uploadProgress, downloadProgress } = scene;
            const dt = Math.min((time - state.timestamp) / TWEEN_TIME, 1);
            const tweenFnc = _.curry((x, y) => x + ((y - x) * (1 - ((1 - dt) ** 2))));
            const tweenFncPartial = tweenFnc(_, state.loaded / Math.max(1, state.total));
            return Object.assign(scene, {
                uploadProgress: state.stage === STAGE.UPLOAD
                    ? tweenFncPartial(uploadProgress)
                    : state.stage > STAGE.UPLOAD,
                downloadProgress: state.stage === STAGE.DOWNLOAD
                    ? tweenFncPartial(downloadProgress)
                    : state.stage > STAGE.DOWNLOAD,
            });
        },
    ];
}

class State {
    constructor({ canvas, title }) {
        this.title = title;
        this.canvas = canvas;
        this.stopped = false;
        this.stage = STAGE.INIT;
        this.message = 'Please wait...';
        this.loaded = 0;
        this.total = 1;
        this.timestamp = Date.now();
        this.animator = animate(
            {
                title: '',
                text: '',
                uploadProgress: 0,
                downloadProgress: 0,
            },
            () => this.stopped,
            getAnimators(this),
            getRenderer(this.canvas),
        );
        this.history = [];
    }
}

function create(element, title) {
    const canvas = $('<canvas>');
    return [
        new State({ canvas: canvas[0], title }),
        canvas,
    ];
}

function update(widget, data) {
    const { stage } = data;
    const time = Date.now();

    const oldState = _.clone(widget);
    widget.history = _.clone(widget.history);
    widget.history.push(oldState);
    if (widget.history.length > HIST_SIZE) {
        widget.history.shift();
    }
    widget.timestamp = time;
    widget.stage = stage;

    switch (stage) {
    case STAGE.UPLOAD:
    case STAGE.DOWNLOAD:
        widget.loaded = data.loaded;
        widget.total = data.total;
        break;
    case STAGE.WAIT:
        widget.message = data.message;
        break;
    default:
        break;
    }

    return widget;
}

async function stop(widget) {
    widget.stopped = true;
    await widget.animator;
}

export { create, update, stop };
export { STAGE as LOAD_STAGE };
