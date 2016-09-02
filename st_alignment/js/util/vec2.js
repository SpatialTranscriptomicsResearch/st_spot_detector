// Some basic functions for x y objects
var Vec2 = (function() {
    return {
        fromValues: function(x, y) {
            return {x: x, y: y};
        },
        copy: function(vec2) {
            return {x: vec2.x, y: vec2.y};
        },
        clampX: function(vec2, lowerLimit, upperLimit) {
            var newVec = this.copy(vec2);
            if(lowerLimit) {
                newVec.x = Math.max(vec2.x, lowerLimit);
            }
            if(upperLimit) {
                newVec.x = Math.min(vec2.x, upperLimit);
            }
            return newVec;
        },
        clampY: function(vec2, lowerLimit, upperLimit) {
            var newVec = this.copy(vec2);
            if(lowerLimit) {
                newVec.y = Math.max(vec2.y, lowerLimit);
            }
            if(upperLimit) {
                newVec.y = Math.min(vec2.y, upperLimit);
            }
            return newVec;
        },
        clamp: function(vec2, lowerLimit, upperLimit) {
            var newVec = clampX(vec2, lowerLimit, upperLimit);
            newVec = clampY(newVec, lowerLimit, upperLimit);
            return newVec;
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
