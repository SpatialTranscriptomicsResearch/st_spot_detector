// Some basic functions for x y objects
var Vec2 = (function() {
    return {
        Vec2: function(x, y) {
            if(x == undefined) {x = 0};
            if(y == undefined) {y = 0};
            return {x: x, y: y};
        },
        copy: function(vec2) {
            return this.Vec2(vec2.x, vec2.y);
        },
        clampD: function(v, d, l, u) {
            var v_ = this.copy(v);
            if(v[d] < l) v_[d] = l;
            else if(v[d] > u) v_[d] = u;
            return v_;
        },
        clamp: function(vec2, lowerLimit, upperLimit) {
            var newVec = this.clampD(vec2, 'x', lowerLimit, upperLimit);
            newVec = this.clampD(newVec, 'y', lowerLimit, upperLimit);
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
        length: function(a) {
            // returns length of given vector
            return Math.sqrt(a.x * a.x + a.y * a.y);
        },
        distanceBetween: function(a, b) {
            // returns distance between two points
            var dvec = this.subtract(a, b);
            return this.length(dvec);
        },
        angleBetween: function(a, b) {
            // returns angle from vector a to vector b
            var dotprod, lenprod, angle, sign;

            // Check if there exists constant c so that a = cb.
            // If we skip this step, we may run into numerical issues, getting
            // dotprod / lenprod > 1, thus returning NaN.
            if (a.x * b.y == a.y * b.x)
                return 0;

            dotprod = a.x * b.x + a.y * b.y;
            lenprod = this.length(a) * this.length(b);

            if (lenprod === 0)
                return 0;

            angle = Math.acos(dotprod / lenprod);
            sign = a.x * b.y - a.y * b.x > 0 ? 1 : -1;

            return sign * angle;
        },
        test2: function(v1, v2, fun) {
          return Vec2.Vec2(fun(v1.x, v2.x), fun(v1.y, v2.y));
        },
        all: function(v) {
          return v.x && v.y;
        },
        any: function(v) {
          return v.x || v.y;
        },
        vec2ToMathjs: function(v) {
          return math.matrix([[v.x], [v.y], [1]]);
        },
        mathjsToVec2: function(v) {
          var [x, y] = [
            math.subset(v, math.index(0, 0)),
            math.subset(v, math.index(1, 0))
          ];
          return Vec2.Vec2(x, y);
        }
    };
})();
