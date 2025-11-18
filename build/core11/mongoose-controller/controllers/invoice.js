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
exports.InvoiceController = exports.transferSchema = exports.checkConfig = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const zod_1 = require("zod");
const repository_1 = __importDefault(require("../repositories/paymentConfig/repository"));
const repository_2 = __importDefault(require("../repositories/transaction/repository"));
exports.checkConfig = zod_1.z.object({
    interestRate: zod_1.z.coerce.number().min(0).max(100).optional(),
    havePenalty: zod_1.z.boolean().optional(),
    number: zod_1.z.string(),
    saiadNumber: zod_1.z.string(),
    bank: zod_1.z.string(),
    branch: zod_1.z.string(),
});
exports.transferSchema = zod_1.z.object({
    source: zod_1.z.string(),
    destination: zod_1.z.string(),
    code: zod_1.z.string()
});
const paymentConfig = zod_1.z.object({
    invoice: controller_1.default.id,
    type: zod_1.z.enum(["multi-stage", "installment", "simple"]),
    installmentConfig: zod_1.z.object({
        prePay: zod_1.z.coerce.number().int().min(0).optional(),
        prePayDeadline: zod_1.z.coerce.date().optional(),
        prePayCheck: exports.checkConfig.optional(),
        formula: zod_1.z.enum(["banking", "market"]).optional(),
        count: zod_1.z.coerce.number().int().min(1).optional(),
        period: zod_1.z.union([
            zod_1.z.literal(10),
            zod_1.z.literal(15),
            zod_1.z.literal(20),
            zod_1.z.literal(30),
            zod_1.z.literal(45),
            zod_1.z.literal(60),
            zod_1.z.literal(90),
            zod_1.z.literal(120),
            zod_1.z.literal(150),
            zod_1.z.literal(180),
        ]),
        interestRate: zod_1.z.coerce.number().int().min(0).max(100).optional(),
        payType: zod_1.z.enum(["check", "payGateWay", "other"]).optional(),
        checks: zod_1.z.array(exports.checkConfig).optional(),
        notes: zod_1.z.array(zod_1.z.array(zod_1.z.string())),
        payStart: zod_1.z.coerce.date(),
        havePenalty: zod_1.z.boolean().optional(),
    }).optional(),
    amount: zod_1.z.coerce.number().int().min(0),
    info: zod_1.z.union([zod_1.z.object({
            account: controller_1.default.id,
            pos: controller_1.default.id
        }), exports.checkConfig, exports.transferSchema
    ]).optional(),
    deadline: zod_1.z.coerce.date().optional(),
    payType: zod_1.z.enum(["payGateWay", "cash", "pos", "transfer", "check"]).optional(),
});
class InvoiceController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.paymentConfigRepo = new repository_1.default();
        this.transactionRepo = new repository_2.default(repo);
    }
    async findById(id) {
        try {
            const invoice = await this.repository.findOne({
                _id: id
            }, {}, [
                {
                    path: "owner",
                    select: ["name", "family"]
                },
            ]);
            if (invoice == null) {
                return {
                    status: 404,
                };
            }
            let paymentConfigs = await this.paymentConfigRepo.findAll({
                invoice: id,
                // status:{
                // } "inproccess"
            }, {}, [{
                    path: "transaction",
                }]);
            // let installments = []
            // if (paymentConfig != undefined) {
            //     installments = await this.installmentRepo.findAll({
            //         paymentConfig: paymentConfig._id
            //     },
            //         {},
            //         [{
            //             path: "owner",
            //             select: ["name", "family"]
            //         }, {
            //             path: "transactions",
            //             select: ["type", "payType", "number", "amount", "status", "ispaid", "info"]
            //         }, {
            //             path: "notes.admin",
            //             select: ["name", "familyName", "phoneNumber", "email", "profile"]
            //         }],
            //     )
            //     return {
            //         data: {
            //             invoice,
            //             paymentConfig,
            //             installments
            //         }
            //     }
            // }
            return {
                data: {
                    invoice,
                    paymentConfigs
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.InvoiceController = InvoiceController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], InvoiceController.prototype, "findById", null);
