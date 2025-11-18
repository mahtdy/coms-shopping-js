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
exports.LoanTemplateController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/loanTemplate/repository"));
const zod_1 = require("zod");
const warrantySchema = zod_1.z.object({
    deed: zod_1.z.object({
        min: zod_1.z.number().int().min(0),
        enabled: zod_1.z.boolean()
    }),
    personal: zod_1.z.object({
        min: zod_1.z.number().int().min(0),
        guarantorsCount: zod_1.z.number().int().min(0)
    })
});
const periodeSchema = zod_1.z.object({
    months: zod_1.z.number(),
    bankFees: zod_1.z.number().positive().optional(),
    supplierName: zod_1.z.string().optional(),
    supplierIcon: zod_1.z.string().optional(),
    warranty: warrantySchema,
    formula: zod_1.z.enum(["banking", "market"]),
    interestRate: zod_1.z.coerce.number().min(0),
    enabled: zod_1.z.boolean().default(true),
    _id: controller_1.default.id.optional()
});
const loanTemplateSchema = zod_1.z.object({
    title: zod_1.z.string(),
    icon: zod_1.z.string().optional(),
    amount: zod_1.z.number(),
    periodes: zod_1.z.array(periodeSchema),
    dueDate: zod_1.z.coerce.date().optional(),
});
class LoanTemplateController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async editLoanTemplate(id, data) {
        return this.editById(id, {
            $set: data
        });
    }
    async getLoan(id) {
        return this.findById(id);
    }
    async searchLoanTemplate(q) {
        let query = {
            title: {
                $regex: new RegExp(q)
            }
        };
        return this.paginate(1, 10, query);
    }
}
exports.LoanTemplateController = LoanTemplateController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: loanTemplateSchema
    }))
], LoanTemplateController.prototype, "editLoanTemplate", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], LoanTemplateController.prototype, "getLoan", null);
__decorate([
    (0, method_1.Get)("/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "q",
        schema: zod_1.z.string()
    }))
], LoanTemplateController.prototype, "searchLoanTemplate", null);
const loanTemplate = new LoanTemplateController("/loan-template", new repository_1.default(), {
    insertSchema: loanTemplateSchema
});
exports.default = loanTemplate;
