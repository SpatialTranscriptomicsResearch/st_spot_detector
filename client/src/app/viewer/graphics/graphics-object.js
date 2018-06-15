export default class GraphicsObject {
    constructor() {
        if (new.target === GraphicsObject) {
            throw new TypeError('Call of new on abstract class GraphicsObject not allowed.');
        }
    }
}
