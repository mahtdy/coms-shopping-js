"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Application {
    constructor(parts) {
        this.parts = parts || [];
        this.plugins = [];
        this.preServeExtra = function () { };
    }
    async bootstarp(port) {
        console.log("application");
    }
    addRoute(route) {
    }
    async preServe() {
        this.preServeExtra();
        for (let i = 0; i < this.plugins.length; i++) {
            await this.plugins[i].init();
        }
    }
    async addPlugin(plugin) {
        this.plugins.push(plugin);
    }
    addPart(part) {
        this.parts.push(part);
    }
    getPart(route) {
        for (let i = 0; i < this.parts.length; i++) {
            if (this.parts[i].route == route)
                return this.parts[i];
        }
    }
    getRoutes() {
        var routes = [];
        for (let i = 0; i < this.plugins.length; i++) {
            routes.push(...this.plugins[i].serve());
        }
        for (let i = 0; i < this.parts.length; i++) {
            routes.push(...this.parts[i].getRoutes());
        }
        return routes;
    }
    serve() {
        for (let i = 0; i < this.parts.length; i++) {
            this.parts[i].serve();
        }
    }
}
exports.default = Application;
