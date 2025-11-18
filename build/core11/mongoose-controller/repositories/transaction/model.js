"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ["payBack", "pay", "installment", "prePay", "chargeAccount", "chargeAccountInstallment", "withdraw"]
    },
    transactionType: {
        type: String,
        required: true,
        enum: ["deposit", "withdraw", "transmission"],
        default: "deposit"
    },
    amount: {
        type: Number,
        required: true
    },
    payType: {
        type: String,
        required: true,
        enum: ["payGateWay", "cash", "transfer", "check", "pos", "wallet"]
    },
    status: {
        type: String,
        required: true,
        enum: ["success", "failed", "rejected", "waiting", "confirmed", "canceled", "returned"]
    },
    ispaid: {
        type: Boolean,
        required: true
    },
    attachments: {
        type: [String],
        required: true
    },
    invoice: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "invoice"
    },
    installmentId: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "installment"
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    deadline: {
        type: Date,
        required: false
    },
    paidAt: {
        type: Date,
        required: false
    },
    failedAt: {
        type: Date,
        required: false
    },
    successAt: {
        type: Date,
        required: false
    },
    info: {
        type: new mongoose_1.Schema({
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
    owner: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        refPath: "ownerType"
    },
    ownerType: {
        type: String,
        required: false
    },
    paymentConfig: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "paymentConfig"
    },
    payGateway: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "payment-gateway"
    },
    posId: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "pos-device"
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
                ref: "bank-account",
                required: true
            }
        }),
        required: false
    },
    dein: {
        type: new mongoose_1.Schema({
            drodownType: {
                type: String,
                required: true,
                enum: ["percentage", "static"]
            },
            volume: {
                type: Number,
                required: true
            },
            account: {
                type: mongoose_1.Types.ObjectId,
                ref: "bank-account",
                required: true
            }
        }),
        required: false
    },
    description: {
        type: String,
        required: true,
        default: " "
    }
});
exports.TransactionModel = (0, mongoose_1.model)("transaction", transactionSchema);
