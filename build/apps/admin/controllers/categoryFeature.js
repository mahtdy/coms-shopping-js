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
exports.CategoryFeatureController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const zod_1 = __importDefault(require("zod"));
const repository_1 = __importDefault(require("../../../repositories/admin/categoryFeature/repository"));
// export default class CategoryFeature extends BaseRepositoryService<CategoryFeature> {
//     // constructor() { super(CategoryFeatureModel, {}); }
//     constructor(options?: RepositoryConfigOptions) {
//         super(CategoryFeatureModel, options);
//     }
class CategoryFeatureController extends controller_1.default {
    constructor(baseRoute, repo, options) {
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
    async update(id, body) {
        const updated = await this.repository.update(id, { $set: body });
        return { status: 200, data: updated };
    }
}
exports.CategoryFeatureController = CategoryFeatureController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: zod_1.default.string() })),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.default.any() }))
], CategoryFeatureController.prototype, "update", null);
const categoryFeature = new CategoryFeatureController("/admin/category-feature", new repository_1.default(), { collectionName: "categoryFeature" });
exports.default = categoryFeature;
