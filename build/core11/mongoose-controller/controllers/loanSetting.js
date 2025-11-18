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
exports.LoanSettingController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/loanSetting/repository"));
const zod_1 = require("zod");
const loanSettingSchema = zod_1.z.object({
    from: zod_1.z.coerce.number().int().min(0),
    to: zod_1.z.number().int().min(1),
    deed: zod_1.z.object({
        min: zod_1.z.number().int().min(0),
        enabled: zod_1.z.boolean()
    }),
    personal: zod_1.z.object({
        min: zod_1.z.number().int().min(0),
        guarantorsCount: zod_1.z.number().int().min(0)
    }),
    enabled: zod_1.z.boolean().default(true)
});
class LoanSettingController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async create(data) {
        try {
            let exists = await this.repository.isExists({
                $or: [
                    {
                        to: {
                            $gt: data.to
                        },
                        from: {
                            $lt: data.to
                        }
                    },
                    {
                        to: {
                            $gt: data.from
                        },
                        from: {
                            $lt: data.from
                        }
                    }
                ]
            });
            console.log("exists", exists);
            if (exists) {
                return {
                    status: 400,
                    message: "",
                    data: {}
                };
            }
        }
        catch (error) {
            throw error;
        }
        return super.create(data);
    }
    async update(id, data) {
        try {
            let exists = await this.repository.isExists({
                _id: {
                    $ne: id
                },
                $or: [
                    {
                        to: {
                            $gt: data.to
                        },
                        from: {
                            $lt: data.to
                        }
                    },
                    {
                        to: {
                            $gt: data.from
                        },
                        from: {
                            $lt: data.from
                        }
                    }
                ]
            });
            console.log("exists", exists);
            if (exists) {
                return {
                    status: 400,
                    message: "",
                    data: {}
                };
            }
        }
        catch (error) {
            throw error;
        }
        return this.editById(id, {
            $set: data
        });
    }
    async validateLoanSetting(from, to, id) {
        try {
            let q = {
                $or: [
                    {
                        to: {
                            $gt: to
                        },
                        from: {
                            $lt: to
                        }
                    },
                    {
                        to: {
                            $gt: from
                        },
                        from: {
                            $lt: from
                        }
                    }
                ]
            };
            if (id != undefined) {
                q["_id"] = {
                    $ne: id
                };
            }
            return await this.checkExists(q);
        }
        catch (error) {
            throw error;
        }
    }
    findById(id, queryInfo) {
        return super.findById(id);
    }
    async getAmountByAmount(amount) {
        try {
            return this.findOne({
                from: {
                    $lte: amount
                },
                to: {
                    $gte: amount
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.LoanSettingController = LoanSettingController;
__decorate([
    (0, method_1.Post)("")
], LoanSettingController.prototype, "create", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: loanSettingSchema
    }))
], LoanSettingController.prototype, "update", null);
__decorate([
    (0, method_1.Get)("/validate"),
    __param(0, (0, parameters_1.Query)({
        destination: "from",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "to",
        schema: controller_1.default.page
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id.optional()
    }))
], LoanSettingController.prototype, "validateLoanSetting", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], LoanSettingController.prototype, "findById", null);
__decorate([
    (0, method_1.Post)("/by-amount"),
    __param(0, (0, parameters_1.Body)({
        destination: "amount",
        schema: zod_1.z.number().int().min(1)
    }))
], LoanSettingController.prototype, "getAmountByAmount", null);
const loanSetting = new LoanSettingController("/loan-setting", new repository_1.default(), {
    insertSchema: loanSettingSchema
});
exports.default = loanSetting;
