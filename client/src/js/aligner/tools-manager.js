/**
 * @module tools-manager
 */

/**
 * Tools manager for the aligner. Manages the editing tools, such as 'Move' and 'Rotate', in the
 * aligner.
 */
class ToolsManager {
    constructor(callback) {
        this.callback = callback;
        this.tools = new Map();
        this.curtool = -1;
        return this;
    }

    addTool(name, options) {
        if (this.tools.has(name)) {
            throw new Error(`A tool with name ${name} already exists!`);
        }
        this.tools.set(name, options);
        return this;
    }

    deleteTool(name) {
        if (!this.tools.has(name)) {
            throw new Error(`A tool with name '${name}' does not exist!`);
        }
        this.tools.delete(name);
    }

    getTools() {
        return Array.from(this.tools.keys());
    }

    options(name, options) {
        if (!this.tools.has(name)) {
            throw new Error(`Invalid tool name '${name}'.`);
        }
        if (arguments.length === 1) {
            return this.tools.get(name);
        }
        this.tools.set(name, options);
        return this;
    }

    activeTool(name) {
        if (!arguments.length) {
            return this.curtool;
        }
        if (!this.tools.has(name)) {
            throw new Error(`Invalid tool name '${name}'.`);
        }
        this.curtool = name;
        if ('onActive' in this.options(name)) {
            this.options(name).onActive();
        }
        this.callback();
        return this;
    }
}

export default ToolsManager;
