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
const zod_1 = require("zod");
const repository_1 = __importDefault(require("./repositories/paymentConfigPreText/repository"));
const walletPayment = zod_1.z.object({
    type: zod_1.z.enum(["multi-stage", "simple"]),
    amount: zod_1.z.coerce.number().int().min(0),
    info: zod_1.z.union([zod_1.z.object({
            account: controller_2.default.id,
            pos: controller_2.default.id
        }), invoice_1.checkConfig, invoice_1.transferSchema
    ]).optional(),
    deadline: zod_1.z.coerce.date().optional(),
    payType: zod_1.z.enum(["payGateWay", "cash", "pos", "transfer", "check"]).optional(),
    ownerType: zod_1.z.string(),
    owner: controller_2.default.id
});
const loanPayment = zod_1.z.object({
    ownerType: zod_1.z.string(),
    owner: controller_2.default.id,
    payType: zod_1.z.enum(["check",
        "payGateWay"]).optional(),
    data: zod_1.z.union([
        zod_1.z.object({
            loanTemplate: controller_2.default.id,
            loanPeriod: controller_2.default.id,
        }),
        zod_1.z.object({
            amount: zod_1.z.coerce.number().int().min(0),
            formula: zod_1.z.enum(["banking", "market"]),
            count: zod_1.z.coerce.number().int().min(1),
            interestRate: zod_1.z.coerce.number().int().min(0).max(100),
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
            ]).default(30),
            bankFees: zod_1.z.number().min(0).optional(),
        })
    ])
});
const paymentConfig = zod_1.z.object({
    invoice: controller_2.default.id,
    type: zod_1.z.enum(["multi-stage", "installment", "simple"]),
    installmentConfig: zod_1.z.object({
        prePay: zod_1.z.coerce.number().int().min(0).optional(),
        prePayDeadline: zod_1.z.coerce.date().optional(),
        prePayCheck: invoice_1.checkConfig.optional(),
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
        checks: zod_1.z.array(invoice_1.checkConfig).optional(),
        notes: zod_1.z.array(zod_1.z.array(zod_1.z.string())),
        payStart: zod_1.z.coerce.date(),
        havePenalty: zod_1.z.boolean().optional(),
    }).optional(),
    amount: zod_1.z.coerce.number().int().min(0),
    info: zod_1.z.union([zod_1.z.object({
            account: controller_2.default.id,
            pos: controller_2.default.id
        }), invoice_1.checkConfig, invoice_1.transferSchema
    ]).optional(),
    deadline: zod_1.z.coerce.date().optional(),
    payType: zod_1.z.enum(["payGateWay", "cash", "pos", "transfer", "check", "wallet"]).optional(),
});
const cancleAndChangeCheck = zod_1.z.object({
    paymentId: controller_2.default.id,
    type: zod_1.z.enum(["simple"]),
    info: zod_1.z.union([zod_1.z.object({
            account: controller_2.default.id,
            pos: controller_2.default.id
        }), invoice_1.checkConfig, invoice_1.transferSchema
    ]).optional(),
    deadline: zod_1.z.coerce.date().optional(),
    payType: zod_1.z.enum(["payGateWay", "cash", "pos", "transfer", "check", "wallet"]).optional(),
});
class FinanceController extends controller_1.default {
    constructor(financeService) {
        super('/finance', {
            apiDoc: {
                summary: 'Finance API',
                description: 'Finance API for managing finance data',
                tags: ['finance'],
                consumes: ['application/json'],
                produces: ['application/json']
            }
        });
        this.financeService = financeService;
        this.paymentConfigPreTextRepo = new repository_1.default();
    }
    //////////////////////   invoice    ////////////////////
    async addWalletPaymentConfig(data, admin) {
        try {
            return {
                status: 200,
                data: await this.financeService.addWalletPaymentConfig(data, admin)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async createLoan(data, admin) {
        try {
            return {
                status: 200,
                data: await this.financeService.createLoan(data, admin)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async depositLoan(id, period, payStart) {
        try {
            return {
                data: await this.financeService.depositLoan(id, payStart, period),
                status: 200
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async confirmLoan(id, data, admin) {
        try {
            return {
                status: 200,
                data: await this.financeService.confirmLoan(id, data, admin)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addChecks(id, checks, admin, payStart, period) {
        try {
            return {
                status: 200,
                data: await this.financeService.addChecks(id, checks, payStart, admin, period)
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async addAttachments(id, name, attachement, files) {
        try {
            const payment = await this.financeService.repos.paymentConfigRepo.findById(id);
            if (payment == null) {
                return {
                    status: 404
                };
            }
            if (payment.loanAttchments == undefined) {
                payment.loanAttchments = {};
            }
            let attachment = payment.loanAttchments[name];
            if (attachment) {
                // attachment.files = attachement;
                payment.loanAttchments[name].push({
                    url: attachement
                });
            }
            else {
                payment.loanAttchments[name] = [{ url: attachement }];
            }
            this.financeService.repos.paymentConfigRepo.updateOne({
                _id: id
            }, {
                $set: payment
            });
            return {
                status: 200,
                data: attachement
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getWarrantyConfig(id) {
        try {
            return {
                status: 200,
                data: await this.financeService.getWarrantyConfig(id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteAttachment(id, name, link) {
        try {
            const payment = await this.financeService.repos.paymentConfigRepo.findById(id);
            if (payment == null) {
                return {
                    status: 404
                };
            }
            if (payment.loanAttchments == undefined) {
                payment.loanAttchments = {};
            }
            let attachment = payment.loanAttchments[name];
            if (attachment) {
                payment.loanAttchments[name] = payment.loanAttchments[name].filter((item) => item.url !== link);
            }
            await this.financeService.repos.paymentConfigRepo.updateOne({
                _id: id
            }, {
                $set: payment
            });
            return {
                status: 200,
                data: payment.loanAttchments
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmAttachment(id) {
        try {
            return {
                status: 200,
                data: await this.financeService.confirmLoanAtachement(id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectLoan(id) { }
    async editLoan(id, data, admin) {
        try {
            return {
                status: 200,
                data: await this.financeService.editLoan(id, data, admin)
            };
        }
        catch (error) {
            throw error;
        }
        return {};
    }
    async changeLoanPayType(id, type) {
        try {
            return {
                data: await this.financeService.changeLoanPayType(id, type),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteLoan(id) {
        try {
        }
        catch (error) {
        }
        return {};
    }
    async getOwnerWallet(id, ownerType) {
        try {
            return {
                data: await this.financeService.getOwnerWallet(id, ownerType)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async cancelWalletPaymentConfig(data) {
        try {
            await this.financeService.cancelWalletPaymentConfig(data.paymentId);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getWalletPaymentConfig(id) {
        try {
            let data = await this.financeService.getWalletPaymentConfig(id);
            if (data == null) {
                return {
                    status: 404,
                    data: {}
                };
            }
            return {
                data,
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addPaymentConfig(data, admin) {
        try {
            return {
                status: 200,
                data: await this.financeService.addPaymentConfig(data, admin)
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async cancelPaymentConfig(data) {
        try {
            await this.financeService.canclePaymentConfig(data.id, data.paymentId);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addInstallmentNote(data, admin) {
        try {
            await this.financeService.addInstallmentNote(data, admin);
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteInstallmentNote(data, admin) {
        try {
            await this.deleteInstallmentNote(data, admin);
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getInstallmentNotes(installmentId) {
        try {
            return {
                status: 200,
                data: await this.financeService.getInstallmentNotes(installmentId)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async updateInstallment(id, data) {
        try {
            await this.financeService.updateInstallment(id, data);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200
        };
    }
    async confirmInstallments(id) {
        try {
            await this.financeService.confirmInstallments(id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectInstallments(data) {
        try {
            await this.financeService.rejectInstallments(data.paymentId, data.rejectMessage);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmInstallment(id, admin) {
        try {
            await this.financeService.confirmInstallment(id, admin);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectInstallment(data, admin) {
        try {
            await this.financeService.rejectInstallment(data.id, data.rejectMessage, admin);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async forgetPenalty(id) {
        try {
        }
        catch (error) {
            throw error;
        }
        return {};
    }
    async sendPenaltyPayLink(id) {
        try {
            return {
                data: await this.financeService.sendPenaltyPayLink(id),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async payPenaltyFromWallet(id) {
        try {
            return {
                data: await this.financeService.payPenaltyFromWallet(id),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async changeInstallment(data) {
    }
    async getInvoiceById(id) {
        try {
            return {
                data: await this.financeService.getInvoiceById(id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getPaymentInstallments(id) {
        try {
            return {
                data: await this.financeService.getPaymentInstallments(id),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////    invoice    //////////////////
    async searchPreText(q) {
        try {
            let query = {};
            if (q) {
                query["text"] = {
                    $regex: new RegExp(q)
                };
            }
            let data = await this.paymentConfigPreTextRepo.paginate(query, 10, 1);
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addPreText(text) {
        try {
            await this.paymentConfigPreTextRepo.insert({
                text
            });
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deletePreText(id) {
        try {
            await this.paymentConfigPreTextRepo.deleteById(id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getMinimumAmount(id) {
        try {
            return {
                status: 200,
                data: await this.financeService.getMinimumAmount(id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmCheck(data) {
        try {
            await this.financeService.confirmCheck(data.id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCheck(data) {
        try {
            await this.financeService.rejectCheck(data.id, data.rejectMessage);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async editCheck(data) {
        try {
            await this.financeService.editCheck(data);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkPassed(data) {
        try {
            let check = await this.financeService.checkPassed(data.id, data.account);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200
        };
    }
    async checkReturned(data) {
        try {
            await this.financeService.checkReturned(data.id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getAllChecks(page, limit, status) {
        try {
            let q = {};
            if (status) {
                q["status"] = status;
            }
            else {
                q["status"] = {
                    $in: ["inproccess", "returned", "arrived", "finished", "ended", "waitingForCancle", "readyForCancle"]
                };
            }
            q["payType"] = "check";
            return {
                status: 200,
                data: await this.financeService.repos.paymentConfigRepo.paginate(q, limit, page, {
                    population: [
                        {
                            path: "owner",
                            select: ["name", "family"]
                        },
                        {
                            path: "spendInfo.id",
                            select: ["nameAndFamily", "isReal", "name", "family"]
                        },
                        {
                            path: "dein.account",
                            select: ["title"]
                        },
                        {
                            path: "bankAccount",
                            select: ["title"]
                        },
                        {
                            path: "chest",
                            select: ["title"]
                        },
                        {
                            path: "invoice",
                            select: ["tax"]
                        },
                    ]
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async cancleAndChangeCheckReq(data) {
        try {
            await this.financeService.cancleAndChangeCheckReq(data.id, data.reSend, data.isInstallmentId);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: {}
        };
    }
    async confirmCancleAndChangeCheck(data) {
        try {
            await this.financeService.confirmCancleAndChangeCheck(data.id, data.code);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async submitCheckCancel(data) {
        try {
            await this.financeService.submitCheckCancel(data.id, data.code);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: {}
        };
    }
    async requestSubmitCheckCancel(data) {
        try {
            await this.financeService.requestSubmitCheckCancel(data.id, data.reSend);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: {}
        };
    }
    async cancleAndChangeCheck(data) {
        try {
            // console.log(data)
            return {
                data: await this.financeService.cancleAndChangeCheck(data),
                status: 200
            };
        }
        catch (error) {
            console.log("err", error);
            throw error;
        }
    }
    async cancleAndChangeReject() {
    }
    async changeCheckPlace(data) {
        try {
            await this.financeService.changeCheckPlace(data);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmCash(data) {
        try {
            let id;
            if ((data.to == "bank" && data.bank != undefined)) {
                id = data.bank;
            }
            else if ((data.to == "chest" && data.chest != undefined)) {
                id = data.chest;
            }
            else {
                return {
                    status: 400,
                    message: "to and bank or chest should be provided"
                };
            }
            await this.financeService.confirmCash(data.id, data.to, id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCash(data) {
        try {
            await this.financeService.rejectCash(data.id, data.rejectMessage);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async editCash(data) {
        try {
            await this.financeService.editCash(data);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmPOS(data) {
        try {
            await this.financeService.confirmPOS(data.id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectPOS(data) {
        try {
            await this.financeService.rejectPOS(data.id, data.rejectMessage);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async editPOS(data) {
        try {
            await this.financeService.editPOS(data);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmTransfer(data) {
        try {
            await this.financeService.confirmTransfer(data.id);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectTransfer(data) {
        try {
            await this.financeService.rejectTransfer(data.id, data.rejectMessage);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async editTransfer(data) {
        try {
            this.financeService.editTransfer(data);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async internalTransfer(data) {
        try {
            await this.financeService.internalTransfer(data);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sendPayLink(id) {
        try {
            await this.financeService.sendPayLink(id);
        }
        catch (error) {
            throw error;
        }
        return {};
    }
}
exports.default = FinanceController;
__decorate([
    (0, method_1.Post)("/payment/config/wallet"),
    __param(0, (0, parameters_1.Body)({
        schema: walletPayment
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "addWalletPaymentConfig", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan"),
    __param(0, (0, parameters_1.Body)({
        schema: loanPayment
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "createLoan", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/deposit"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "period",
        schema: zod_1.z.coerce.number().int().min(0).default(0)
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "payStart",
        schema: zod_1.z.coerce.date().optional()
    }))
], FinanceController.prototype, "depositLoan", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/confirm"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: loanPayment
    })),
    __param(2, (0, parameters_1.Admin)())
], FinanceController.prototype, "confirmLoan", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/check"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.array(invoice_1.checkConfig),
        destination: "checks"
    })),
    __param(2, (0, parameters_1.Admin)()),
    __param(3, (0, parameters_1.Body)({
        destination: "payStart",
        schema: zod_1.z.coerce.date()
    })),
    __param(4, (0, parameters_1.Body)({
        destination: "period",
        schema: zod_1.z.coerce.number().int().min(0).default(0)
    }))
], FinanceController.prototype, "addChecks", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/attachments", {
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.enum(["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo", "financeInfo", "sanaInfo", "otherInfo"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "attachement"
    })),
    __param(3, (0, parameters_1.Files)({
        config: {
            name: "attachement",
            maxCount: 5,
            types: ["jpg", "png", "webp", "jpeg"],
            dest: "src/uploads/waranty/",
            rename: true,
        },
        schema: zod_1.z.any().optional(),
        destination: "attachement",
        isArray: true,
        mapToBody: true,
        isOptional: true,
        moveFilesToCDN: {
            name: "attachement",
            config: {
                path: "loan/",
            },
        },
    }))
], FinanceController.prototype, "addAttachments", null);
__decorate([
    (0, method_1.Get)("/payment/config/loan/warranty/config"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "getWarrantyConfig", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/attachments/remove"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.enum(["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo", "financeInfo", "sanaInfo", "otherInfo"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "link",
        schema: zod_1.z.string()
    }))
], FinanceController.prototype, "deleteAttachment", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/attachments/confirm"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "confirmAttachment", null);
__decorate([
    (0, method_1.Post)("/payment/config/loan/reject"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "rejectLoan", null);
__decorate([
    (0, method_1.Put)("/payment/config/loan"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: loanPayment
    })),
    __param(2, (0, parameters_1.Admin)())
], FinanceController.prototype, "editLoan", null);
__decorate([
    (0, method_1.Put)("/payment/loan/pay-type"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_2.default.id,
        destination: "id"
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.enum(["check", "payGateWay"]),
        destination: "type"
    }))
], FinanceController.prototype, "changeLoanPayType", null);
__decorate([
    (0, method_1.Delete)("/payment/config/loan"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "deleteLoan", null);
__decorate([
    (0, method_1.Get)("/owner/wallet"),
    __param(0, (0, parameters_1.Query)({
        destination: "owner",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "ownerType",
        schema: zod_1.z.string()
    }))
], FinanceController.prototype, "getOwnerWallet", null);
__decorate([
    (0, method_1.Post)("/payment/config/wallet/cancel"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            paymentId: controller_2.default.id
        })
    }))
], FinanceController.prototype, "cancelWalletPaymentConfig", null);
__decorate([
    (0, method_1.Get)("/payment/config/wallet"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "getWalletPaymentConfig", null);
__decorate([
    (0, method_1.Post)("/payment/config"),
    __param(0, (0, parameters_1.Body)({
        schema: paymentConfig
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "addPaymentConfig", null);
__decorate([
    (0, method_1.Post)("/payment/config/cancel"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            paymentId: controller_2.default.id
        })
    }))
], FinanceController.prototype, "cancelPaymentConfig", null);
__decorate([
    (0, method_1.Post)("/installment/note"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            installmentId: controller_2.default.id,
            note: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "addInstallmentNote", null);
__decorate([
    (0, method_1.Post)("/installment/note/remove"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            installmentId: controller_2.default.id,
            noteId: controller_2.default.id
        })
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "deleteInstallmentNote", null);
__decorate([
    (0, method_1.Get)("/installment/note"),
    __param(0, (0, parameters_1.Query)({
        destination: "installmentId",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "getInstallmentNotes", null);
__decorate([
    (0, method_1.Post)("/installment"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            number: zod_1.z.string(),
            saiadNumber: zod_1.z.string(),
            bank: zod_1.z.string(),
            branch: zod_1.z.string(),
        })
    }))
], FinanceController.prototype, "updateInstallment", null);
__decorate([
    (0, method_1.Post)("/installments/confirm"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id,
    }))
], FinanceController.prototype, "confirmInstallments", null);
__decorate([
    (0, method_1.Post)("/installments/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            paymentId: controller_2.default.id,
            rejectMessage: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "rejectInstallments", null);
__decorate([
    (0, method_1.Post)("/installment/confirm"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "confirmInstallment", null);
__decorate([
    (0, method_1.Post)("/installment/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            // paymentId :BaseController.id,
            rejectMessage: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Admin)())
], FinanceController.prototype, "rejectInstallment", null);
__decorate([
    (0, method_1.Post)("/installment/penalty/forget"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "forgetPenalty", null);
__decorate([
    (0, method_1.Post)("/installment/penalty/link/send"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "sendPenaltyPayLink", null);
__decorate([
    (0, method_1.Post)("/installment/penalty/pay/wallet"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_2.default.id,
        destination: "id"
    }))
], FinanceController.prototype, "payPenaltyFromWallet", null);
__decorate([
    (0, method_1.Post)("/installment/check/change"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            installmentId: controller_2.default.id,
        })
    }))
], FinanceController.prototype, "changeInstallment", null);
__decorate([
    (0, method_1.Get)("/invoice"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "getInvoiceById", null);
__decorate([
    (0, method_1.Get)("/invoice/installment"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "getPaymentInstallments", null);
__decorate([
    (0, method_1.Get)("/pretext/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "q",
        schema: zod_1.z.string()
    }))
], FinanceController.prototype, "searchPreText", null);
__decorate([
    (0, method_1.Post)("/pretext"),
    __param(0, (0, parameters_1.Body)({
        destination: "text",
        schema: zod_1.z.string()
    }))
], FinanceController.prototype, "addPreText", null);
__decorate([
    (0, method_1.Delete)("/pretext"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "deletePreText", null);
__decorate([
    (0, method_1.Get)("/amount/minimum"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], FinanceController.prototype, "getMinimumAmount", null);
__decorate([
    (0, method_1.Post)("/check/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({ id: controller_2.default.id })
    }))
], FinanceController.prototype, "confirmCheck", null);
__decorate([
    (0, method_1.Post)("/check/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            rejectMessage: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "rejectCheck", null);
__decorate([
    (0, method_1.Post)("/check/edit"),
    __param(0, (0, parameters_1.Body)({
        schema: invoice_1.checkConfig.and(zod_1.z.object({
            id: controller_2.default.id,
            amount: zod_1.z.coerce.number().int().positive(),
            deadline: zod_1.z.coerce.date(),
        }))
    }))
], FinanceController.prototype, "editCheck", null);
__decorate([
    (0, method_1.Post)("/check/passed"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            account: controller_2.default.id.optional()
        })
    }))
], FinanceController.prototype, "checkPassed", null);
__decorate([
    (0, method_1.Post)("/check/returned"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
        })
    }))
], FinanceController.prototype, "checkReturned", null);
__decorate([
    (0, method_1.Get)("/checkes"),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_2.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_2.default.limit
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "status",
        schema: zod_1.z.enum([
            "inproccess",
            "returned",
            "arrived",
            "finished",
            "ended",
            "waitingForCancle",
            "readyForCancle"
        ]).optional()
    }))
], FinanceController.prototype, "getAllChecks", null);
__decorate([
    (0, method_1.Post)("/check/cancle/request"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            reSend: zod_1.z.boolean().optional(),
            isInstallmentId: zod_1.z.boolean().optional()
        })
    }))
], FinanceController.prototype, "cancleAndChangeCheckReq", null);
__decorate([
    (0, method_1.Post)("/check/cancle/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            code: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "confirmCancleAndChangeCheck", null);
__decorate([
    (0, method_1.Post)("/check/cancle/submit"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            code: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "submitCheckCancel", null);
__decorate([
    (0, method_1.Post)("/check/cancle/submit/request"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            reSend: zod_1.z.boolean().optional()
        })
    }))
], FinanceController.prototype, "requestSubmitCheckCancel", null);
__decorate([
    (0, method_1.Post)("/check/cancle"),
    __param(0, (0, parameters_1.Body)({
        schema: cancleAndChangeCheck
    }))
], FinanceController.prototype, "cancleAndChangeCheck", null);
__decorate([
    (0, method_1.Post)("/check/cancle/reject")
], FinanceController.prototype, "cancleAndChangeReject", null);
__decorate([
    (0, method_1.Post)("/check/place/change"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            placeType: zod_1.z.enum([
                "spend",
                "in-bank",
                "in-chest",
                "dein"
            ]),
            chestId: controller_2.default.id.optional(),
            spendInfo: zod_1.z.object({
                type: zod_1.z.string(),
                id: controller_2.default.id,
            }).optional(),
            bankInfo: zod_1.z.object({
                account: controller_2.default.id
            }).optional(),
            dein: zod_1.z.object({
                drodownType: zod_1.z.enum(["percentage", "static"]),
                volume: zod_1.z.coerce.number().positive(),
                account: controller_2.default.id
            }).optional()
        })
    }))
], FinanceController.prototype, "changeCheckPlace", null);
__decorate([
    (0, method_1.Post)("/cash/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            to: zod_1.z.enum([
                "chest",
                "bank"
            ]).default("bank"),
            bank: controller_2.default.id.optional(),
            chest: controller_2.default.id.optional(),
        })
    }))
], FinanceController.prototype, "confirmCash", null);
__decorate([
    (0, method_1.Post)("/cash/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            rejectMessage: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "rejectCash", null);
__decorate([
    (0, method_1.Post)("/cash/edit"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            amount: zod_1.z.coerce.number().int().positive(),
            deadline: zod_1.z.coerce.date()
        })
    }))
], FinanceController.prototype, "editCash", null);
__decorate([
    (0, method_1.Post)("/pos/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id
        })
    }))
], FinanceController.prototype, "confirmPOS", null);
__decorate([
    (0, method_1.Post)("/pos/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            rejectMessage: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "rejectPOS", null);
__decorate([
    (0, method_1.Post)("/pos/edit"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            pos: controller_2.default.id,
            amount: zod_1.z.coerce.number().int().positive(),
            deadline: zod_1.z.coerce.date(),
        })
    }))
], FinanceController.prototype, "editPOS", null);
__decorate([
    (0, method_1.Post)("/transfer/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({ id: controller_2.default.id })
    }))
], FinanceController.prototype, "confirmTransfer", null);
__decorate([
    (0, method_1.Post)("/transfer/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_2.default.id,
            rejectMessage: zod_1.z.string()
        })
    }))
], FinanceController.prototype, "rejectTransfer", null);
__decorate([
    (0, method_1.Post)("/transfer/edit"),
    __param(0, (0, parameters_1.Body)({
        schema: invoice_1.transferSchema.and(zod_1.z.object({
            id: controller_2.default.id,
            deadline: zod_1.z.coerce.date(),
            amount: zod_1.z.coerce.number().positive().int()
        }))
    }))
], FinanceController.prototype, "editTransfer", null);
__decorate([
    (0, method_1.Post)("/transfer/internal"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            fromId: controller_2.default.id,
            fromType: zod_1.z.enum([""]),
            toId: controller_2.default.id,
            toType: zod_1.z.enum([""]),
            amount: zod_1.z.coerce.number().positive(),
            fee: zod_1.z.coerce.number().positive(),
            date: zod_1.z.coerce.date(),
            description: zod_1.z.string(),
            referral: zod_1.z.string().optional()
        })
    }))
], FinanceController.prototype, "internalTransfer", null);
__decorate([
    (0, method_1.Post)("/payGateWay/link/sms"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id.optional()
    }))
], FinanceController.prototype, "sendPayLink", null);
