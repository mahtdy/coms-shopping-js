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
exports.ChestController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/chest/repository"));
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
class ChestController extends controller_1.default {
    constructor(path, repository, options) {
        super(path, repository, options);
    }
    async edit(id, chest) {
        try {
            return await this.editById(id, {
                $set: chest
            }, {
                ok: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getById(id) {
        try {
            return await this.findById(id);
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("es/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("es/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.ChestController = ChestController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            enabled: zod_1.z.boolean()
        })
    }))
], ChestController.prototype, "edit", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], ChestController.prototype, "getById", null);
const chest = new ChestController("/chest", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        enabled: zod_1.z.boolean(),
        inventry: zod_1.z.coerce.number().min(0),
        isTankhah: zod_1.z.boolean(),
    }),
    searchFilters: {
        title: ["eq", "reg"],
        enabled: ["eq"],
        inventory: ["eq", "gte", "lte"],
        isTankhah: ["eq"],
    }
});
exports.default = chest;
