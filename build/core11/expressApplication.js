"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const application_1 = __importDefault(require("./application"));
const express_1 = __importDefault(require("express"));
const logger_1 = require("./express/logger");
const uploader_1 = __importStar(require("./express/middlewares/uploader"));
const userAuthenticator_1 = __importDefault(require("./mongoose-controller/auth/user/userAuthenticator"));
const content_1 = require("./part/content");
const http_1 = __importDefault(require("http"));
const dataParser = {
    "body": function (req, res, next, destination) {
        return destination != undefined ? req.body[destination] : req.body;
    },
    "files": function (req, res, next, destination) {
        var ff = req.files;
        return destination != undefined ? ff[destination] : {};
    },
    "query": function (req, res, next, destination) {
        return destination != undefined && destination != "params" ? req.query[destination] : req.query;
    },
    "param": function (req, res, next, destination) {
        return destination != undefined ? req.params[destination] : req.params;
    },
    "req": function (req, res, next, destination) {
        return req;
    },
    "res": function (req, res, next, destination) {
        return res;
    },
    "next": function (req, res, next, destination) {
        return next;
    },
    "session": function (req, res, next, destination) {
        return req.session;
    },
    "ip": function (req, res, next, destination) {
        return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    },
    "admin": function (req, res, next, destination) {
        var ss = req.session;
        return ss.admin;
    },
    "user": function (req, res, next, required) {
        var token = req.header("auth-token");
        var userAuthenticator = new userAuthenticator_1.default();
        try {
            var verify = userAuthenticator.isAuthenticate(token || "");
            if (typeof verify == typeof "") {
            }
            return verify;
        }
        catch (error) {
            if (required == false)
                return undefined;
            throw error;
        }
    },
    "header": function (req, res, next, destination) {
        return req.header(destination || "");
    },
    "fromReq": function (req, res, next, destination) {
        return req[destination || ""];
    },
};
class ExpressApplication extends application_1.default {
    constructor() {
        super();
        this.app = (0, express_1.default)();
        let contentPart = content_1.ContentPart.setInstance(this);
    }
    static getInstance() {
        if (!ExpressApplication.instance) {
            ExpressApplication.instance = new ExpressApplication();
        }
        return ExpressApplication.instance;
    }
    async bootstarp(port) {
        try {
            await this.preServe();
            this.serve();
            // this.app.listen(port, "0.0.0.0")
            console.log("runned");
            var httpServer = http_1.default.createServer(this.app);
            console.log(`listening on port ${port}`);
            httpServer.listen(port, () => {
                // connectionQueue()
            });
            return httpServer;
        }
        catch (error) {
            console.log("errror", error);
        }
    }
    serve() {
        var _a, _b, _c, _d;
        for (let i = 0; i < this.parts.length; i++) {
            let routes = this.parts[i].serve();
            for (let j = 0; j < routes.length; j++) {
                if ((_a = routes[j].meta) === null || _a === void 0 ? void 0 : _a.files) {
                    let files = (_b = routes[j].meta) === null || _b === void 0 ? void 0 : _b.files;
                    let filesToup = [];
                    for (let z = 0; z < files.length; z++) {
                        if (files[z].skip) {
                            continue;
                        }
                        filesToup.push(files[z]);
                    }
                    if (filesToup.length > 0) {
                        this.app.post(routes[j].route, (0, uploader_1.default)(filesToup));
                    }
                    for (let z = 0; z < files.length; z++) {
                        if (files[z].skip) {
                            continue;
                        }
                        if (files[z].mapToBody) {
                            this.app.use(routes[j].route, (0, uploader_1.mapUploadsToBody)(files[z].name));
                        }
                        if (files[z].moveFilesToCDN) {
                            this.app.use(routes[j].route, (0, uploader_1.moveFilesToCDN)(files[z].name, files[z].moveFilesToCDN.config));
                        }
                    }
                }
                if (routes[j].middlewares != undefined) {
                    this.app.use(routes[j].route, routes[j].middlewares || []);
                }
                // if(routes[j].route == "/user/ticket/message" && routes[j].method =="post"){
                //     console.log(routes[j].meta)
                // }
                var handler = new RequestHandler(routes[j].execs, (_c = routes[j].meta) === null || _c === void 0 ? void 0 : _c.params, routes[j].preExecs, routes[i].postExec);
                var func = handler.handle(routes[j].execs, (_d = routes[j].meta) === null || _d === void 0 ? void 0 : _d.params, routes[j].preExecs);
                switch (routes[j].method) {
                    case "post":
                        this.app.post(routes[j].route, func);
                        break;
                    case "get":
                        this.app.get(routes[j].route, func);
                        break;
                    case "delete":
                        this.app.delete(routes[j].route, func);
                        break;
                    case "put":
                        this.app.put(routes[j].route, func);
                        break;
                    default:
                        break;
                }
            }
        }
        this.servePlugins();
    }
    servePlugins() {
        var _a, _b, _c, _d;
        for (let i = 0; i < this.plugins.length; i++) {
            let routes = this.plugins[i].serve();
            for (let j = 0; j < routes.length; j++) {
                if ((_a = routes[j].meta) === null || _a === void 0 ? void 0 : _a.files) {
                    let files = (_b = routes[j].meta) === null || _b === void 0 ? void 0 : _b.files;
                    for (let z = 0; z < files.length; z++) {
                        if (files[z].skip) {
                            continue;
                        }
                        this.app.use(routes[j].route, (0, uploader_1.default)([
                            files[z]
                        ]));
                        if (files[z].mapToBody) {
                            this.app.use(routes[j].route, (0, uploader_1.mapUploadsToBody)(files[z].name));
                        }
                        if (files[z].moveFilesToCDN) {
                            this.app.use(routes[j].route, (0, uploader_1.moveFilesToCDN)(files[z].name, files[z].moveFilesToCDN.config));
                        }
                    }
                }
                if (routes[j].middlewares != undefined)
                    this.app.use(routes[j].route, routes[j].middlewares || []);
                var handler = new RequestHandler(routes[j].execs, (_c = routes[j].meta) === null || _c === void 0 ? void 0 : _c.params, routes[j].preExecs, routes[j].postExec);
                var func = handler.handle(routes[j].execs, (_d = routes[j].meta) === null || _d === void 0 ? void 0 : _d.params, routes[j].preExecs);
                switch (routes[j].method) {
                    case "post":
                        this.app.post(routes[j].route, func);
                        break;
                    case "get":
                        this.app.get(routes[j].route, func);
                        break;
                    case "delete":
                        this.app.delete(routes[j].route, func);
                        break;
                    case "put":
                        this.app.put(routes[j].route, func);
                        break;
                    default:
                        break;
                }
            }
        }
    }
    getRoute() {
        let routes;
        for (let i = 0; i < this.parts.length; i++) {
        }
    }
    addRoute(route) {
        var _a, _b, _c, _d;
        if ((_a = route.meta) === null || _a === void 0 ? void 0 : _a.files) {
            let files = (_b = route.meta) === null || _b === void 0 ? void 0 : _b.files;
            let filesToup = [];
            for (let z = 0; z < files.length; z++) {
                if (files[z].skip) {
                    continue;
                }
                filesToup.push(files[z]);
            }
            if (filesToup.length > 0)
                this.app.use(route.route, (0, uploader_1.default)(filesToup));
            for (let z = 0; z < files.length; z++) {
                if (files[z].skip) {
                    continue;
                }
                if (files[z].mapToBody) {
                    this.app.use(route.route, (0, uploader_1.mapUploadsToBody)(files[z].name));
                }
                if (files[z].moveFilesToCDN) {
                    this.app.use(route.route, (0, uploader_1.moveFilesToCDN)(files[z].name, files[z].moveFilesToCDN.config));
                }
            }
        }
        if (route.middlewares != undefined) {
            this.app.use(route.route, route.middlewares || []);
        }
        // if(route.route == "/user/ticket/message" && route.method =="post"){
        //     console.log(route.meta)
        // }
        var handler = new RequestHandler(route.execs, (_c = route.meta) === null || _c === void 0 ? void 0 : _c.params, route.preExecs, route.postExec);
        var func = handler.handle(route.execs, (_d = route.meta) === null || _d === void 0 ? void 0 : _d.params, route.preExecs);
        switch (route.method) {
            case "post":
                this.app.post(route.route, func);
                break;
            case "get":
                this.app.get(route.route, func);
                break;
            case "delete":
                this.app.delete(route.route, func);
                break;
            case "put":
                this.app.put(route.route, func);
                break;
            case "use":
                this.app.use("*", func);
                // console.log("add route")
                break;
            default:
                break;
        }
    }
    deleteRoute(path, method) {
    }
}
exports.default = ExpressApplication;
class RequestHandler {
    constructor(execs, meta, preExecs, postExecs) {
        this.meta = meta;
        this.execs = execs;
        this.preExecs = preExecs;
        this.postExecs = postExecs;
    }
    async handleReq(req, res, next) {
        var _a, _b, _c;
        var args = [];
        for (const key in this.meta) {
            try {
                if (this.meta[key].source) {
                    if (this.meta[key].source == "user") {
                        var data = dataParser[this.meta[key].source](req, res, next, this.meta[key].required);
                    }
                    else if (this.meta[key].source == "fromOwn") {
                        var data = this.meta[key].data;
                    }
                    else
                        var data = dataParser[this.meta[key].source](req, res, next, this.meta[key].destination);
                    if (this.meta[key].parseJson) {
                        try {
                            if (this.meta[key].isArray)
                                data = "[" + data + "]";
                            data = JSON.parse(data);
                        }
                        catch (error) {
                            console.log("err", error);
                        }
                    }
                    this.meta[key].schema != undefined ? args.push(this.meta[key].schema.parse(data)) : args.push(data);
                }
                else {
                    args.push(undefined);
                }
            }
            catch (error) {
                return res.status(400).json(error);
            }
        }
        try {
            // console.log("args" , args)
            var pp = await this.execs.apply(args, args);
            if (this.postExecs) {
                for (let i = 0; i < this.postExecs.length; i++) {
                    try {
                        let meta = ((_a = this.postExecs[i].meta) === null || _a === void 0 ? void 0 : _a.params) || {};
                        var args = [pp];
                        for (const key in meta) {
                            // if(meta[key].source == "admin" && req.session['admin'] == undefined){
                            //     return res.status(403).json({
                            //         message : "login"
                            //     })
                            // }
                            // console.log(this.meta[key])
                            var data = dataParser[meta[key].source](req, res, next, meta[key].destination);
                            try {
                                meta[key].schema != undefined ? args.push(meta[key].schema.parse(data)) : args.push(data);
                            }
                            catch (error) {
                                return res.status(400).json(error);
                            }
                        }
                        pp = await this.postExecs[i].func.apply(args, args);
                    }
                    catch (error) {
                    }
                }
            }
            if (pp.sent)
                return;
            if (pp.html) {
                // return res.json({
                //     "ok" : "true"
                // })
                try {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(pp.data);
                }
                catch (error) {
                    console.log("err", error);
                }
                return;
            }
            if (pp.responseHeader) {
                for (const key in pp.responseHeader) {
                    res.header(key, pp.responseHeader[key]);
                }
            }
            if (pp.isFilePath) {
                // return res.json({
                //     "ok" : "true"
                // })
                try {
                    res.sendFile(pp.data);
                }
                catch (error) {
                    console.log("err", error);
                }
                return;
            }
            if (pp.session) {
                if ((_b = pp.session.cookie) === null || _b === void 0 ? void 0 : _b.expire) {
                    req.session.cookie.expires = (_c = pp.session.cookie) === null || _c === void 0 ? void 0 : _c.expire;
                    delete pp.session.cookie;
                }
                Object.assign(req.session, pp.session);
                delete pp.session;
            }
            if (pp.next == true) {
                next();
                return;
            }
            if (pp.redirect) {
                res.redirect(pp.redirect);
                return;
            }
            if (pp.json === false) {
                return res.status(pp.status || 200).end(pp.data);
            }
            if (pp.justJson) {
                res.status(200).json(pp.data);
                return;
            }
            res.status(pp.status || 200).json(pp);
        }
        catch (error) {
            // console.log(error)
            res.status(500).json({
                error: error.message || ""
            });
            return res;
        }
    }
    handle(execs, meta, preExecs) {
        this.meta = meta;
        this.execs = execs;
        this.preExecs = preExecs;
        var funcs = [];
        if (preExecs) {
            for (let i = 0; i < preExecs.length || 0; i++) {
                funcs.push(async (req, res, next) => {
                    var _a, _b, _c, _d;
                    var args = [];
                    let meta = ((_a = preExecs[i].meta) === null || _a === void 0 ? void 0 : _a.params) || {};
                    for (const key in meta) {
                        if (((_c = (_b = this.meta) === null || _b === void 0 ? void 0 : _b[key]) === null || _c === void 0 ? void 0 : _c.source) == "fromOwn") {
                            var data = this.meta[key].data;
                        }
                        else if (meta[key].source == "user") {
                            try {
                                var data = dataParser[meta[key].source](req, res, next, meta[key].required);
                            }
                            catch (error) {
                            }
                        }
                        else
                            var data = dataParser[meta[key].source](req, res, next, meta[key].destination);
                        try {
                            meta[key].schema != undefined ? args.push(meta[key].schema.parse(data)) : args.push(data);
                        }
                        catch (error) {
                            return res.status(400).json(error);
                        }
                    }
                    try {
                        var pp = await preExecs[i].func.apply(this, args);
                        if (pp.sent)
                            return;
                        if (pp.next) {
                            next();
                            return;
                        }
                        if (pp.redirect) {
                            res.redirect(pp.redirect);
                            return;
                        }
                        if (pp.justJson) {
                            res.status(200).json(pp.data);
                            return;
                        }
                        if (this.postExecs) {
                            for (let i = 0; i < this.postExecs.length; i++) {
                                try {
                                    let meta = ((_d = this.postExecs[i].meta) === null || _d === void 0 ? void 0 : _d.params) || {};
                                    var args = [pp];
                                    for (const key in meta) {
                                        // if(meta[key].source == "admin" && req.session['admin'] == undefined){
                                        //     return res.status(403).json({
                                        //         message : "login"
                                        //     })
                                        // }
                                        var data = dataParser[meta[key].source](req, res, next, meta[key].destination);
                                        try {
                                            meta[key].schema != undefined ? args.push(meta[key].schema.parse(data)) : args.push(data);
                                        }
                                        catch (error) {
                                            return res.status(400).json(error);
                                        }
                                    }
                                    pp = await this.postExecs[i].func.apply(args, args);
                                }
                                catch (error) {
                                }
                            }
                        }
                        if (pp.html) {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(pp.data);
                            return;
                        }
                        if (pp.isFilePath) {
                            res.sendFile(pp.data);
                            return;
                        }
                        if (pp.session) {
                            req.session = pp.session;
                            delete pp.session;
                        }
                        res.status(pp.status || 200).json(pp);
                    }
                    catch (error) {
                        return res.json({ error });
                    }
                });
            }
        }
        funcs.push(async (req, res, next) => {
            return this.handleReq(req, res, next);
        });
        return funcs;
    }
}
__decorate([
    logger_1.logAction
], RequestHandler.prototype, "handleReq", null);
