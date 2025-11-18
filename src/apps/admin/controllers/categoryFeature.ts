import BaseController, { ControllerOptions } from "../../../core/mongoose-controller/controller";
import BaseRepositoryService, {RepositoryConfigOptions} from "../../../core/mongoose-controller/repository"; // یا repository مخصوص اگر خواستی
import CategoryFeature  from "../../../repositories/admin/categoryFeature/model";
import { Get, Post, Put, Delete } from "../../../core/decorators/method";
import { Body, Query } from "../../../core/decorators/parameters";
import z from "zod";
import { Response } from "../../../core/controller";
import {AddressModel} from "../../../repositories/admin/address/model";
import CategoryFeatureRepository from "../../../repositories/admin/categoryFeature/repository";

// export default class CategoryFeature extends BaseRepositoryService<CategoryFeature> {
//     // constructor() { super(CategoryFeatureModel, {}); }
//     constructor(options?: RepositoryConfigOptions) {
//         super(CategoryFeatureModel, options);
//     }

export class CategoryFeatureController extends BaseController<CategoryFeature> {
    constructor(baseRoute: string, repo: CategoryFeatureRepository, options: ControllerOptions) {
        super(baseRoute, repo, options);
    }
    initApis() {
        super.initApis();
        // this.addRoute("/test2", "get", this.test2.bind(this))
        // this.addRouteWithMeta("/test/paginate2", "get", this.testPagination.bind(this), BaseController.paginateMeta)

        // this.exclude("/product" , "delete")
    }

    // @Post("")
    // async create(@Body({ schema: z.any() }) data: any): Promise<Response> {
    //     const created = await this.repository.create(data);
    //     return { status: 200, data: created };
    // }

    @Put("")
    async update(
        @Query({ destination: "id", schema: z.string() }) id: string,
        @Body({ schema: z.any() }) body: any): Promise<Response> {
        const updated = await this.repository.update(id, { $set: body });
        return { status: 200, data: updated };
    }

    // @Get("/list")
    // async list(@Query({ destination: "category", schema: z.string().optional() }) category?: string): Promise<Response> {
    //     const q: any = {};
    //     if (category) q.category = category;
    //     const items = await this.repository.findAll(q);
    //     return { status: 200, data: items };
    // }

    // @Delete("/delete")
    // async delete(@Query({ destination: "id", schema: z.string() }) id: string): Promise<Response> {
    //     await this.repository.delete(id);
    //     return { status: 200 };
    // }
}

const categoryFeature = new CategoryFeatureController("/admin/category-feature", new CategoryFeatureRepository(), { collectionName: "categoryFeature" });
export default categoryFeature;
