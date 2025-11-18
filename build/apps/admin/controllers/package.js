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
exports.AdminPackageController = void 0;
const controller_1 = require("../../../core/mongoose-controller/basePage/controller");
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const repository_1 = __importDefault(require("../../../repositories/admin/package/repository"));
// import CourierRepository from "../../../repositories/admin/courier/repository";
const controller_2 = __importDefault(require("../../../core/mongoose-controller/controller"));
const zod_1 = __importDefault(require("zod"));
const repository_2 = __importDefault(require("../../../core/mongoose-controller/repositories/admin/repository"));
const login_1 = require("../login");
class AdminPackageController extends controller_2.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.repo = repo;
    }
    initApis() {
        super.initApis();
        // additional admin endpoints
    }
    // constructor() {
    //     super({
    //         insertSchema: z.object({
    //             recipientName: z.string(),
    //             recipientPhone: z.string(),
    //             destination: z.object({
    //                 lat: z.number(),
    //                 lng: z.number(),
    //                 address: z.string(),
    //             }),
    //         }),
    //         collectionName: "package",
    //     });
    // }
    // تخصیص بسته به پیک
    async assignPackage(courierId, packageIds) {
        return this.editById(courierId, { $set: { courier: courierId, status: "assigned" } }, { ok: true });
    }
}
exports.AdminPackageController = AdminPackageController;
__decorate([
    (0, method_1.Post)("/assign"),
    __param(0, (0, parameters_1.Body)({ destination: "courierId", schema: controller_2.default.id })),
    __param(1, (0, parameters_1.Body)({ destination: "packageIds", schema: zod_1.default.array(controller_2.default.id) }))
], AdminPackageController.prototype, "assignPackage", null);
const insertSchema = zod_1.default.object({
    recipientName: zod_1.default.string(),
    recipientPhone: zod_1.default.string(),
    destination: zod_1.default.object({
        lat: zod_1.default.number(),
        lng: zod_1.default.number(),
        address: zod_1.default.string()
    }),
}).merge(controller_1.basePageZod);
const packageAdmin = new AdminPackageController("/admin/package", new repository_1.default(), {
    insertSchema,
    searchFilters: {
        _id: ["eq", "list", "nin"],
        name: ["eq", "reg"],
        phone: ["eq", "list"],
        status: ["eq", "list"],
    },
    collectionName: "courier",
    isAdminPaginate: true,
    adminRepo: new repository_2.default({ model: login_1.AdminModel }),
});
exports.default = packageAdmin;
