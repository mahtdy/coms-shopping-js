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
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const zod_1 = require("zod");
class TransactionController extends controller_1.default {
    constructor(baseRoute, repo, invoiceRepo, options) {
        super(baseRoute, repo, options);
        this.invoiceRepo = invoiceRepo;
    }
    async confirmTransaction(data) {
        try {
            let transaction = await this.repository.findById(data.id);
            if (transaction == null) {
                return {
                    status: 404
                };
            }
            if (transaction.status == "success" || transaction.status == "confirmed") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا تایید شده است"
                };
            }
            if (transaction.status == "failed" || transaction.status == "canceled" || transaction.status == "rejected") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا رد شده است"
                };
            }
            await this.repository.confirmTransaction(data.id);
            if ((transaction === null || transaction === void 0 ? void 0 : transaction.invoice) != undefined) {
                await this.invoiceRepo.transactionPaid(transaction.invoice, transaction);
            }
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectTransaction(data) {
        try {
            let transaction = await this.repository.findById(data.id);
            if (transaction == null) {
                return {
                    status: 404
                };
            }
            if (transaction.status == "success" || transaction.status == "confirmed") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا تایید شده است"
                };
            }
            if (transaction.status == "failed" || transaction.status == "canceled" || transaction.status == "rejected") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا رد شده است"
                };
            }
            await this.repository.rejectTransaction(data.id);
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async acceptCheck(id) {
        try {
            let transaction = await this.repository.findOne({
                _id: id
            }, {}, [{
                    path: "owner"
                }]);
            if (transaction == null) {
                return {
                    status: 404,
                    message: "این تراکنش وجود ندارد"
                };
            }
            if (transaction.status == "rejected") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا رد شده است"
                };
            }
            if (transaction.status == "canceled") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا لغو شده است"
                };
            }
            if (transaction.status == "confirmed") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا تایید شده است"
                };
            }
            if (transaction.status == "success") {
                return {
                    status: 400,
                    message: "این تراکنش قبلا تایید شده است"
                };
            }
            await this.doAcceptCheck(id);
            await this.notifyCheckAccept(id);
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async changeCheck(id) {
        return {};
    }
    async changeCheckConfirm() {
    }
    async acceptManyCheck(ids) {
        try {
            let isExists = await this.repository.isExists({
                id: {
                    $in: ids
                },
                $or: [
                    {
                        status: {
                            $ne: "waiting"
                        }
                    },
                    {
                        payType: {
                            $ne: "check"
                        }
                    }
                ]
            });
            if (isExists) {
                return {
                    status: 400,
                    message: "تعدادی از تراکنش  قابل تایید نیستند"
                };
            }
            let count = await this.repository.getcount({
                _id: {
                    $in: ids
                },
            });
            if (count != ids.length) {
                return {
                    status: 400,
                    message: "تعدادی از تراکنش  قابل تایید نیستند"
                };
            }
            for (let i = 0; i < ids.length; i++) {
                await this.doAcceptCheck(ids[i]);
            }
            await this.notifyChecksAccept(ids);
            // await this.notifyCheckAccept(id)
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCheck(id) {
        return {};
    }
    async confirmPayPort() {
        try {
        }
        catch (error) {
        }
        return {
            status: 200
        };
    }
    async doAcceptCheck(id) {
        try {
            let check = await this.repository.acceptCheck(id);
            if (check === null || check === void 0 ? void 0 : check.invoice) {
                let invoice = await this.invoiceRepo.findByIdAndUpdate(check.invoice, {
                    $inc: {
                        unrefinedPrice: check.amount,
                        waitForConfirmPrice: -check.amount
                    }
                });
            }
            await this.notifyCheckAccept(id);
        }
        catch (error) {
            throw error;
        }
    }
    async notifyCheckAccept(id) {
        try {
            // await this.repository.notifyAcceptCheck(id)
        }
        catch (error) {
            throw error;
        }
    }
    async notifyChecksAccept(ids) {
        try {
            // await this.repository.notifyAcceptCheck(id)
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("es/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("es/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.default = TransactionController;
__decorate([
    (0, method_1.Post)("/confirm"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({ id: controller_1.default.id })
    }))
], TransactionController.prototype, "confirmTransaction", null);
__decorate([
    (0, method_1.Post)("/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({ id: controller_1.default.id })
    }))
], TransactionController.prototype, "rejectTransaction", null);
__decorate([
    (0, method_1.Post)("/check/accept"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_1.default.id.optional(),
        destination: "id"
    }))
], TransactionController.prototype, "acceptCheck", null);
__decorate([
    (0, method_1.Post)("/check/change"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_1.default.id.optional(),
        destination: "id"
    }))
], TransactionController.prototype, "changeCheck", null);
__decorate([
    (0, method_1.Post)("/check/change/confirm")
], TransactionController.prototype, "changeCheckConfirm", null);
__decorate([
    (0, method_1.Post)("/check/accept/many"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.array(controller_1.default.id),
        destination: "ids"
    }))
], TransactionController.prototype, "acceptManyCheck", null);
__decorate([
    (0, method_1.Post)("/check/reject"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_1.default.id.optional(),
        destination: "id"
    }))
], TransactionController.prototype, "rejectCheck", null);
__decorate([
    (0, method_1.Get)("/myfinanc1/api/docs", {
        absolute: true,
        loginRequired: false
    })
], TransactionController.prototype, "confirmPayPort", null);
