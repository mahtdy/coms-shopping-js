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
exports.ProductController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/product/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
// import Category from "../../../core/mongoose-controller/repositories/category/model";
const repository_2 = __importDefault(require("../../../core/mongoose-controller/repositories/category/repository"));
const repository_3 = __importDefault(require("../../../core/mongoose-controller/repositories/admin/repository"));
const login_1 = require("../../../apps/admin/login");
const controller_2 = require("../../../core/mongoose-controller/basePage/controller");
class ProductController extends controller_2.BasePageController {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.catRepo = new repository_2.default();
        // this.addExportRoutes()
    }
    // create(data: Product, admin: AdminInfo): Promise<Response> {
    //   return super.create(data, admin);
    // }
    create(data, admin) {
        console.log("product", data);
        return super.create(data, admin);
    }
    // @Get("/test", {
    //   // loginRequired : true
    // })
    // test(): Response {
    //   return {
    //     status: 200,
    //   };
    // }
    // async test2() {
    //     return {
    //         data: {
    //             hello: "word"
    //         },
    //         status: 200
    //     }
    // }
    // @Get("/test/paginate")
    // async testPagination(
    //     page: number,
    //     limit: number) {
    //     return super.paginate(page, limit, {}, {
    //         projection: {
    //             description: 0
    //         }
    //     })
    //     // super.create(d)
    // }
    async testUpdate(id, title, price) {
        return this.editById(id, {
            $set: {
                title,
                price,
            },
        }, {
            ok: true,
        });
    }
    // @Put("/update/many")
    // async updateMany(
    //     @Query({
    //         destination: "category",
    //         schema: z.string()
    //     }) catTitle: string,
    //     @Query({
    //         destination: "price",
    //         schema: z.coerce.number().positive().int()
    //     }) price: number,
    //     @Body({
    //         schema: z.object({
    //             category: z.string(),
    //             price: z.coerce.number().positive().int()
    //         })
    //     }) data: {
    //         category: string,
    //         price: number
    //     }
    // ): Promise<Response> {
    //     let category = await this.catRepo.findOne({
    //         title: catTitle
    //     })
    //     console.log(category, catTitle)
    //     if (category == null) {
    //         return {
    //             status: 400
    //         }
    //     }
    //     let finalCat = await this.catRepo.findOne({ title: data.category })
    //     if (finalCat == null) {
    //         return {
    //             status: 400
    //         }
    //     }
    //     try {
    //         return {
    //             status: 200,
    //             data: await this.repository.updateMany({
    //                 price,
    //                 category: category._id
    //             }, {
    //                 $set: {
    //                     price: data.price,
    //                     category: finalCat._id
    //                 }
    //             })
    //         }
    //     } catch (error) {
    //         throw error
    //     }
    // }
    // @Get("/search")
    // async search(@Query({
    //     destination: "page",
    //     schema: BaseController.page
    // }) page: number,
    //     @Query({
    //         destination: "limit",
    //         schema: BaseController.limit
    //     }) limit: number,
    //     @Query({
    //         schema: BaseController.search
    //     }) reqQuery: any, admin?: any, ...params: any[]): Promise<Response> {
    //     return super.search(page, limit, reqQuery, admin)
    // }
    async searchHelper(queryParam) {
        let query = await super.searchHelper(queryParam);
        // console.log("query",query ,queryParam)
        if (queryParam["_id$nin"] != undefined) {
            if (query["_id"] == undefined) {
                query["_id"] = {};
            }
            query["_id"] = {
                $nin: queryParam["_id$nin"],
            };
        }
        if (queryParam["price$gt"] != undefined) {
            if (query["price"] == undefined) {
                query["price"] = {};
            }
            query["price"] = {
                $gt: queryParam["price$gt"],
            };
        }
        console.log("query", query);
        return query;
    }
    // public dataTransform(dataList: any[]): Promise<any[]> {
    //     console.log(dataList)
    //     for (let i = 0; i < dataList.length; i++) {
    //         dataList[i]['title'] = dataList[i]['title']+ "(export csv)"
    //     }
    //     return super.dataTransform(dataList)
    // }
    // // transformData(permissionData: PermissionData & { data: any; }): Promise<any> {
    // //     console.log("permissionData", permissionData)
    // //     return super.transformData(permissionData)
    // // }
    // @Get("es/csv")
    // exportCSV(@Query({schema : BaseController.search}) query: any, adminInfo: AdminInfo, ...params: any[]): Promise<Response> {
    //     return super.exportCSV(query,adminInfo)
    // }
    initApis() {
        super.initApis();
        // this.addRoute("/test2", "get", this.test2.bind(this))
        // this.addRouteWithMeta("/test/paginate2", "get", this.testPagination.bind(this), BaseController.paginateMeta)
        // this.exclude("/product" , "delete")
    }
}
exports.ProductController = ProductController;
__decorate([
    __param(1, (0, parameters_1.Admin)())
], ProductController.prototype, "create", null);
__decorate([
    (0, method_1.Put)("/update", {
    // absolute: true,
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "title",
        schema: zod_1.default.coerce.string(),
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "price",
        schema: zod_1.default.coerce.number().positive().int(),
    }))
], ProductController.prototype, "testUpdate", null);
const insertSchema = zod_1.default
    .object({
    brand: controller_1.default.id,
    catID: controller_1.default.id,
    summary: zod_1.default.string(),
    title: zod_1.default.string(),
    price: zod_1.default.coerce.number().positive().int(),
    features: zod_1.default.array(zod_1.default.object({
        id: controller_1.default.id,
        values: zod_1.default.array(zod_1.default.any()),
    })),
    image: zod_1.default.string().url().default("https://www.google.com/url?sa=i&url=https%3A%2F%2Ffa.wikipedia.org%2Fwiki%2F%25DA%25A9%25D9%2584%25D8%25A7%25D8%25BA_%2528%25D8%25B3%25D8%25B1%25D8%25AF%25D9%2587%2529&psig=AOvVaw0V-CeWQtoFjQcUeDkQ0W2E&ust=1706000951040000&source=images&cd=vfe&ved=0CBMQjRxqFwoTCPDc6fbS8IMDFQAAAAAdAAAAABAE"),
    description: zod_1.default.string().min(200).optional(),
    category: zod_1.default.array(zod_1.default.object({
        id: controller_1.default.id,
        title: zod_1.default.array(zod_1.default.any()),
    })),
    content: zod_1.default.string().default('contentcontentcontentcontentcontentcontent'),
})
    .merge(controller_2.basePageZod);
