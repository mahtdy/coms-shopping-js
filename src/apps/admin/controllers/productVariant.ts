import BaseController, { ControllerOptions } from "../../../core/mongoose-controller/controller";
import ProductVariantRepository from "../../../repositories/admin/productVariant/repository";
import { Get, Post, Put, Delete } from "../../../core/decorators/method";
import { Body, Query } from "../../../core/decorators/parameters";
import z from "zod";
import { Response } from "../../../core/controller";

export class ProductVariantController extends BaseController<any> {
    constructor(baseRoute: string, repo: ProductVariantRepository, options: ControllerOptions) {
        super(baseRoute, repo, options);
    }

    @Post("/create")
    async createVariant(@Body({ schema: z.any() }) data: any): Promise<Response> {
        const created = await this.repository.create(data);
        return { status: 200, data: created };
    }

    @Put("/update")
    async updateVariant(@Query({ destination: "id", schema: z.string() }) id: string, @Body({ schema: z.any() }) body: any): Promise<Response> {
        const updated = await this.repository.update(id, { $set: body });
        return { status: 200, data: updated };
    }

    @Get("/list")
    async list(@Query({ destination: "product", schema: z.string().optional() }) product?: string): Promise<Response> {
        const query: any = {};
        if (product) query.product = product;
        const items = await this.repository.findAll(query);
        return { status: 200, data: items };
    }

    @Delete("/delete")
    async deleteVariant(@Query({ destination: "id", schema: z.string() }) id: string): Promise<Response> {
        await this.repository.delete(id);
        return { status: 200 };
    }
}

const productVariant = new ProductVariantController("/admin/product-variant", new ProductVariantRepository(), { collectionName: "productVariant" });
export default productVariant;
