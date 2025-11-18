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
exports.ProductVariantController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/productVariant/repository"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const zod_1 = __importDefault(require("zod"));
class ProductVariantController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async createVariant(data) {
        const created = await this.repository.create(data);
        return { status: 200, data: created };
    }
    async updateVariant(id, body) {
        const updated = await this.repository.update(id, { $set: body });
        return { status: 200, data: updated };
    }
    async list(product) {
        const query = {};
        if (product)
            query.product = product;
        const items = await this.repository.findAll(query);
        return { status: 200, data: items };
    }
    async deleteVariant(id) {
        await this.repository.delete(id);
        return { status: 200 };
    }
}
exports.ProductVariantController = ProductVariantController;
__decorate([
    (0, method_1.Post)("/create"),
    __param(0, (0, parameters_1.Body)({ schema: zod_1.default.any() }))
], ProductVariantController.prototype, "createVariant", null);
__decorate([
    (0, method_1.Put)("/update"),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: zod_1.default.string() })),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.default.any() }))
], ProductVariantController.prototype, "updateVariant", null);
__decorate([
    (0, method_1.Get)("/list"),
    __param(0, (0, parameters_1.Query)({ destination: "product", schema: zod_1.default.string().optional() }))
], ProductVariantController.prototype, "list", null);
__decorate([
    (0, method_1.Delete)("/delete"),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: zod_1.default.string() }))
], ProductVariantController.prototype, "deleteVariant", null);
const productVariant = new ProductVariantController("/admin/product-variant", new repository_1.default(), { collectionName: "productVariant" });
exports.default = productVariant;
