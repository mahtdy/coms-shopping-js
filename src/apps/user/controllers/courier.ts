import Courier from "../../../repositories/admin/courier/model";
import BaseController from "../../../core/mongoose-controller/controller";
import CourierRepository from "../../../repositories/admin/courier/repository";
import z from "zod";
import { Get, Post, Put } from "../../../core/decorators/method";
import {Body, User} from "../../../core/decorators/parameters";
import { Response } from "../../../core/controller";

/**
 * Endpoints used by courier mobile/web app:
 * - update location
 * - get assigned route / stops
 * - accept/reject route
 * - mark stop as picked / delivered
 */

export default class UserCourierController {
    repo: CourierRepository;
    baseRoute: string;

    constructor(baseRoute = "/courier", repo = new CourierRepository()) {
        this.baseRoute = baseRoute;
        this.repo = repo;
    }

    initApis(app: any) {
        // Example: app.post(this.baseRoute + "/location", this.updateLocation.bind(this));
        // but we use decorators in project; keep methods here.
    }

    @Put("/location")
    async updateLocation(
        @Body({ destination: "courierId", schema: z.string() }) courierId: string,
        @Body({ destination: "lon", schema: z.coerce.number() }) lon: number,
        @Body({ destination: "lat", schema: z.coerce.number() }) lat: number
    ): Promise<{ ok: boolean }> {
        await this.repo.updateLocation(courierId, lon, lat);

        // push to socket.io (if available)
        try {
            const io = require("../../../core/realtime").io;
            if (io) {
                io.to(`courier-${courierId}`).emit("location:update", { lon, lat, updatedAt: new Date() });
            }
        } catch (e) {
            // ignore
        }

        return { ok: true };
    }

    @Get("/me")
    async getProfile(
        @Body({ destination: "courierId", schema: z.string() }) courierId: string
    ): Promise<any> {
        const doc = await this.repo.findById(courierId);
        return { ok: true, courier: doc };
    }

    @Post("/acceptRoute")
    async acceptRoute(
        @Body({ destination: "courierId", schema: z.string() }) courierId: string,
        @Body({ destination: "routeId", schema: z.string() }) routeId: string
    ) {
        // set route.status = in_progress and courier.status = on_trip
        const RouteModel = require("../../../repositories/admin/route/model").default;
        await RouteModel.updateOne({ _id: routeId }, { $set: { status: "in_progress", startedAt: new Date() } });
        await this.repo.editById(courierId, { $set: { status: "on_trip" } });
        return { ok: true };
    }

    @Post("/completeStop")
    async completeStop(
        @Body({ destination: "routeId", schema: z.string() }) routeId: string,
        @Body({ destination: "packageId", schema: z.string() }) packageId: string,
        @Body({ destination: "status", schema: z.string() }) status: string
    ) {
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
