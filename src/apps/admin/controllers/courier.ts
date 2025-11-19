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
import DeliveryService from "../../services/deliveryService";

// Admin controller for courier management
export class AdminCourierController extends BasePageController<Courier> {
    repo: CourierRepository;
    deliveryService: DeliveryService;

    constructor(baseRoute: string, repo: CourierRepository, options: ControllerOptions) {
        super(baseRoute, repo, options);
        this.repo = repo;
        // کامنت: استفاده از سرویس ارسال برای مدیریت بسته‌ها
        this.deliveryService = new DeliveryService();
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
     * توضیح فارسی: تخصیص بسته‌ها به پیک
     * این متد بسته‌ها را به یک پیک تخصیص می‌دهد.
     */
    @Post("/assign", {})
    async assignPackages(
        @Body({
            schema: z.object({
                courierId: BaseController.id,
                packageIds: z.array(BaseController.id),
            })
        })
        data: { courierId: string; packageIds: string[] }
    ): Promise<Response> {
        try {
            const results = [];
            
            // کامنت: تخصیص هر بسته به پیک
            for (const packageId of data.packageIds) {
                try {
                    const result = await this.deliveryService.assignPackageToCourier(
                        packageId,
                        data.courierId
                    );
                    results.push({
                        packageId,
                        success: true,
                        package: result.package,
                    });
                } catch (error: any) {
                    results.push({
                        packageId,
                        success: false,
                        error: error.message || "خطا در تخصیص بسته",
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;
            
            return {
                status: 200,
                message: `${successCount} از ${data.packageIds.length} بسته با موفقیت تخصیص داده شد.`,
                data: {
                    total: data.packageIds.length,
                    success: successCount,
                    failed: data.packageIds.length - successCount,
                    results,
                },
            };
        } catch (error: any) {
            return {
                status: 500,
                message: error.message || "خطا در تخصیص بسته‌ها",
            };
        }
    }

    /**
     * توضیح فارسی: تخصیص خودکار بسته به نزدیک‌ترین پیک
     */
    @Post("/auto-assign", {})
    async autoAssignPackage(
        @Body({
            schema: z.object({
                packageId: BaseController.id,
            })
        })
        data: { packageId: string }
    ): Promise<Response> {
        try {
            const result = await this.deliveryService.autoAssignPackage(data.packageId);
            
            return {
                status: 200,
                message: "بسته با موفقیت به پیک تخصیص داده شد.",
                data: {
                    package: result.package,
                    courier: result.courier,
                },
            };
        } catch (error: any) {
            if (error?.status) {
                return {
                    status: error.status,
                    message: error.message,
                };
            }
            throw error;
        }
    }

    /**
     * توضیح فارسی: دریافت لیست بسته‌های یک پیک
     */
    @Get("/packages", {})
    async getCourierPackages(
        @Query({destination: "courierId", schema: BaseController.id}) courierId: string,
        @Query({destination: "status", schema: z.string().optional()}) status?: string
    ): Promise<Response> {
        try {
            const packages = await this.deliveryService.getCourierPackages(
                courierId,
                status as any
            );
            
            return {
                status: 200,
                data: packages,
            };
        } catch (error: any) {
            return {
                status: 500,
                message: error.message || "خطا در دریافت بسته‌ها",
            };
        }
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
