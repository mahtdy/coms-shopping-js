import Courier, {CourierModel} from "../../../repositories/admin/courier/model";
import BaseController, {ControllerOptions} from "../../../core/mongoose-controller/controller";
import CourierRepository from "../../../repositories/admin/courier/repository";
import z from "zod";
import {Response} from "../../../core/controller";
import {Get, Post, Put} from "../../../core/decorators/method";
import {Admin, Body, Query} from "../../../core/decorators/parameters";
import AdminRepository from "../../../core/mongoose-controller/repositories/admin/repository";
import {AdminModel} from "../../../apps/admin/login";
import {basePageZod, BasePageController} from "../../../core/mongoose-controller/basePage/controller";
import {AdminInfo} from "../../../core/mongoose-controller/auth/admin/admin-logIn";

// Admin controller for courier management
export class AdminCourierController extends BasePageController<Courier> {
    repo: CourierRepository;

    constructor(baseRoute: string, repo: CourierRepository, options: ControllerOptions) {
        super(baseRoute, repo, options);
        this.repo = repo;
    }

    initApis() {
        super.initApis();
        // additional admin endpoints
    }

    // Override create to log admin
    create(data: Courier, @Admin() admin: AdminInfo): Promise<Response> {
        // attach createdBy or admin meta if you want
        (data as any).meta = {createdBy: admin?._id || null};
        return super.create(data, admin);
    }

    /**
     * Update courier location manually from admin panel (useful for tests)
     */
    @Put("/location", { /* absolute: true */})
    async updateLocation(
        @Query({destination: "id", schema: BaseController.id}) id: string,
        @Body({destination: "lon", schema: z.coerce.number()}) lon: number,
        @Body({destination: "lat", schema: z.coerce.number()}) lat: number
    ) {
        await this.repo.updateLocation(id, lon, lat);
        return {ok: true};
    }

    /**
     * Assign packages to courier (simple assign, real optimization is in worker)
     * payload: { courierId, packageIds: [] }
     */
    @Post("/assign", {})
    async assignPackages(
        @Body({destination: "courierId", schema: BaseController.id}) courierId: string,
        @Body({destination: "packageIds", schema: z.array(BaseController.id)}) packageIds: string[]
    ) {
        // Here: simple DB update to set assignedTo on packages.
        // Ideally use PackageRepository; keep it generic to avoid circular deps.
        const PackageModel = require("../../../repositories/admin/package/model").default;
        const res = await PackageModel.updateMany(
            {_id: {$in: packageIds}},
            {$set: {assignedTo: courierId, status: "assigned"}}
        );
        return {ok: true, modified: res.nModified || res.modifiedCount || 0};
    }

    /**
     * Start optimize job (enqueue)
     * This is a stub that enqueues a background job to do real optimization.
     */
    @Post("/optimize", {})
    async optimize(
        @Body({destination: "date", schema: z.string().optional()}) date?: string
    ) {
        // enqueue a job on BullMQ / RabbitMQ (example stub)
        // const queue = require("../../../core/queue").optimizationQueue;
        // await queue.add("optimize-routes", { date: date || new Date().toISOString() });

        // For now just return started true
        return {ok: true, started: true, date: date || new Date().toISOString()};
    }
}

const insertSchema =
    z.object({
        name: z.string().min(1),
        phone: z.string().min(6),
        vehicle: z.string().optional(),
        capacity: z.object({
            count: z.coerce.number().int().positive().default(60),
            weightKg: z.coerce.number().optional(),
        }).optional(),
        shift: z.object({
            start: z.string().default("08:00"),
            end: z.string().default("18:00"),
        }).optional(),
        status: z.enum(["available", "on_trip", "break", "offline"]).default("available"),
    })
        .merge(basePageZod);

const courierAdmin = new AdminCourierController(
    "/admin/courier",
    new CourierRepository(),
    {
        insertSchema,
        searchFilters: {
            _id: ["eq", "list", "nin"],
            name: ["eq", "reg"],
            phone: ["eq", "list"],
            status: ["eq", "list"],
        },
        collectionName: "courier",
        isAdminPaginate: true,
        adminRepo: new AdminRepository({model: AdminModel}),
    }
);

export default courierAdmin;
