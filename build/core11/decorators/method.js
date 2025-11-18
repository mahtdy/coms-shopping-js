"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = Post;
exports.Get = Get;
exports.PreExec = PreExec;
exports.Delete = Delete;
exports.Put = Put;
exports.Middleware = Middleware;
exports.Log = Log;
require("reflect-metadata");
function Post(path, options) {
    return function (target, propertyKey, descriptor) {
        // var self : Controller = this
        var classConf = Reflect.getMetadata("routes" + target.constructor.name, target) || {};
        if (!classConf.routes) {
            classConf.routes = [];
        }
        classConf.routes.push({
            method: "post",
            route: path,
            execs: descriptor.value,
            absolute: options === null || options === void 0 ? void 0 : options.absolute,
            loginRequired: options === null || options === void 0 ? void 0 : options.loginRequired,
            apiDoc: options === null || options === void 0 ? void 0 : options.apiDoc,
            preExecs: options === null || options === void 0 ? void 0 : options.preExecs
        });
        Reflect.defineMetadata("routes" + target.constructor.name, classConf, target);
        var confs = Reflect.getMetadata(propertyKey + target.constructor.name, target) || {};
        if (options === null || options === void 0 ? void 0 : options.loginRequired) {
            confs['loginRequired'] = true;
        }
        if (options === null || options === void 0 ? void 0 : options.contentType) {
            // console.log(descriptor.value.name )
            confs['contentType'] = options.contentType;
        }
        Reflect.defineMetadata(propertyKey + target.constructor.name, confs, target);
        return descriptor;
    };
}
function Get(path, options) {
    return function (target, propertyKey, descriptor) {
        if (path == "/draft") {
            console.log(target, propertyKey);
        }
        var classConf = Reflect.getMetadata("routes" + target.constructor.name, target) || {};
        if (!classConf.routes) {
            classConf.routes = [];
        }
        classConf.routes.push({
            method: "get",
            route: path,
            execs: descriptor.value,
            absolute: options === null || options === void 0 ? void 0 : options.absolute,
            loginRequired: options === null || options === void 0 ? void 0 : options.loginRequired,
            apiDoc: options === null || options === void 0 ? void 0 : options.apiDoc,
            preExecs: options === null || options === void 0 ? void 0 : options.preExecs
        });
        Reflect.defineMetadata("routes" + target.constructor.name, classConf, target);
        var confs = Reflect.getMetadata(propertyKey + target.constructor.name, target) || {};
        if (options === null || options === void 0 ? void 0 : options.loginRequired) {
            confs['loginRequired'] = true;
        }
        Reflect.defineMetadata(propertyKey + target.constructor.name, confs, target);
        return descriptor;
    };
}
function PreExec(options) {
    return function (target, propertyKey, descriptor) {
        var classConf = Reflect.getMetadata("routes" + target.constructor.name, target) || {};
        if (!classConf.preExecs) {
            classConf.preExecs = [];
        }
        classConf.preExecs.push({
            method: options.method,
            route: options.route,
            execs: descriptor.value,
        });
        Reflect.defineMetadata("routes" + target.constructor.name, classConf, target);
        var confs = Reflect.getMetadata(propertyKey + target.constructor.name, target) || {};
        if (options === null || options === void 0 ? void 0 : options.loginRequired) {
            confs['loginRequired'] = true;
        }
        Reflect.defineMetadata(propertyKey + target.constructor.name, confs, target);
        return descriptor;
    };
}
function Delete(path, options) {
    return function (target, propertyKey, descriptor) {
        var classConf = Reflect.getMetadata("routes" + target.constructor.name, target) || {};
        if (!classConf.routes) {
            classConf.routes = [];
        }
        classConf.routes.push({
            method: "delete",
            route: path,
            execs: descriptor.value,
            absolute: options === null || options === void 0 ? void 0 : options.absolute,
            loginRequired: options === null || options === void 0 ? void 0 : options.loginRequired,
            apiDoc: options === null || options === void 0 ? void 0 : options.apiDoc,
            preExecs: options === null || options === void 0 ? void 0 : options.preExecs
        });
        Reflect.defineMetadata("routes" + target.constructor.name, classConf, target);
        var confs = Reflect.getMetadata(propertyKey + target.constructor.name, target) || {};
        if (options === null || options === void 0 ? void 0 : options.loginRequired) {
            confs['loginRequired'] = true;
        }
        if (options === null || options === void 0 ? void 0 : options.contentType) {
            confs['contentType'] = options.contentType;
        }
        Reflect.defineMetadata(propertyKey + target.constructor.name, confs, target);
        return descriptor;
    };
}
function Put(path, options) {
    return function (target, propertyKey, descriptor) {
        var classConf = Reflect.getMetadata("routes" + target.constructor.name, target) || {};
        if (!classConf.routes) {
            classConf.routes = [];
        }
        classConf.routes.push({
            method: "put",
            route: path,
            execs: descriptor.value,
            absolute: options === null || options === void 0 ? void 0 : options.absolute,
            loginRequired: options === null || options === void 0 ? void 0 : options.loginRequired,
            apiDoc: options === null || options === void 0 ? void 0 : options.apiDoc,
            preExecs: options === null || options === void 0 ? void 0 : options.preExecs
        });
        Reflect.defineMetadata("routes" + target.constructor.name, classConf, target);
        var confs = Reflect.getMetadata(propertyKey + target.constructor.name, target) || {};
        if (options === null || options === void 0 ? void 0 : options.loginRequired) {
            confs['loginRequired'] = true;
        }
        if (options === null || options === void 0 ? void 0 : options.contentType) {
            confs['contentType'] = options.contentType;
        }
        Reflect.defineMetadata(propertyKey + target.constructor.name, confs, target);
        return descriptor;
    };
}
function Middleware(func) {
    return function (target, propertyKey, descriptor) {
        // self.addRoute(path, "post",descriptor.value.bind(self))
        var classConf = Reflect.getMetadata("middlewares", target) || {};
        if (!classConf[propertyKey]) {
            classConf[propertyKey] = [];
        }
        typeof func == "function" ? classConf[propertyKey].push(func) : classConf[propertyKey].push(...func);
        Reflect.defineMetadata("middlewares", classConf, target);
    };
}
function Log(target, propertyKey, descriptor) {
    // self.addRoute(path, "post",descriptor.value.bind(self))
    var classConf = Reflect.getMetadata("logRoutes", target) || {};
    if (!classConf[propertyKey]) {
        classConf[propertyKey] = true;
    }
    Reflect.defineMetadata("logRoutes", classConf, target);
}
;
