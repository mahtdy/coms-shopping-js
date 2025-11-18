"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import BaseController from "./controller";
const axios_1 = __importDefault(require("axios"));
const controller_1 = __importDefault(require("../controller"));
class ProxyController extends controller_1.default {
    constructor(baseRoute, agent) {
        super(baseRoute);
        this.agent = agent;
        for (const route of this.agent.routes) {
            const handler = async function (...args) {
                var _a, _b;
                const { query, body } = this.resolveData(args, route.mapper);
                const targetUrl = this.agent.url + this.baseRoute + route.url;
                try {
                    const response = await axios_1.default.request({
                        url: targetUrl,
                        method: route.method,
                        params: query,
                        data: body
                    });
                    var data = response.data;
                    if (route.exec != undefined) {
                        data = await route.exec(data);
                    }
                    return {
                        status: response.status,
                        data
                    };
                }
                catch (error) {
                    return {
                        status: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500,
                        message: error.message,
                        data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data
                    };
                }
            };
            Object.defineProperty(handler, 'name', { value: `proxy_${route.method}_${route.url}`, configurable: true });
            this.addRouteWithMeta(route.url, route.method, handler.bind(this), route.routeMeta);
        }
    }
    resolveData(args, mapper) {
        let body = {};
        let query = {};
        for (let i = 0; i < mapper.length; i++) {
            if (mapper[i].index < args.length) {
                if (mapper[i].name != undefined) {
                    mapper[i].to == "query" ? query[mapper[i].name || ""] = args[mapper[i].index] : body[mapper[i].name || ""] = args[mapper[i].index];
                }
                else if (args[mapper[i].index]) {
                    mapper[i].to == "query" ? query = args[mapper[i].index] : body = args[mapper[i].index];
                }
            }
        }
        return {
            body,
            query
        };
    }
}
exports.default = ProxyController;
