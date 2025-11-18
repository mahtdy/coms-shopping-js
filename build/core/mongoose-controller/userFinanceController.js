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
const controller_1 = __importDefault(require("../controller"));
const method_1 = require("../decorators/method");
const parameters_1 = require("../decorators/parameters");
const controller_2 = __importDefault(require("./controller"));
const invoice_1 = require("./controllers/invoice");
const repository_1 = __importDefault(require("./repositories/paymentConfigPreText/repository"));
const zod_1 = require("zod");
const walletPayment = zod_1.z.object({
    type: zod_1.z.enum(["simple"]).default("simple"),
    amount: zod_1.z.coerce.number().int().min(0),
    info: zod_1.z.union([zod_1.z.object({
            account: controller_2.default.id,
            pos: controller_2.default.id
        }), invoice_1.checkConfig, invoice_1.transferSchema
    ]).optional(),
    deadline: zod_1.z.coerce.date().optional(),
    payType: zod_1.z.enum(["payGateWay", "transfer"]).optional(),
});
class UserFinanceController extends controller_1.default {
    constructor(financeService, ownerType = "user") {
        super('/finance', {
            apiDoc: {}
        });
        this.financeService = financeService;
        this.paymentConfigPreTextRepo = new repository_1.default();
        this.ownerType = ownerType;
    }
    async payFromWallet(data, user) {
        try {
            return await this.financeService.addPaymentConfig({
                invoice: data.id,
                payFor: "invoice",
                type: "simple",
                payType: "wallet",
                amount: data.amount,
                owner: user.id,
                ownerType: "user",
            });
        }
        catch (error) {
            throw error;
        }
    }
    async payFromTransfer(transferData, user) {
        try {
            return await this.financeService.addPaymentConfig({
                invoice: transferData.id,
                payFor: "invoice",
                type: "simple",
                payType: "transfer",
                amount: transferData.amount,
                info: {
                    source: transferData.source,
                    destination: transferData.destination,
                    code: transferData.code
                },
                deadline: transferData.payDate,
                owner: user.id,
                ownerType: "user"
            });
        }
        catch (error) {
            throw error;
        }
    }
    async payFromGateway() {
    }
    async getPayments(page, limit, user, q, payFors, payFor) {
        let query = {
            owner: {
                $eq: user.id
            },
            status: {
                $in: ["finished", "ended"]
            }
        };
        if (q != undefined) {
            query["trakingCode"] = {
                $regex: new RegExp(q)
            };
        }
        if (payFors != undefined && payFors.length > 0) {
            query["payFor"] = {
                $in: payFors
            };
        }
        else if (payFor != undefined) {
            query["payFor"] = payFor;
        }
        return this.financeService.repos.paymentConfigRepo.paginate(query, limit, page);
    }
    async addWalletPaymentConfig(data, user) {
        try {
            data.owner = user.id;
            data.ownerType = this.ownerType;
            return {
                status: 200,
                data: await this.financeService.addWalletPaymentConfig(data)
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = UserFinanceController;
__decorate([
    (0, method_1.Post)("/invoice/pay/wallet", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            amount: zod_1.z.coerce.number().int().positive()
        })
    })),
    __param(1, (0, parameters_1.User)())
], UserFinanceController.prototype, "payFromWallet", null);
__decorate([
    (0, method_1.Post)("/invoice/pay/transfer", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            code: zod_1.z.string(),
            payDate: zod_1.z.coerce.date().default(() => new Date()),
            amount: zod_1.z.coerce.number().int().positive(),
            source: zod_1.z.string(),
            destination: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.User)())
], UserFinanceController.prototype, "payFromTransfer", null);
__decorate([
    (0, method_1.Post)("/invoice/pay/gateWay", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    })
], UserFinanceController.prototype, "payFromGateway", null);
__decorate([
    (0, method_1.Get)("/payments"),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_2.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_2.default.limit
    })),
    __param(2, (0, parameters_1.User)()),
    __param(3, (0, parameters_1.Query)({
        destination: "q",
        schema: zod_1.z.string().optional()
    })),
    __param(4, (0, parameters_1.Query)({
        destination: "payFors",
        schema: zod_1.z.array(zod_1.z.enum(["invoice", "chargeAccount", "chashBack"])).optional()
    })),
    __param(5, (0, parameters_1.Query)({
        destination: "payFor",
        schema: zod_1.z.enum(["invoice", "chargeAccount", "chashBack"]).optional()
    }))
], UserFinanceController.prototype, "getPayments", null);
__decorate([
    (0, method_1.Post)("/wallet/charge"),
    __param(0, (0, parameters_1.Body)({
        schema: walletPayment
    })),
    __param(1, (0, parameters_1.User)())
], UserFinanceController.prototype, "addWalletPaymentConfig", null);
