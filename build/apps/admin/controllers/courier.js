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
exports.AdminCourierController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/courier/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const repository_2 = __importDefault(require("../../../core/mongoose-controller/repositories/admin/repository"));
const login_1 = require("../../../apps/admin/login");
const controller_2 = require("../../../core/mongoose-controller/basePage/controller");
// Admin controller for courier management
class AdminCourierController extends controller_2.BasePageController {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.repo = repo;
    }
    initApis() {
        super.initApis();
        // additional admin endpoints
    }
    // Override create to log admin
    create(data, admin) {
        // attach createdBy or admin meta if you want
        data.meta = { createdBy: (admin === null || admin === void 0 ? void 0 : admin._id) || null };
        return super.create(data, admin);
    }
    /**
     * Update courier location manually from admin panel (useful for tests)
     */
    async updateLocation(id, lon, lat) {
        await this.repo.updateLocation(id, lon, lat);
        return { ok: true };
    }
    /**
     * Assign packages to courier (simple assign, real optimization is in worker)
     * payload: { courierId, packageIds: [] }
     */
    async assignPackages(courierId, packageIds) {
        // Here: simple DB update to set assignedTo on packages.
        // Ideally use PackageRepository; keep it generic to avoid circular deps.
        const PackageModel = require("../../../repositories/admin/package/model").default;
        const res = await PackageModel.updateMany({ _id: { $in: packageIds } }, { $set: { assignedTo: courierId, status: "assigned" } });
        return { ok: true, modified: res.nModified || res.modifiedCount || 0 };
    }
    /**
     * Start optimize job (enqueue)
     * This is a stub that enqueues a background job to do real optimization.
     */
    async optimize(date) {
        // enqueue a job on BullMQ / RabbitMQ (example stub)
        // const queue = require("../../../core/queue").optimizationQueue;
        // await queue.add("optimize-routes", { date: date || new Date().toISOString() });
        // For now just return started true
        return { ok: true, started: true, date: date || new Date().toISOString() };
    }
}
exports.AdminCourierController = AdminCourierController;
__decorate([
    __param(1, (0, parameters_1.Admin)())
], AdminCourierController.prototype, "create", null);
__decorate([
    (0, method_1.Put)("/location", { /* absolute: true */}),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({ destination: "lon", schema: zod_1.default.coerce.number() })),
    __param(2, (0, parameters_1.Body)({ destination: "lat", schema: zod_1.default.coerce.number() }))
], AdminCourierController.prototype, "updateLocation", null);
__decorate([
    (0, method_1.Post)("/assign", {}),
    __param(0, (0, parameters_1.Body)({ destination: "courierId", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({ destination: "packageIds", schema: zod_1.default.array(controller_1.default.id) }))
], AdminCourierController.prototype, "assignPackages", null);
__decorate([
    (0, method_1.Post)("/optimize", {}),
    __param(0, (0, parameters_1.Body)({ destination: "date", schema: zod_1.default.string().optional() }))
], AdminCourierController.prototype, "optimize", null);
const insertSchema = zod_1.default.object({
    name: zod_1.default.string().min(1),
    phone: zod_1.default.string().min(6),
    vehicle: zod_1.default.string().optional(),
    capacity: zod_1.default.object({
        count: zod_1.default.coerce.number().int().positive().default(60),
        weightKg: zod_1.default.coerce.number().optional(),
    }).optional(),
    shift: zod_1.default.object({
        start: zod_1.default.string().default("08:00"),
        end: zod_1.default.string().default("18:00"),
    }).optional(),
    status: zod_1.default.enum(["available", "on_trip", "break", "offline"]).default("available"),
})
    .merge(controller_2.basePageZod);
const courierAdmin = new AdminCourierController("/admin/courier", new repository_1.default(), {
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
exports.default = courierAdmin;
