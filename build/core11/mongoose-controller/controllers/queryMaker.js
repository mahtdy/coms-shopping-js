"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryMakerController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/queryMaker/repository"));
const zod_1 = require("zod");
const contentRegistry_1 = __importDefault(require("../contentRegistry"));
const queryTranslate = {
    "list": (data) => {
        return {
            "$in": data
        };
    },
    "eq": (data) => {
        return {
            "$eq": data
        };
    },
    "reg": (data) => {
        return {
            "$reg": new RegExp(data)
        };
    },
    "gte": (data) => {
        return {
            "$gte": data
        };
    },
    "lte": (data) => {
        return {
            "$lte": data
        };
    },
};
class QueryMakerController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.contentRegistry = contentRegistry_1.default.getInstance();
    }
    initApis() {
    }
    async addQuery(repoName, data) {
        data['repoName'] = repoName;
        return this.create(data);
    }
    async testQuery(_id, reqQuery) {
        var _a, _b, _c;
        try {
            const q = await this.repository.findById(_id);
            if (q == null) {
                return {
                    status: 404
                };
            }
            const repo = this.contentRegistry.getRegistry(q.repoName);
            if (repo == undefined) {
                return {
                    status: 404
                };
            }
            var sort = {};
            if (q.sort)
                sort[(_a = q.sort) === null || _a === void 0 ? void 0 : _a.key] = (_b = q.sort) === null || _b === void 0 ? void 0 : _b.type;
            return {
                data: await ((_c = repo.repo) === null || _c === void 0 ? void 0 : _c.getBlockData(this.getExecutable(q, repo, reqQuery), q.limit, 1, {
                    sort,
                    projection: repo.selectData
                })),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    getExecutable(q, repo, reqQuery) {
        let query = {};
        if (q.exact != undefined) {
            let key = repo.defaultExact || "";
            query[key] = {};
            query[key]["$in"] = q.exact.data;
            return query;
        }
        var ands = [];
        if (q.query) {
            for (let i = 0; i < q.query.length; i++) {
                let newQuery = {};
                newQuery[q.query[i].field] = queryTranslate[q.query[i].filter](q.query[i].data);
                ands.push(newQuery);
            }
        }
        if (q.fromOwn) {
            for (let i = 0; i < q.fromOwn.length; i++) {
                let newQuery = {};
                if (q.fromOwn[i]['dataFrom'] == "own") {
                    newQuery[q.fromOwn[i].field] = queryTranslate[q.fromOwn[i].filter](reqQuery[q.fromOwn[i]['foreign']]);
                }
                else {
                    newQuery[q.fromOwn[i].field] = queryTranslate[q.fromOwn[i].filter](q.fromOwn[i].data);
                }
                ands.push(newQuery);
            }
        }
        if (ands.length == 0)
            return query;
        if (ands.length == 1)
            return ands[0];
        query["$and"] = ands;
        return query;
    }
    async getQueries(repoName, preset, page, limit, title) {
        try {
            var query = {
                repoName,
                preset
            };
            if (title) {
                query['title'] = {
                    $reg: new RegExp(title)
                };
            }
            return this.paginate(page, limit, query);
        }
        catch (error) {
            throw error;
        }
    }
    async getQuery(repoName) {
        let data = this.contentRegistry.getRegistry(repoName);
        delete data['repo'];
        return {
            status: 200,
            data
        };
    }
}
exports.QueryMakerController = QueryMakerController;
__decorate([
    (0, method_1.Post)("/query/:repoName"),
    __param(0, (0, parameters_1.Param)({
        destination: "repoName",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            sort: zod_1.z.object({
                key: zod_1.z.string(),
                type: zod_1.z.enum(["-1", "1"])
            }),
            limit: controller_1.default.limit,
            query: zod_1.z.array(zod_1.z.object({
                field: zod_1.z.string(),
                filter: zod_1.z.enum(["eq", "list", "reg", "gte", "lte"]),
                data: zod_1.z.any()
            })).optional(),
            exact: zod_1.z.object({
                filter: zod_1.z.enum(["eq", "list"]),
                data: zod_1.z.any()
            }).optional(),
            fromOwn: zod_1.z.array(zod_1.z.object({
                field: zod_1.z.string(),
                filter: zod_1.z.enum(["eq", "list", "reg", "gte", "lte"]),
                data: zod_1.z.array(zod_1.z.string()).optional(),
                dataFrom: zod_1.z.enum(["own", "static"]),
                foreign: zod_1.z.string().optional()
            })).optional()
        }),
    }))
], QueryMakerController.prototype, "addQuery", null);
__decorate([
    (0, method_1.Get)("/test"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        schema: controller_1.default.search
    }))
], QueryMakerController.prototype, "testQuery", null);
__decorate([
    (0, method_1.Get)("/queries/:repoName"),
    __param(0, (0, parameters_1.Param)({
        destination: "repoName",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "preset",
        schema: controller_1.default.booleanFromquery.default("false")
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(4, (0, parameters_1.Query)({
        destination: "title$reg",
        schema: zod_1.z.string().optional()
    }))
], QueryMakerController.prototype, "getQueries", null);
__decorate([
    (0, method_1.Get)("/config"),
    __param(0, (0, parameters_1.Query)({
        destination: "repoName",
        schema: zod_1.z.string()
    }))
], QueryMakerController.prototype, "getQuery", null);
const queryMaker = new QueryMakerController("/query-maker", new repository_1.default());
exports.default = queryMaker;
