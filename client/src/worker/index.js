/**
 * @module rendering-decoder
 */

/* eslint-env worker */

import _ from 'underscore';

import Filters from './filters';
import { Messages, Responses } from './return-codes';

let histogram;

function applyFilters(tile, filters, ...args) {
    _.each(
        _.filter(filters, _.compose(k => k in Filters, _.first)),
        ([k, v]) => { Filters[k].apply(tile.data, histogram, v); },
    );
    postMessage([Responses.SUCCESS, [tile, ...args]], [tile.data.buffer]);
}

function parseHistogram(histRaw) {
    const cumulative = a => _.tail(_.foldl(a, (acc, x) => acc.concat(_.last(acc) + x), [0]));
    const normalize = a => _.map(a, x => x / _.last(a));
    const cdf = _.compose(normalize, cumulative);

    histogram = _.map(_.range(3),
        _.compose(
            cdf,
            i => histRaw.slice(i * 256, (i + 1) * 256),
        ),
    );
}

onmessage = (e) => {
    const [msg, data] = e.data;
    switch (msg) {
    case Messages.AFLTR:
        applyFilters(...data);
        break;
    case Messages.GFLTR:
        postMessage([Responses.SUCCESS, [Object.keys(Filters)]]);
        break;
    case Messages.RGHST:
        parseHistogram(...data);
        postMessage([Responses.SUCCESS, [null]]);
        break;
    default:
        postMessage([Responses.FAILURE, [null]]);
        break;
    }
};