// console.log('insertSchema==', insertSchema);
const product = new ProductController("/product", new repository_1.default({
    population: [{
            path: "category",
            select: ["title"]
        }]
}), {
    insertSchema,
    searchFilters: {
        _id: ["eq", "list", "nin"],
        title: ["eq", "reg"],
        price: ["eq", "gte", "lte", "list", "gt"],
        category: ["eq", "list", "nin"],
    },
    // pdfConfig: {
    //   path: "src/core/mongoose-controller/pdf.ejs",
    //   options: {
    //     height: "90.25in",
    //     width: "45.5in",
    //     header: {
    //       height: "20mm",
    //     },
    //     footer: {
    //       height: "20mm",
    //     },
    //     childProcessOptions: {
    //       env: {
    //         OPENSSL_CONF: "/dev/null",
    //       },
    //     },
    //   },
    //   titles: ["عنوان", "قیمت", "توضیحات", "دسته بندی"],
    //   dataMap: ["title", "price", "description", "category.title"],
    // },
    // csvConfig: {
    //   fields: ["title", "price", "description", "category.title"],
    //   fieldNames: ["عنوان", "قیمت", "توضیحات", "دسته بندی"],
    // },
    collectionName: "product",
    isAdminPaginate: true,
    adminRepo: new repository_3.default({
        model: login_1.AdminModel,
    }),
    // population : [{
    //     source : "category"
    // }]
});
// product.loginRequired =true
exports.default = product;
