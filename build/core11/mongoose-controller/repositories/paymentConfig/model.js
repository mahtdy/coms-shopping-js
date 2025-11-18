"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentConfigModel = void 0;
const mongoose_1 = require("mongoose");
const paymentConfigSchema = new mongoose_1.Schema({
    createAt: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    invoice: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "invoice"
    },
    type: {
        type: String,
        enum: [
            "installment",
            "simple"
        ],
        required: true
    },
    payFor: {
        type: String,
        enum: [
            "invoice",
            "chargeAccount",
            "loan",
            "installment",
            "penalty"
        ],
        default: "invoice",
        required: true
    },
    replacedFrom: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "payment-config",
    },
    replacedBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "payment-config",
    },
    payment: {
        type: mongoose_1.Types.ObjectId,
        ref: "payment-config",
        required: false
    },
    loanAttchments: {
        type: Object,
        required: false
    },
    attachmentConfirmed: {
        type: Boolean,
        required: false
    },
    payPort: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "payment-gateway"
    },
    installmentConfig: {
        type: new mongoose_1.Schema({
            prePay: {
                type: Number,
                required: true
            },
            prePayDeadline: {
                type: Date,
                required: false
            },
            prePayTransaction: {
                type: mongoose_1.Types.ObjectId,
                required: false,
                ref: "transaction"
            },
            formula: {
                type: String,
                enum: [
                    "banking",
                    "market"
                ],
                required: true
            },
            paidCount: {
                type: Number,
                required: true,
                default: 0
            },
            paidAmount: {
                type: Number,
                required: true,
                default: 0
            },
            hasLateness: {
                type: Boolean,
                required: true,
                default: false
            },
            remainedPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                required: true
            },
            count: {
                type: Number,
                required: true
            },
            period: {
                type: Number,
                required: true
            },
            interestRate: {
                type: Number,
                required: true
            },
            payType: {
                type: String,
                enum: [
                    "check",
                    "payGateWay",
                    "other"
                ],
                required: false
            },
            lastInstallmentDeadline: {
                type: Date,
                required: false
            },
            prePayPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            havePenalty: {
                type: Boolean,
                required: false
            },
            warranties: {
                type: [mongoose_1.Types.ObjectId],
                required: false,
                ref: "installment-warranty"
            },
            bankFees: {
                type: Number,
                required: true,
                default: 0
            },
            bankFeesPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            installmentConfirmed: {
                type: Boolean,
                required: true,
                default: false
            },
            loanTemplate: {
                type: mongoose_1.Types.ObjectId,
                ref: "loan-template",
                required: false
            },
            loanPeriod: {
                type: mongoose_1.Types.ObjectId,
                required: false
            },
            overdueAmount: {
                type: Number,
                required: true,
                default: 0
            },
            overdueCount: {
                type: Number,
                required: true,
                default: 0
            },
            penalty: {
                type: Number,
                required: true,
                default: 0
            },
            nextStep: {
                type: String,
                required: true,
                enum: [
                    "initialApproval",
                    "documentSubmission",
                    "checks",
                    "guarantors",
                    "finalApproval",
                    "rejected",
                    "completed"
                ],
                default: "initialApproval"
            },
            restPeriod: {
                type: Number,
                required: true,
                default: 0
            },
            confirmedAt: {
                type: Date,
                required: false
            },
            depositAt: {
                type: Date,
                required: false
            },
            payStart: {
                type: Date,
                required: false
            }
        }),
        required: false
    },
    exLoan: {
        type: new mongoose_1.Schema({
            prePay: {
                type: Number,
                required: true
            },
            prePayDeadline: {
                type: Date,
                required: false
            },
            prePayTransaction: {
                type: mongoose_1.Types.ObjectId,
                required: false,
                ref: "transaction"
            },
            formula: {
                type: String,
                enum: [
                    "banking",
                    "market"
                ],
                required: true
            },
            paidCount: {
                type: Number,
                required: true,
                default: 0
            },
            paidAmount: {
                type: Number,
                required: true,
                default: 0
            },
            hasLateness: {
                type: Boolean,
                required: true,
                default: false
            },
            remainedPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                required: true
            },
            count: {
                type: Number,
                required: true
            },
            period: {
                type: Number,
                required: true
            },
            interestRate: {
                type: Number,
                required: true
            },
            payType: {
                type: String,
                enum: [
                    "check",
                    "payGateWay",
                    "other"
                ],
                required: false
            },
            lastInstallmentDeadline: {
                type: Date,
                required: false
            },
            prePayPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            havePenalty: {
                type: Boolean,
                required: false
            },
            warranties: {
                type: [mongoose_1.Types.ObjectId],
                required: false,
                ref: "installment-warranty"
            },
            bankFees: {
                type: Number,
                required: true,
                default: 0
            },
            bankFeesPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            installmentConfirmed: {
                type: Boolean,
                required: true,
                default: false
            },
            loanTemplate: {
                type: mongoose_1.Types.ObjectId,
                ref: "loan-template",
                required: false
            },
            loanPeriod: {
                type: mongoose_1.Types.ObjectId,
                required: false
            },
        }),
        required: false
    },
    loanDeposited: {
        type: Boolean,
        required: false
    },
    status: {
        type: String,
        enum: [
            "inproccess",
            "finished",
            "returned",
            "arrived",
            "ended",
            "rejected",
            "waiting",
            "waitingForCancle",
            "readyForCancle"
        ],
        default: "waiting",
        required: true
    },
    code: {
        type: String,
        required: false
    },
    submitCode: {
        type: String,
        required: false
    },
    codeConfirmed: {
        type: Boolean,
        required: false
    },
    cancelConfirmed: {
        type: Boolean,
        required: false
    },
    trakingCode: {
        type: String,
        required: false
    },
    rejectMessage: {
        type: String,
        required: false
    },
    owner: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        refPath: "ownerType"
    },
    ownerType: {
        type: String,
        required: true
    },
    transaction: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "transaction"
    },
    payType: {
        type: String,
        enum: [
            "payGateWay",
            "cash",
            "transfer",
            "check",
            "pos",
            "wallet"
        ],
        required: false
    },
    info: {
        type: new mongoose_1.Schema({
            interestRate: Number,
            havePenalty: Boolean,
            number: String,
            saiadNumber: String,
            bank: String,
            branch: String,
            source: String,
            destination: {
                type: mongoose_1.Types.ObjectId,
                required: false,
                ref: "bank-account"
            },
            code: String,
            account: {
                type: mongoose_1.Types.ObjectId,
                required: false,
                ref: "bank-account"
            },
            pos: {
                type: mongoose_1.Types.ObjectId,
                required: false,
                ref: "pos-device"
            },
        }),
        required: false
    },
    deadline: {
        type: Date,
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    realAmount: {
        type: Number,
        required: false
    },
    paidAmount: {
        type: Number,
        required: true,
        default: 0
    },
    paidAt: {
        type: Date,
        required: false
    },
    bankAccount: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "bank-account"
    },
    chest: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "chest"
    },
    placeType: {
        type: String,
        enum: [
            "spend",
            "in-bank",
            "in-chest",
            "dein"
        ],
        required: false
    },
    spendInfo: {
        type: new mongoose_1.Schema({
            type: {
                type: String,
                required: true
            },
            id: {
                type: mongoose_1.Types.ObjectId,
                required: true,
                refPath: "spendInfo.type"
            }
        }),
        required: false
    },
    bankInfo: {
        type: new mongoose_1.Schema({
            account: {
                type: mongoose_1.Types.ObjectId,
                required: true,
                ref: "bank-account"
            },
        }),
        required: false
    },
    dein: {
        type: new mongoose_1.Schema({
            drodownType: {
                type: String,
                enum: [
                    "percentage",
                    "static"
                ],
                required: true
            },
            volume: {
                type: Number,
                required: true
            },
            account: {
                type: mongoose_1.Types.ObjectId,
                required: true,
                ref: "bank-account"
            }
        }),
        required: false,
    },
    penalty: {
        type: Number,
        required: true,
        default: 0
    },
    penaltypaid: {
        type: Boolean,
        required: false
    },
    installment: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "installment"
    },
    penaltyForget: {
        type: Boolean,
        required: false
    }
});
exports.PaymentConfigModel = (0, mongoose_1.model)("payment-config", paymentConfigSchema);
