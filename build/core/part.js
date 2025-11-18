"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Part {
    constructor(route, options) {
        this.route = route;
        this.controllers = options.controllers || [];
        this.logInController = options.logInController;
    }
    addController(controller) {
        this.controllers.push(controller);
    }
    async initLanguages() {
        console.log("ddd", "initLanguages");
    }
    serve() {
        var routes = this.logInController != undefined ?
            this.logInController.serve().map((value, i) => {
                value.route = value.absolute == true ? value.route : this.route + value.route;
                if (value.absolute) {
                    console.log(value.route, this.route);
                }
                return value;
            }) : [];
        for (let i = 0; i < this.controllers.length; i++) {
            routes.push(...(this.controllers[i].serve()).map((value, j) => {
                var _a;
                if (value.loginRequired == false) {
                }
                else if (this.controllers[i].loginRequired) {
                    // if (value.middlewares == undefined) {
                    //     value.middlewares = []
                    // }
                    if (value.preExecs == undefined) {
                        value.preExecs = [];
                    }
                    if (this.logInController)
                        (_a = value.preExecs) === null || _a === void 0 ? void 0 : _a.unshift({
                            func: this.logInController.checkLogIn.bind(this.logInController), meta: {
                                params: {
                                    "1": {
                                        index: 0,
                                        source: "admin"
                                    }
                                }
                            }
                        });
                }
                value.route = value.absolute == true ? value.route : this.route + value.route;
                return value;
            }));
        }
        return routes;
    }
    getRoutes() {
        var routes = this.logInController != undefined ?
            this.logInController.serve().map((value, i) => {
                var _a, _b, _c;
                if (value.apiDoc == undefined) {
                    value.apiDoc = {};
                }
                if ((_a = this.logInController) === null || _a === void 0 ? void 0 : _a.tag) {
                    value.apiDoc.tags = [
                        (_b = this.logInController) === null || _b === void 0 ? void 0 : _b.tag
                    ];
                }
                else if (value.apiDoc.tags == undefined) {
                    value.apiDoc.tags = [
                        this.route + ((_c = this.logInController) === null || _c === void 0 ? void 0 : _c.baseRoute)
                    ];
                }
                return value;
            }) : [];
        for (let i = 0; i < this.controllers.length; i++) {
            routes.push(...(this.controllers[i].serve()).map((value, j) => {
                // value.apiDoc = this this.route+value.route
                if (value.apiDoc == undefined) {
                    value.apiDoc = {};
                }
                if (this.controllers[i].tag) {
                    value.apiDoc.tags = [
                        this.controllers[i].tag
                    ];
                }
                else if (value.apiDoc.tags == undefined) {
                    value.apiDoc.tags = [
                        this.route + this.controllers[i].baseRoute
                    ];
                }
                return value;
            }));
        }
        return routes;
    }
}
exports.default = Part;
