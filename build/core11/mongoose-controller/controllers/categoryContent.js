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
exports.CategoryContentController = void 0;
const parameters_1 = require("../../decorators/parameters");
const controller_1 = require("../basePage/controller");
const repository_1 = __importDefault(require("../repositories/categoryContent/repository"));
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const controller_2 = __importDefault(require("../controller"));
let schema = zod_1.z.object({}).merge(controller_1.seoSchema)
    .omit({
    mainKeyWord: true
});
const insertSchema = controller_1.basePageZod.merge(zod_1.z.object({
    catID: controller_1.BasePageController.id,
    title: zod_1.z.string(),
    mainImage: zod_1.z.string(),
    summary: zod_1.z.string(),
    content: zod_1.z.string().optional(),
    seo: schema
})).omit({
    category: true,
    categories: true,
    // seo.mainKeyWord : true
});
class CategoryContentController extends controller_1.BasePageController {
    getCategoryContent(language, catID, lable) {
        return super.findOne({
            catID,
            lable,
            language
        });
    }
    async publish(data, id, update, admin) {
        try {
            let r = await super.publish(data, id, update, admin);
            return r;
        }
        catch (error) {
            //  console.log(error)
            throw error;
        }
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/categoryContents/search", "get", this.search.bind(this), controller_2.default.searcheMeta);
        this.addRoute("/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.CategoryContentController = CategoryContentController;
__decorate([
    (0, method_1.Get)("/content"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.BasePageController.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "catID",
        schema: controller_1.BasePageController.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "lable",
        schema: zod_1.z.string().default("content")
    }))
], CategoryContentController.prototype, "getCategoryContent", null);
const categoryContent = new CategoryContentController("/categoryContent", new repository_1.default({
    population: [
        {
            path: "catID",
        },
        {
            path: "language",
        },
    ]
}), {
    insertSchema,
    searchFilters: {
        title: ["reg", "eq"],
        language: ["eq"],
    },
});
exports.default = categoryContent;
