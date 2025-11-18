"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class InstallmentRepository extends repository_1.default {
    constructor(options) {
        super(model_1.InstallmentModel, options);
    }
    // async installmentPaid(id: string | Types.ObjectId, transactionAmount: number , transactionId : string | Types.ObjectId) {
    //     try {
    //         let installment = await this.findById(id)
    //         if (installment != null) {
    //             let additionalPrice = 0
    //             let paidPrice = 0
    //             let remainedPrice = installment.finalPrice - installment.paidPrice
    //             let fullPaid = false
    //             if (transactionAmount >= remainedPrice) {
    //                 let penalty = installment.penalty
    //                 let query: any = {
    //                     $set: {
    //                         paidPrice: installment.finalPrice,
    //                         paid: true,
    //                         paidAt: new Date()
    //                     }
    //                 }
    //                 if (penalty + remainedPrice <= transactionAmount) {
    //                     query["$set"]["penalty"] = 0
    //                     query["$set"]["penaltypaid"] = true
    //                     additionalPrice = transactionAmount - (penalty + remainedPrice)
    //                 }
    //                 else {
    //                     query["$set"]["penalty"] = penalty + remainedPrice - transactionAmount
    //                 }
    //                 query["$push"] = { "transactions": transactionId }
    //                 await this.updateOne({
    //                     _id: id
    //                 }, query)
    //                 fullPaid = true
    //             }
    //             else {
    //                 let query: any = {
    //                     $set: {
    //                         paidPrice: installment.paidPrice + transactionAmount,
    //                     },
    //                     $push: {
    //                         "transactions": transactionId
    //                     }
    //                 }
    //                 await this.updateOne({
    //                     _id: id
    //                 }, query)
    //             }
    //             await this.paymentConfigRepo.installmentPaid(installment.paymentConfig as any, transactionAmount, fullPaid )
    //             return {
    //                 additionalPrice,
    //             }
    //         }
    //     } catch (error) {   
    //         throw error
    //     }
    // }
    async installmentPaid(payed) {
    }
    async canclePaymentInstallments(paymentId) {
        try {
            let paymentConfig = await this.paymentConfigRepo.findOne({
                _id: paymentId
            });
            if (paymentConfig != null) {
                let installments = await this.findAll({
                    paymentConfig: paymentConfig._id,
                    iscanceled: false,
                    paid: false
                });
                for (let i = 0; i < installments.length; i++) {
                    await this.updateOne({
                        _id: installments[i]._id
                    }, {
                        $set: {
                            iscanceled: true
                        }
                    });
                    await this.transactionRepo.updateMany({
                        installmentId: installments[i]._id,
                        status: {
                            $nin: ["success", "failed", "confirmed"]
                        }
                    }, {
                        $set: {
                            status: "canceled"
                        }
                    });
                }
                await this.paymentConfigRepo.updateOne({
                    _id: paymentConfig._id
                }, {
                    $set: {
                        status: "ended"
                    }
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async confirmInstallments(id) {
        try {
            await this.updateMany({
                paymentConfig: id
            }, {
                $set: {
                    status: "duringPayment"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async confirmInstallment(installmentId, session) {
        try {
            return await this.updateOne({
                _id: installmentId
            }, {
                $set: {
                    status: "confirmed"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectInstallments(paymentConfigId, session) {
        try {
            await this.updateMany({
                paymentConfig: paymentConfigId,
            }, {
                $set: {
                    status: "rejected"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectInstallment(installmentId, rejectMessage, session) {
        try {
            return await this.updateOne({
                _id: installmentId
            }, {
                $set: {
                    status: "rejected",
                    rejectMessage
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async installmentUpdated(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    isUpdated: true,
                    updateAt: new Date()
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async chageInstallment(id, transactionId, payment) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "waitingForCancle",
                    changed: true,
                    payment
                },
                $push: {
                    transactions: {
                        $each: [transactionId],
                        $position: 0
                    }
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async addInstallmentPayment(id, payment) {
        try {
            await this.updateOne({
                _id: id
            }, {
                payment
            });
        }
        catch (error) {
            throw error;
        }
    }
    // async installmentPaid(id : string ,withPenalty ?: boolean ){
    //     try {
    //         let installment = await this.findById(id)
    //         if(installment != null){
    //             if(installment.status == "paid"){
    //                 return
    //             }
    //             let status = "paid"
    //             if(installment.penalty > 0){
    //                 // status = ""
    //                 if(withPenalty == true){
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         throw error
    //     }
    // }
    async forgetPenalty(id) {
        try {
            let q = {
                penaltyForget: true,
                penalty: 0
            };
            let installment = await this.findById(id);
            if (installment == null) {
                return;
            }
            if ((installment === null || installment === void 0 ? void 0 : installment.status) == "paidWithoutPenalty") {
                q["status"] = "paidWithDelay";
            }
            await this.updateOne({
                _id: id
            }, {
                $set: q
            });
        }
        catch (error) {
            throw error;
        }
    }
    async penaltyPaid(id) {
    }
}
exports.default = InstallmentRepository;
