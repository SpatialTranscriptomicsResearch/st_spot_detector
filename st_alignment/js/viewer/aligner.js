var Aligner = class {
    constructor(layerMod, updateFunc) {
        this.active_layer = 'he';
        this.rotation = 0;
        this.translation = Vec2.Vec2(0, 0);

        this.layerMod = layerMod;
        this.update = updateFunc;
    }

    move(diff) {
        this.translation = Vec2.subtract(this.translation, diff);
        var upd = {};
        upd[this.active_layer] = { 'trans': this.translation };
        this.update(upd);
    }
};
