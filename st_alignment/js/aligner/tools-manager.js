/* tools-manager.js
 * -----------------------------------------------------------------------------
 *  Simple manager for layer tools.
 *
 *  TODO:
 *  1. Add documentation
 *  2. Make it possible to pass varargs to callback
 */

var ToolsManager = class {
  constructor(callback) {
    this._callback = callback;
    this._tools = new Map();
    this._curtool = -1;
    return this;
  }

  addTool(name, options) {
    if (this._tools.has(name))
      throw "Tool " + name + " already exists!";
    this._tools.set(name, options);
    return this;
  }

  // TODO: implement
  deleteTool(name) {}

  getTools() {
    var ret = [];
    for (var tool of this._tools.keys())
      ret.push(tool);
    return ret;
  }

  options(name, options) {
    if (!this._tools.has(name))
      throw "Invalid tool " + name + ".";
    if (arguments.length == 1)
      return this._tools.get(name);
    this._tools.set(name, options);
    return this;
  }

  activeTool(name) {
    if (!arguments.length)
      return this._curtool;
    if (!this._tools.has(name))
      throw "Invalid tool name " + name + ".";
    this._curtool = name;
    if ('onActive' in this.options(name))
      this.options(name).onActive();
    this._callback();
    return this;
  }
};
