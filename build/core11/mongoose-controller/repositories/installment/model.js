"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentModel = void 0;
const mongoose_1 = require("mongoose");
const installmentSchema = new mongoose_1.Schema({
    number: {
        type: Number,
        required: true
    },
    netPrice: {
        type: Number,
        required: true
    },
    interest: {
        type: Number,
        required: true
    },
    penalty: {
        type: Number,
        required: false
    },
    finalPrice: {
        type: Number,
        required: true
    },
    transactions: {
        type: [mongoose_1.Types.ObjectId],
        ref: "transaction",
        required: false
    },
    invoice: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "invoice"
    },
    penaltypaid: {
        type: Boolean,
        required: false
    },
    deadline: {
        type: Date,
        required: true
    },
    notes: {
        type: [{
                date: Date,
                note: String,
                admin: {
                    type: mongoose_1.Types.ObjectId,
                    ref: "admin",
                    required: true
                }
            }],
        required: true,
        default: []
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
    paymentConfig: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "payment-config"
    },
    payment: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "payment-config"
    },
    paid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date,
        required: false,
    },
    paidPrice: {
        type: Number,
        required: true,
        default: 0
    },
    iscanceled: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        enum: [
            "rejected",
            "waiting",
            "confirmed",
            "duringPayment",
            "paid",
            "paidWithDelay",
            "arrived",
            "paidWithoutPenalty",
            "canceled"
        ],
        default: "waiting",
        required: true
    },
    rejectMessage: {
        type: String,
        required: false
    },
    isUpdated: {
        type: Boolean,
        required: false
    },
    updateAt: {
        type: Date,
        required: false
    },
    changed: {
        type: Boolean,
        required: false
    },
    penaltyForget: {
        type: Boolean,
        required: false
    }
});
exports.InstallmentModel = (0, mongoose_1.model)("installment", installmentSchema);
