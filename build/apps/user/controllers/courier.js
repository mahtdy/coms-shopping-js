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
const repository_1 = __importDefault(require("../../../repositories/admin/courier/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
/**
 * Endpoints used by courier mobile/web app:
 * - update location
 * - get assigned route / stops
 * - accept/reject route
 * - mark stop as picked / delivered
 */
class UserCourierController {
    constructor(baseRoute = "/courier", repo = new repository_1.default()) {
        this.baseRoute = baseRoute;
        this.repo = repo;
    }
    initApis(app) {
        // Example: app.post(this.baseRoute + "/location", this.updateLocation.bind(this));
        // but we use decorators in project; keep methods here.
    }
    async updateLocation(courierId, lon, lat) {
        await this.repo.updateLocation(courierId, lon, lat);
        // push to socket.io (if available)
        try {
            const io = require("../../../core/realtime").io;
            if (io) {
                io.to(`courier-${courierId}`).emit("location:update", { lon, lat, updatedAt: new Date() });
            }
        }
        catch (e) {
            // ignore
        }
        return { ok: true };
    }
    async getProfile(courierId) {
        const doc = await this.repo.findById(courierId);
        return { ok: true, courier: doc };
    }
    async acceptRoute(courierId, routeId) {
        // set route.status = in_progress and courier.status = on_trip
        const RouteModel = require("../../../repositories/admin/route/model").default;
        await RouteModel.updateOne({ _id: routeId }, { $set: { status: "in_progress", startedAt: new Date() } });
        await this.repo.editById(courierId, { $set: { status: "on_trip" } });
        return { ok: true };
    }
    async completeStop(routeId, packageId, status) {
        // A minimal implementation: update route stop arrival and package status
        const RouteRepository = require("../../../repositories/admin/route/repository").default;
        const PackageModel = require("../../../repositories/admin/package/model").default;
        // mark package delivered/failed
        await PackageModel.updateOne({ _id: packageId }, { $set: { status } });
        // update route stop (simplified)
        await RouteRepository.prototype.markStopAsComplete(routeId, packageId);
        return { ok: true };
    }
}
exports.default = UserCourierController;
__decorate([
    (0, method_1.Put)("/location"),
    __param(0, (0, parameters_1.Body)({ destination: "courierId", schema: zod_1.default.string() })),
    __param(1, (0, parameters_1.Body)({ destination: "lon", schema: zod_1.default.coerce.number() })),
    __param(2, (0, parameters_1.Body)({ destination: "lat", schema: zod_1.default.coerce.number() }))
], UserCourierController.prototype, "updateLocation", null);
__decorate([
    (0, method_1.Get)("/me"),
    __param(0, (0, parameters_1.Body)({ destination: "courierId", schema: zod_1.default.string() }))
], UserCourierController.prototype, "getProfile", null);
__decorate([
    (0, method_1.Post)("/acceptRoute"),
    __param(0, (0, parameters_1.Body)({ destination: "courierId", schema: zod_1.default.string() })),
    __param(1, (0, parameters_1.Body)({ destination: "routeId", schema: zod_1.default.string() }))
], UserCourierController.prototype, "acceptRoute", null);
__decorate([
    (0, method_1.Post)("/completeStop"),
    __param(0, (0, parameters_1.Body)({ destination: "routeId", schema: zod_1.default.string() })),
    __param(1, (0, parameters_1.Body)({ destination: "packageId", schema: zod_1.default.string() })),
    __param(2, (0, parameters_1.Body)({ destination: "status", schema: zod_1.default.string() }))
], UserCourierController.prototype, "completeStop", null);
