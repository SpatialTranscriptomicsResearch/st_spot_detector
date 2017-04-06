// Some basic functions for x y objects
const Vec2 = (function() {
    return {
        Vec2: function(x, y) {
            if(x == undefined) {x = 0};
            if(y == undefined) {y = 0};
            return {x: x, y: y};
        },
        copy: function(vec2) {
            return this.Vec2(vec2.x, vec2.y);
        },
        clampX: function(vec2, lowerLimit, upperLimit) {
            var newVec = this.copy(vec2);
            if(lowerLimit != undefined) {
                newVec.x = Math.max(vec2.x, lowerLimit);
            }
            if(upperLimit != undefined) {
                newVec.x = Math.min(vec2.x, upperLimit);
            }
            return newVec;
        },
        clampY: function(vec2, lowerLimit, upperLimit) {
            var newVec = this.copy(vec2);
            if(lowerLimit != undefined) {
                newVec.y = Math.max(vec2.y, lowerLimit);
            }
            if(upperLimit != undefined) {
                newVec.y = Math.min(vec2.y, upperLimit);
            }
            return newVec;
        },
        clamp: function(vec2, lowerLimit, upperLimit) {
            var newVec = this.clampX(vec2, lowerLimit, upperLimit);
            newVec = this.clampY(newVec, lowerLimit, upperLimit);
            return newVec;
        },
        truncate: function(vec2) {
            // truncates each value
            return this.Vec2(Math.trunc(vec2.x), Math.trunc(vec2.y));
        },
        round: function(vec2) {
            // rounds each value
            return this.Vec2(Math.round(vec2.x), Math.round(vec2.y));
        },
        add: function(a, b) {
            // adds b to a and returns a
            return this.Vec2(a.x + b.x, a.y + b.y);
        },
        subtract: function(a, b) {
            // subtracts b from a and returns a
            return this.Vec2(a.x - b.x, a.y - b.y);
        },
        multiply: function(a, b) {
            // multiples x elements and y elements separately
            return this.Vec2(a.x * b.x, a.y * b.y);
        },
        divide: function(a, b) {
            // divides x elements and y elements separately
            return this.Vec2(a.x / b.x, a.y / b.y);
        },
        scale: function(a, scalar) {
            // multiples every element in a with a scalar
            return this.Vec2(a.x * scalar, a.y * scalar);
        },
        toString: function(a) {
            return "x: " + a.x + ", y: " + a.y;
        },
        distanceBetween: function(a, b) {
            // returns distance between two vectors
            var w = a.x - b.x;
            var h = a.y - b.y;
            return Math.sqrt(w * w + h * h);
        },
    }
})();

export default Vec2;
