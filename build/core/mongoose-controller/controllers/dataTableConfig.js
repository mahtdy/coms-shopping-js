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
exports.DataTableConfigController = void 0;
const repository_1 = __importDefault(require("../repositories/dataTableConfig/repository"));
const controller_1 = __importDefault(require("../controller"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const cache_1 = __importDefault(require("../../cache"));
class DataTableConfigController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    doPaginate(page, limit, reqQuery, admin, dataTable) {
        return this.paginate(page, limit, {
            admin: admin._id,
            dataTable
        }, {
            sort: this.getSort(reqQuery)
        });
    }
    create(data, admin) {
        data.admin = admin._id;
        return super.create(data);
    }
    async replace(id, data, admin) {
        data.admin = admin._id;
        return super.replaceOne({
            admin: admin._id,
            _id: id
        }, data, { ok: true });
    }
    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addRouteWithMeta("", "put", this.replace.bind(this), {
            "1": {
                index: 1,
                source: "body",
                schema: this.insertSchema
            }
        }),
            this.addRouteWithMeta("", "delete", this.delete.bind(this), {
                "1": {
                    index: 0,
                    source: "query",
                    schema: controller_1.default.id,
                    destination: "id"
                }
            });
        this.addRoute("es", "get", this.doPaginate.bind(this));
        // this.addRouteWithMeta("", "delete", this.delete.bind(this), {
        //     "1": {
        //         index: 0,
        //         source: "query",
        //         destination: "id",
        //         schema: BaseController.id
        //     },
        // })
    }
}
exports.DataTableConfigController = DataTableConfigController;
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Query)({})),
    __param(3, (0, parameters_1.Admin)()),
    __param(4, (0, parameters_1.Query)({
        destination: "dataTable",
        schema: zod_1.z.string().optional()
    }))
], DataTableConfigController.prototype, "doPaginate", null);
__decorate([
    __param(1, (0, parameters_1.Admin)())
], DataTableConfigController.prototype, "create", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Admin)())
], DataTableConfigController.prototype, "replace", null);
var dataTableConfig = new DataTableConfigController("/dataTableConfig", new repository_1.default({
    cacheService: new cache_1.default("dataTableConfig")
}), {
    insertSchema: zod_1.z.object({
        lable: zod_1.z.string(),
        dataTable: zod_1.z.string(),
        config: zod_1.z.any().default({}),
    })
});
exports.default = dataTableConfig;
