"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expressApplication_1 = __importDefault(require("../expressApplication"));
const zod_openapi_1 = require("@anatine/zod-openapi");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
class Swageer {
    constructor() {
    }
    async init() {
        // console.log(this._config)
    }
    addComponent(key, conf) {
        var _a, _b;
        // console.log(this._config)
        // console.log(key)
        if (!this._config) {
            return;
        }
        if (!((_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.components) === null || _b === void 0 ? void 0 : _b.key)) {
            this._config.components[key] = {};
        }
        this._config.components[key] = Object.assign(this._config.components[key], conf);
    }
    setConfig(config) {
        this._config = config;
    }
    serve() {
        var routes = [];
        routes.push({
            execs: this.getJSON.bind(this),
            method: "get",
            route: "/apis",
            meta: Reflect.getMetadata("getJSON" + this.constructor.name, this)
        });
        routes.push({
            execs: this.getHTML.bind(this),
            method: "get",
            route: "/docs",
            meta: Reflect.getMetadata("getJSON" + this.constructor.name, this)
        });
        return routes;
    }
    getHTML() {
        return {
            data: fs_1.default.readFileSync("src/core/swagger/index.html").toString(),
            html: true,
            status: 200
        };
    }
    getJSON() {
        try {
            return {
                status: 200,
                justJson: true,
                // sent: true
                data: this.getApiJSON()
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    getStatics() {
    }
    getApiJSON() {
        var _a, _b;
        try {
            var apis = this._config;
            var routes = expressApplication_1.default.getInstance().getRoutes();
            var paths = {};
            var contentType;
            for (let i = 0; i < routes.length; i++) {
                var contentType = undefined;
                if (paths[routes[i].route] == undefined) {
                    paths[routes[i].route] = {};
                }
                paths[routes[i].route][routes[i].method] = Object.assign({
                    responses: {
                        "200": {
                            "description": "ok"
                        }
                    },
                }, routes[i].apiDoc || {});
                var zod = (_a = routes[i].meta) === null || _a === void 0 ? void 0 : _a.params;
                var bodyObj = undefined;
                for (const key in zod) {
                    if (routes[i].route == "/api/admin/systemConfigs/:lable" && routes[i].method == "post") {
                        // console.log(routes[i].route, routes[i].method, key, zod)
                    }
                    if (zod[key].source == "body") {
                        try {
                            var obj = (0, zod_openapi_1.generateSchema)(zod[key].schema);
                        }
                        catch (error) {
                            // console.log(routes[i].route ,routes[i].method,"err")
                            obj = {};
                        }
                        if (zod[key].destination != undefined) {
                            var k = (zod[key].destination || "");
                            if (bodyObj == undefined) {
                                bodyObj = {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                };
                            }
                            bodyObj['properties'][k] = obj;
                            try {
                                if (!((_b = zod[key].schema) === null || _b === void 0 ? void 0 : _b.isOptional())) {
                                    bodyObj.required.push(k);
                                }
                            }
                            catch (error) {
                            }
                        }
                        else {
                            bodyObj = obj;
                        }
                    }
                    if (zod[key].source == "query") {
                        try {
                            // console.log(zod[key].schema)
                            if (paths[routes[i].route][routes[i].method]['parameters'] == undefined) {
                                paths[routes[i].route][routes[i].method]['parameters'] = [];
                            }
                            if (zod[key].schema)
                                paths[routes[i].route][routes[i].method]['parameters'].push({
                                    in: "query",
                                    name: zod[key].destination || "params",
                                    schema: (0, zod_openapi_1.generateSchema)(zod[key].schema)
                                });
                        }
                        catch (error) {
                        }
                    }
                    if (zod[key].source == "param") {
                        try {
                            routes[i].route = routes[i].route.replace((":" + zod[key].destination) || "", `{${zod[key].destination}}` || "");
                            if (paths[routes[i].route] == undefined)
                                paths[routes[i].route] = {};
                            if (paths[routes[i].route][routes[i].method] == undefined) {
                                paths[routes[i].route][routes[i].method] = {};
                            }
                            if (paths[routes[i].route][routes[i].method]['parameters'] == undefined) {
                                paths[routes[i].route][routes[i].method]['parameters'] = [];
                            }
                            paths[routes[i].route][routes[i].method]['parameters'].push({
                                in: "path",
                                name: zod[key].destination,
                                schema: (0, zod_openapi_1.generateSchema)(zod[key].schema)
                            });
                        }
                        catch (error) {
                            console.log(routes[i].route, error.message, "******", routes[i].method, paths[routes[i].route]);
                        }
                    }
                    if (zod[key].source == "files") {
                        contentType = "multipart/form-data";
                        var obj = (0, zod_openapi_1.generateSchema)(zod_1.z.string());
                        obj['format'] = "binary";
                        if (zod[key].destination != undefined) {
                            var k = (zod[key].destination || "");
                            if (bodyObj == undefined) {
                                bodyObj = {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                };
                            }
                            if (!zod[key].schema) {
                                zod[key].schema = zod_1.z.any();
                            }
                            obj['required'] = !zod[key].schema.isOptional();
                            bodyObj['properties'][k] = obj;
                            if (!zod[key].schema.isOptional()) {
                                bodyObj.required.push(k);
                            }
                            else {
                                var index = bodyObj.required.findIndex((value, i) => {
                                    return value == k;
                                });
                                if (index != -1)
                                    bodyObj.required.splice(index, 1);
                            }
                        }
                        else {
                            bodyObj = obj;
                        }
                    }
                    if (zod[key].source == "header") {
                        if (paths[routes[i].route][routes[i].method]['parameters'] == undefined) {
                            paths[routes[i].route][routes[i].method]['parameters'] = [];
                        }
                        paths[routes[i].route][routes[i].method]['parameters'].push({
                            in: "header",
                            name: zod[key].destination || "params",
                            schema: (0, zod_openapi_1.generateSchema)(zod_1.z.string())
                        });
                    }
                }
                if (bodyObj != undefined) {
                    contentType = contentType == undefined ? routes[i].meta['contentType'] || "application/json" : contentType;
                    if (paths[routes[i].route] == undefined) {
                        paths[routes[i].route] = {};
                    }
                    if (!paths[routes[i].route][routes[i].method]) {
                        paths[routes[i].route][routes[i].method] = {};
                    }
                    paths[routes[i].route][routes[i].method]['requestBody'] = {
                        content: {}
                    };
                    paths[routes[i].route][routes[i].method]['requestBody']['content'][contentType] = {
                        "schema": bodyObj
                    };
                }
            }
            apis.paths = paths;
            // var routes.
            // return Object.assign(this._config, ExpressApplication.getInstance().getRoutes())
            return apis;
        }
        catch (error) {
            console.log("error");
            throw error;
        }
    }
    static getInstance() {
        if (!Swageer.instance) {
            Swageer.instance = new Swageer();
        }
        else {
            console.log(this.instance);
        }
        return Swageer.instance;
    }
}
exports.default = Swageer;
