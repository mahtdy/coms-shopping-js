import {BasePageController, basePageZod} from "../../../core/mongoose-controller/basePage/controller";
import {Get, Post} from "../../../core/decorators/method";
import {Response} from "../../../core/controller";
import Package, {PackageModel} from "../../../repositories/admin/package/model";
import {Admin, Body, Query} from "../../../core/decorators/parameters";
import PackageRepository from "../../../repositories/admin/package/repository";
// import CourierRepository from "../../../repositories/admin/courier/repository";

import BaseController, {ControllerOptions} from "../../../core/mongoose-controller/controller";
import z from "zod";
import AdminRepository from "../../../core/mongoose-controller/repositories/admin/repository";
import {AdminModel} from "../login";

export class AdminPackageController extends BaseController<Package> {
    repo: PackageRepository;

    constructor(baseRoute: string, repo: PackageRepository, options: ControllerOptions) {
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
    @Post("/assign")
    async assignPackage(
        @Body({destination: "courierId", schema: BaseController.id}) courierId: string,
        @Body({destination: "packageIds", schema: z.array(BaseController.id)}) packageIds: string[]
    ): Promise<Response> {
        return this.editById(
            courierId,
            {$set: {courier: courierId, status: "assigned"}},
            {ok: true}
        );
    }
}

const insertSchema =
    z.object({
        recipientName: z.string(),
        recipientPhone: z.string(),
        destination: z.object({
            lat: z.number(),
            lng: z.number(),
            address: z.string()
        }),
    }).merge(basePageZod);

const packageAdmin = new AdminPackageController(
    "/admin/package",
    new PackageRepository(),
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
export default packageAdmin;
