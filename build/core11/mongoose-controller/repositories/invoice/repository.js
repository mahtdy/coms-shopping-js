"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../system/repository"));
const repository_2 = __importDefault(require("../../repository"));
const repository_3 = __importDefault(require("../paymentConfig/repository"));
class InvoiceRepository extends repository_2.default {
    // paymentConfigRepo : PaymentConfigRepository
    constructor(collection, options) {
        super(collection, options);
        this.systemConfigRepo = new repository_1.default();
        this.paymentConfigRepo = new repository_3.default();
    }
    //////////////////////////// paidFrom wallet //////////////////////////
    async payFromWallet(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    totalRemainedPrice: -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async acceptInstallments(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    unrefinedPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    ////////////////////////// check ///////////////////////////
    async acceptCheck(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    unrefinedPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCheck(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editCheck(id, amountDiff, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: amountDiff
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async checkPassed(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    unrefinedPrice: -amount,
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async checkReplaced(id, amount, session) {
        await this.updateOne({
            _id: id
        }, {
            $inc: {
                unrefinedPrice: -amount,
                waitForConfirmPrice: amount
            }
        });
    }
    ///////////////////////// check ///////////////////////////
    ///////////////////////// cash //////////////////////////
    async acceptCash(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    totalRemainedPrice: -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCash(id, amount) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editCash(id, amountDiff, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: amountDiff
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    ///////////////////////// cash ///////////////////////////  
    //////////////////////////  pos //////////////////////////
    async acceptPOS(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    totalRemainedPrice: -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectPOS(id, amount) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editPOS(id, amountDiff, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: amountDiff
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    ///////////////////////// pos //////////////////////////
    ///////////////////////// transfer /////////////////////////
    async acceptTransfer(id, amount, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    totalRemainedPrice: -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectTransfer(id, amount) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: -amount
                }
            }, {
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editTransfer(id, amountDiff, session) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc: {
                    waitForConfirmPrice: amountDiff
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    ///////////////////////// transfer ///////////////////////////////
    // async transactionPaid(id : string | Types.ObjectId ,transaction : Transaction){
    //     try {
    //         let invoice = await this.findById(
    //             id
    //         )
    //         if(invoice == null){
    //             return
    //         }
    //         if(transaction.installmentId != undefined){
    //            let additionalPrice = await this.installmentRepo.installmentPaid(transaction.installmentId,transaction.amount,transaction._id)
    //         }
    //         else if(transaction.paymentConfig) {
    //            await this.paymentConfigRepo.transactionPaid(
    //             transaction.paymentConfig,
    //             transaction.amount,
    //             transaction._id
    //            )
    //         }
    //     } catch (error) {
    //         throw error
    //     }
    // }
    async getFactorNumber() {
        let number = await this.systemConfigRepo.getConfigValue("invoice-number");
        if (number == undefined) {
            await this.systemConfig.insert({
                key: "invoice-number",
                value: 1001,
                lable: "jarahan",
                type: "Number"
            });
            number = 1000;
        }
        else {
            await this.systemConfigRepo.updateOne({
                key: "invoice-number",
            }, {
                $set: {
                    value: number + 1
                }
            });
        }
        return number + 1;
    }
    async insert(document, options) {
        try {
            let number = await this.getFactorNumber();
            document.factorNumber = number + 1;
            let r = await super.insert(document);
            await this.emitInvoice(r._id);
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    async emitInvoice(id) {
        try {
        }
        catch (error) {
        }
    }
}
exports.default = InvoiceRepository;
