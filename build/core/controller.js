"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataKeys = void 0;
require("reflect-metadata");
const parameters_1 = require("./decorators/parameters");
class Controller {
    constructor(baseRoute, apiDoc) {
        var _a;
        this.baseRoute = baseRoute;
        this.apiDoc = apiDoc;
        var classConf = Reflect.getMetadata("routes" + this.constructor.name, this) || {};
        this.routes = ((_a = classConf.routes) === null || _a === void 0 ? void 0 : _a.map((value, i) => {
            if (!value.absolute)
                value.route = this.baseRoute + value.route;
            value.execs = value.execs.bind(this);
            return value;
        })) || [];
        if (classConf.preExecs) {
            for (let i = 0; i < classConf.preExecs.length; i++) {
                this.addPreExecs(classConf.preExecs[i].route, classConf.preExecs[i].method, classConf.preExecs[i].execs.bind(this));
            }
        }
    }
    addRoute(route, method, execs, options) {
        // console.log(options?.preExecs)
        // console.log(route,execs)
        route = this.baseRoute + route;
        this.routes.push({
            route,
            execs,
            method,
            preExecs: options === null || options === void 0 ? void 0 : options.preExecs,
            middlewares: options === null || options === void 0 ? void 0 : options.middlewares
        });
        var name = execs.name.replace("bound ", "");
        var confs = Reflect.getMetadata(name + this.constructor.name, this) || {};
        if (route.includes("/create/test"))
            console.log(name, confs, name + this.constructor.name);
        if (options === null || options === void 0 ? void 0 : options.meta) {
            if (!confs.params) {
                confs.params = {};
            }
            confs.params = Object.assign(confs.params, options.meta);
        }
        if (options === null || options === void 0 ? void 0 : options.contentType) {
            confs['contentType'] = options.contentType;
        }
        Reflect.defineMetadata(name + this.constructor.name, confs, this);
    }
    addMiddlewares(route, method, middleware) {
        var _a;
        // console.log(options?.preExecs)
        var index = this.routes.findIndex((value, i) => {
            return value.route == route && value.method == method;
        });
        if (index != -1) {
            if (!this.routes[index].middlewares) {
                this.routes[index].middlewares = [];
            }
            (_a = this.routes[index].middlewares) === null || _a === void 0 ? void 0 : _a.push(middleware);
        }
    }
    addAbsoluteRoute(route, method, execs, options) {
        // console.log(options?.preExecs)
        // route = this.baseRoute + route
        this.routes.push({
            route,
            execs,
            method,
            preExecs: options === null || options === void 0 ? void 0 : options.preExecs,
            middlewares: options === null || options === void 0 ? void 0 : options.middlewares
        });
        var name = execs.name.replace("bound ", "");
        var confs = Reflect.getMetadata(name + this.constructor.name, this) || {};
        if (options === null || options === void 0 ? void 0 : options.meta) {
            if (!confs.params) {
                confs.params = {};
            }
            confs.params = Object.assign(confs.params, options.meta);
        }
        if (options === null || options === void 0 ? void 0 : options.contentType) {
            confs['contentType'] = options.contentType;
        }
        Reflect.defineMetadata(name + this.constructor.name, confs, this);
    }
    exclude(route, method) {
        var index = this.routes.findIndex((value, i) => {
            return value.route == route && value.method == method;
        });
        if (index != -1)
            this.routes.splice(index, 1);
    }
    addRouteWithMeta(route, method, execs, routeMeta) {
        if (!routeMeta.absolute) {
            route = this.baseRoute + route;
        }
        // if (typeof execs == "function") {
        var name = execs.name.replace("bound ", "");
        var confs = Reflect.getMetadata(name + this.constructor.name, this) || {};
        for (const key in routeMeta) {
            confs = (0, parameters_1.setMeta)({
                index: routeMeta[key].index,
                source: routeMeta[key].source,
                destination: routeMeta[key].destination,
                schema: routeMeta[key].schema,
                parseJson: routeMeta[key].parseJson,
                config: routeMeta[key].config,
                mapToBody: routeMeta[key].mapToBody,
                exclude: routeMeta[key].exclude,
                isArray: routeMeta[key].isArray,
                required: routeMeta[key].required
            }, confs);
        }
        Reflect.defineMetadata(name + this.constructor.name, confs, this);
        // }
        this.routes.push({
            route,
            execs,
            method
        });
    }
    addPreExecs(route, method, preExec) {
        var _a;
        route = this.baseRoute + route;
        var index = this.routes.findIndex((value, i) => {
            return value.route == route && value.method == method;
        });
        if (index != -1) {
            if (!this.routes[index].preExecs) {
                this.routes[index].preExecs = [];
            }
            (_a = this.routes[index].preExecs) === null || _a === void 0 ? void 0 : _a.push({
                func: preExec
            });
        }
    }
    serve() {
        var middlewares = Reflect.getMetadata("middlewares" + this.constructor.name, this) || {};
        var logRoutes = Reflect.getMetadata("logRoutes" + this.constructor.name, this) || {};
        this.routes.forEach(element => {
            var name = element.execs.name.replace("bound ", "");
            // console.log(name)
            if (middlewares[name]) {
                if (!element.middlewares) {
                    element.middlewares = [];
                }
                element.middlewares.push(...middlewares[name]);
            }
            element.log = logRoutes[name];
            var confs = Reflect.getMetadata(name + this.constructor.name, this);
            // console.log(name)
            element.meta = confs;
            if (element.preExecs) {
                for (let i = 0; i < element.preExecs.length; i++) {
                    if (!element.preExecs[i].meta) {
                        var name = element.preExecs[i].func.name.replace("bound ", "");
                        var confs = Reflect.getMetadata(name + this.constructor.name, this);
                        element.preExecs[i].meta = confs;
                    }
                }
            }
            if (this.apiDoc) {
                element.apiDoc = Object.assign(this.apiDoc, element.apiDoc);
            }
            return element;
        });
        return this.routes;
        // return 
    }
}
exports.default = Controller;
var MetadataKeys;
(function (MetadataKeys) {
    MetadataKeys["BASE_PATH"] = "base_path";
    MetadataKeys["ROUTERS"] = "routers";
})(MetadataKeys || (exports.MetadataKeys = MetadataKeys = {}));
function logParam(target, methodKey, parameterIndex) {
    target.test = methodKey;
    // and parameterIndex says which parameter
}
