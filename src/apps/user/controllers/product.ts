import {Get} from "../../../core/decorators/method";
import BaseController, {ControllerOptions} from "../../../core/mongoose-controller/controller";
// import {Query} from "../../../core/decorators/parameters";
import z from "zod";
import UserProductRepository from "../../../repositories/admin/product/repository";
import {Response} from "../../../core/controller";
import Product from "../../../repositories/admin/product/model";
// import { Param } from "../../decorators/parameters";
import { Body, Param, Query } from "../../../core/decorators/parameters";
import ReviewService from "../../services/reviewService";
// import { Body, Param, Query } from "../../../core/mongoose-controller/controller";
// import { Request, Response } from "express";


export class UserProductController extends BaseController<Product> {
    private reviewService: ReviewService;

    constructor(baseRoute: string, repo: UserProductRepository, options: ControllerOptions) {
        super(baseRoute, repo, options);
        this.reviewService = new ReviewService();
    }
    // async list11(req: Request, res: Response) {
    //     try {
    //         const { limit, page, sort } = req.query;
    //         const products = await ProductRepository.findAll(
    //             {},
    //             {
    //                 limit: Number(limit) || 20,
    //                 page: Number(page) || 1,
    //                 sort: sort ? JSON.parse(sort as string) : { created_at: -1 },
    //             }
    //         );
    //
    //         const pricedProducts = await ProductPriceService.calculateForList(products);
    //
    //         return res.status(200).json({
    //             success: true,
    //             data: pricedProducts,
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "خطا در دریافت محصولات",
    //             // error: error.message,
    //         });
    //     }
    // }

    @Get("/list")
    async list(
        @Query({destination: "page", schema: z.coerce.number().default(1)}) page: number,
        @Query({destination: "limit", schema: z.coerce.number().default(10)}) limit: number,
        @Query({destination: "sort", schema: z.string().optional()}) sort?: string,
        @Query({
            schema: z.object({
                "category": BaseController.id.optional(),
                "brand": BaseController.id.optional(),
                "search": BaseController.id.optional(),

            })
        })filters?:any
    ): Promise<Response> {
        
        const data = await this.repository.getProductList(page, limit, filters, sort);

        return {
            // status: 200,
            data,
        };
    }

    // @Get("/price")
    // async getFinalPrice(
    //     @Query({ schema: z.object({ productId: z.string(), variantFeatures: z.record(z.string()) }) })
    //     { productId, variantFeatures }: { productId: string; variantFeatures?: { [key: string]: string } }
    // ): Promise<Response> {
    //     const product = await this.repository.findById(productId);
    //     if (!product) return {status: 404, message: "Product not found"};

    //     // جمع‌آوری موجودی و قیمت واریانت
    //     const warehouses = product. || [];
    //     let basePrice = product.price;
    //     let stock = 0;

    //     if (variantFeatures) {
    //         // پیدا کردن واریانت مطابق ویژگی‌ها
    //         const matched = warehouses.filter(wh => {
    //             if (!wh.config) return true;
    //             return Object.keys(variantFeatures).every(key => wh.config[key] === variantFeatures[key]);
    //         });
    //         if (matched.length) {
    //             basePrice = Math.min(...matched.map(m => m.price));
    //             stock = matched.reduce((sum, m) => sum + m.quantity, 0);
    //         } else {
    //             stock = warehouses.reduce((sum, m) => sum + m.quantity, 0);
    //         }
    //     } else {
    //         stock = warehouses.reduce((sum, m) => sum + m.quantity, 0);
    //     }

    //     // پیدا کردن تخفیف‌ها
    //     const discounts = await this.discountRepo.findActiveForProductAndVariant(
    //         productId,
    //         product.category?._id?.toString(),
    //         product.brand?._id?.toString(),
    //         variantFeatures
    //     );

    //     let finalPrice = basePrice;
    //     discounts.forEach(discount => {
    //         if (discount.disValue.type === "fixed") {
    //             finalPrice -= discount.disValue.fixedAmount || 0;
    //         } else if (discount.disValue.type === "percent") {
    //             finalPrice -= (discount.disValue.fixedAmount! / 100) * finalPrice;
    //         }
    //     });

    //     return {
    //         status: 200,
    //         data: { productId, originalPrice: basePrice, finalPrice, stock, discounts },
    //     };
    // }


    // مشاهده تک محصول
    @Get("/:id")

    async getSingle(
          // @Body({
          //   destination: "id",
          //   schema: BaseController.id,
          // })
          // id: string,
        // @Param({
        //     destination: "id",
        //     schema: z.string()
        // }) id: string,
        @Query({ destination: "id", schema: z.string() }) id: string,
        @Query({ destination: "sku", schema: z.string().optional() }) sku?: string
    ): Promise<Response> {
        console.log('bbbbbb');

        const product: any = await this.repository.findById(id);
        if (!product) return { status: 404, message: "محصول پیدا نشد" };

        console.log('tttttt');
        if (sku) {
            console.log('ssssssssss');

            // اگر sku داده شده، جزییات واریانت را جدا کن و موجودی آن در انبارها را نشان بده
            const variant = product.variants.find((v: any) => v.sku === sku);
            if (!variant) return { status: 404, message: "واریانت پیدا نشد" };

            // موجودی هر انبار برای این واریانت
            const stockByWarehouse = (product.warehouses || [])
                .filter((w: any) => String(w.variant) === String(variant.variantId))
                .map((w: any) => ({ warehouse: w.warehouse, quantity: w.quantity, price: w.variantPrice }));

            return {
                status: 200,
                data: { productId: product._id, variant, stockByWarehouse }
            };
        }
        if (id) {
            console.log('fffffff');
            // اگر id داده شده، جزییات واریانت را جدا کن و موجودی آن در انبارها را نشان بده
            // var variant = await product.variants.findOne({
            //     user: user.id as string,
            // });
            const variant = product.variants.find((v: any) => v.id === id);
            if (!variant) return { status: 404, message: "واریانت پیدا نشد" };

            // موجودی هر انبار برای این واریانت
            const stockByWarehouse = (product.warehouses || [])
                .filter((w: any) => String(w.variant) === String(variant.variantId))
                .map((w: any) => ({ warehouse: w.warehouse, quantity: w.quantity, price: w.variantPrice }));

            return {
                status: 200,
                data: { productId: product._id, variant, stockByWarehouse }
            };
        }

        // کامنت: افزودن آمار امتیاز به محصول
        try {
            const ratingStats = await this.reviewService.getProductRatingStats(id);
            (product as any).rating = {
                average: ratingStats.averageRating,
                total: ratingStats.totalReviews,
                distribution: ratingStats.ratingDistribution,
            };
        } catch (error: any) {
            // کامنت: در صورت خطا، امتیاز را null می‌کنیم
            (product as any).rating = {
                average: 0,
                total: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        return { status: 200, data: product };
    }



    initApis() {
        super.initApis();
        this.exclude("/product", "delete");
        this.exclude("/product", "post");
    }
}

const userProduct = new UserProductController(
    "/product",
    new UserProductRepository(),
    {
        collectionName: "product",
    }
);

export default userProduct;
