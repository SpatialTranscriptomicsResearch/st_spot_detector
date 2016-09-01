// Some basic functions for x y objects
var Vec2 = (function() {
    return {
        fromValues: function(x, y) {
            return {x: x, y: y};
        },
        cap: function(vec2, lowerLimit, upperLimit) {
            if(lowerLimit) {
                vec2.x = Math.max(vec2.x, lowerLimit);
                vec2.y = Math.max(vec2.y, lowerLimit);
            }
            if(upperLimit) {
                vec2.x = Math.min(vec2.x, upperLimit);
                vec2.y = Math.min(vec2.y, upperLimit);
            }
            return vec2;
        },
        add: function(a, b) {
            // adds b to a and returns a
            return {x: a.x + b.x, y: a.y + b.y};
        },
        subtract: function(a, b) {
            // subtracts b from a and returns a
            return {x: a.x - b.x, y: a.y - b.y};
        },
        multiply: function(a, scalar) {
            // multiples every element in a with a scalar
            return {x: a.x * scalar, y: a.y * scalar};
        },
        divide: function(a, scalar) {
            // divides every element in a by a scalar
            return {x: a.x / scalar, y: a.y / scalar};
        },
        toString: function(a) {
            return "x: " + a.x + ", y: " + a.y;
        }
    }
})();
