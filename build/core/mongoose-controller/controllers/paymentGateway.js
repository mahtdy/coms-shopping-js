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
exports.PaymentGatewayController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/paymentGateway/repository"));
const zod_1 = require("zod");
const payportConfig = {
    meli: {
        name: "ملی",
        fields: [
            {
                name: "کلید api",
                fieldName: "key"
            },
            {
                name: "شناسه پایانه",
                fieldName: "terminalId"
            },
            {
                name: "شناسه تجاری",
                fieldName: "merchantId"
            }
        ]
    },
    parsian: {
        name: "پارسیان",
        fields: [
            {
                name: "کلید ورود",
                fieldName: "pin"
            },
        ]
    },
    zarinpal: {
        name: "زرین پال",
        fields: [
            {
                name: "شناسه تجاری",
                fieldName: "merchantId"
            },
            {
                name: "کلید ورودی",
                fieldName: "accessToken"
            }
        ]
    },
};
class PaymentGatewayController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.population = [{
                path: "bankAccount"
            }];
    }
    async findById(id, queryInfo) {
        return super.findOne({
            _id: id
        }, {
            population: [{
                    path: "bankAccount"
                }]
        });
    }
    getConfigField() {
        return {
            status: 200,
            data: payportConfig
        };
    }
    async edit(id, paymentGateway) {
        return await this.editById(id, {
            $set: paymentGateway
        }, {
            ok: true
        });
    }
    async delete(id, ...params) {
        try {
            let paymentGateway = await this.repository.findById(id);
            if ((paymentGateway === null || paymentGateway === void 0 ? void 0 : paymentGateway.canDelete) == false) {
                return {
                    status: 400,
                    message: "حذف امکان پذیر نمی باشد"
                };
            }
        }
        catch (error) {
            throw error;
        }
        return super.delete(id);
    }
    paginate(page, limit, query, options, ...params) {
        return super.paginate(page, limit, query, {
            population: [{
                    path: "bankAccount",
                    select: ["title", "bank"]
                }]
        });
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("es/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.PaymentGatewayController = PaymentGatewayController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id }))
], PaymentGatewayController.prototype, "findById", null);
__decorate([
    (0, method_1.Get)("/config")
], PaymentGatewayController.prototype, "getConfigField", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string().optional(),
            isActive: zod_1.z.boolean().optional(),
            isRegistered: zod_1.z.boolean().optional(),
            bankAccount: controller_1.default.id.optional(),
            config: zod_1.z.any().optional(),
        })
    }))
], PaymentGatewayController.prototype, "edit", null);
const paymentGateway = new PaymentGatewayController("/payment-gateway", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        // name: z.string(),
        type: zod_1.z.enum([
            "melat",
            "saderat",
            "meli",
            "eghtesad-novin",
            "saman",
            "ap",
            "parsian",
            "pasargad",
            "id-pay",
            "zarinpal",
            "pay",
            "nextpay"
        ]),
        isActive: zod_1.z.boolean().default(true),
        isRegistered: zod_1.z.boolean().default(true),
        bankAccount: controller_1.default.id.optional(),
        canDelete: zod_1.z.boolean().default(true),
        config: zod_1.z.any().optional(),
    })
});
exports.default = paymentGateway;
