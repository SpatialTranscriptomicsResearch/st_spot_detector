'use strict';

/* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
var keycodes = {
    left : [ 37, 65], // left,  a
    up   : [ 38, 87], // up,    w
    right: [ 39, 68], // right, d
    down : [ 40, 83], // down,  s
    zin  : [107, 69], // +,     e
    zout : [109, 81], // -,     q
    shift: [     16], // shift
    ctrl:  [     17], // ctrl
    esc:   [     27], // escape
    del:   [ 46,  8]  // delete, backspace
};

var keyevents = Object.freeze({"left": 1, "up": 2, "right": 3, "down": 4, "zin": 5, "zout": 6, "shift": 7, "ctrl": 8, "esc": 9, "del": 10});
