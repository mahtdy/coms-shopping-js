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
exports.POS_DeviceController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/posDevice/repository"));
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
class POS_DeviceController extends controller_1.default {
    constructor(path, repository, options) {
        super(path, repository, options);
    }
    findById(id, queryInfo) {
        return super.findOne({
            _id: id
        }, {
            population: [{
                    path: "bankAccount"
                }]
        });
    }
    async edit(id, posDeviceData) {
        return await this.editById(id, posDeviceData, {
            ok: true
        });
    }
    async delete(id, ...params) {
        try {
            let posDevice = await this.repository.findById(id);
            if ((posDevice === null || posDevice === void 0 ? void 0 : posDevice.canDelete) == false) {
                return {
                    status: 400,
                    message: "حذف امکان پذیر نمی باشد"
                };
            }
        }
        catch (error) {
            throw error;
        }
        return super.delete(id);
    }
    paginate(page, limit, query, options, ...params) {
        return super.paginate(page, limit, query, {
            population: [{
                    path: "bankAccount",
                    select: ["title", "bank"]
                }]
        });
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("es/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.POS_DeviceController = POS_DeviceController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id }))
], POS_DeviceController.prototype, "findById", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string().optional(),
            enabled: zod_1.z.boolean().optional(),
            bankAccount: controller_1.default.id.optional(),
            // other fields...
        })
    }))
], POS_DeviceController.prototype, "edit", null);
const posDevice = new POS_DeviceController("/pos-device", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        serialNumber: zod_1.z.string(),
        enabled: zod_1.z.boolean().default(true),
        bankAccount: controller_1.default.id,
    }),
    searchFilters: {
        title: ["reg", "eq"],
        enabled: ["eq"],
        bankAccount: ["eq"],
        _id: ["eq", "list"]
    },
    population: [{
            path: "bankAccount",
            // select: ["title" , "bank"]
        }]
});
exports.default = posDevice;
