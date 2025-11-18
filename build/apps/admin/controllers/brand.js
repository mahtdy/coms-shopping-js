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
exports.BrandController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/brand/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const controller_2 = require("../../../core/mongoose-controller/basePage/controller");
class BrandController extends controller_2.BasePageController {
    // catRepo: CategoryRepository;
    // constructor(
    //   baseRoute: string,
    //   repo: BrandRepository,
    //   options: ControllerOptions & ControllerOptions
    // ) {
    //   super(baseRoute, repo, options);
    //   this.catRepo = new CategoryRepository();
    // }
    create(data, admin) {
        return super.create(data, admin);
    }
    async testUpdate(id, price) {
        return this.editById(id, {
            $set: {
                price,
            },
        }, {
            ok: true,
        });
    }
    async testSearch(id) {
        const searchbrand = await this.repository.findById(id);
        return {
            status: 200,
            data: searchbrand
        };
    }
}
exports.BrandController = BrandController;
__decorate([
    (0, method_1.Put)("/updateBrand", {
    // absolute: true,
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "price",
        schema: zod_1.default.coerce.number().positive().int(),
    }))
], BrandController.prototype, "testUpdate", null);
__decorate([
    (0, method_1.Get)("", {
    // absolute: true,
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id,
    }))
], BrandController.prototype, "testSearch", null);
const insertSchema = zod_1.default
    .object({
    // brand: BaseController.id,
    // catID: BaseController.id,
    // summary: z.string(),
    title: zod_1.default.string().optional(),
    content: zod_1.default.string(),
    // address: z.string(),
    // phone: z.number(),
    // price: z.coerce.number().positive().int(),
    // features: z.array(
    //   z.object({
    //     id: BaseController.id,
    //     values: z.array(z.any()),
    //   })
    // ),
    image: zod_1.default
        .string()
        .url()
        .default("https://www.google.com/url?sa=i&url=https%3A%2F%2Ffa.wikipedia.org%2Fwiki%2F%25DA%25A9%25D9%2584%25D8%25A7%25D8%25BA_%2528%25D8%25B3%25D8%25B1%25D8%25AF%25D9%2587%2529&psig=AOvVaw0V-CeWQtoFjQcUeDkQ0W2E&ust=1706000951040000&source=images&cd=vfe&ved=0CBMQjRxqFwoTCPDc6fbS8IMDFQAAAAAdAAAAABAE"),
    description: zod_1.default.string().min(200).optional(),
    // category: BaseController.id,
})
    .merge(controller_2.basePageZod);
// .merge(basePageZod);
const brand = new BrandController("/brand", new repository_1.default({}), {
    insertSchema,
    // searchFilters: {
    //   _id: ["eq", "list", "nin"],
    //   title: ["eq", "reg"],
    //   // price: ["eq", "gte", "lte", "list", "gt"],
    //   category: ["eq", "list", "nin"],
    // },
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
    // collectionName: "brand",
    // isAdminPaginate: true,
    // adminRepo: new AdminRepository({
    //   model: AdminModel,
    // }),
    // population : [{
    //     source : "category"
    // }]
});
exports.default = brand;
