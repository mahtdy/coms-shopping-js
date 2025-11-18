"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketController = void 0;
const repository_1 = __importDefault(require("../../../repositories/admin/basket/repository"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const zod_1 = require("zod");
class BasketController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
}
exports.BasketController = BasketController;
const basket = new BasketController("/basket", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        product: controller_1.default.id,
        productwarehouse: controller_1.default.id,
        user: controller_1.default.id,
        price: zod_1.z.coerce.number().positive().int(),
        quantity: zod_1.z.coerce.number().positive().int().default(1),
    }),
});
exports.default = basket;
