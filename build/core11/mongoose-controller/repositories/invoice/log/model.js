"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceLogModel = void 0;
const mongoose_1 = require("mongoose");
const invoiceLogSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: [
            "accept-check",
            "reject-check",
            "change-check",
            "pay-installment",
            "pay-pre-pay",
            "pay-penalty",
            "pay",
            "charge-wallet-for-pay",
            "add-installment",
            "forgive-penalty",
            "forgive-all-penalties",
            "delete-payment-config"
        ]
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        default: {}
    },
    invoice: {
        type: mongoose_1.Types.ObjectId,
        ref: "invoice",
        required: true
    },
    beforeData: {
        type: Number,
        required: true
    },
    afterMony: {
        type: Number,
        required: true
    }
});
exports.InvoiceLogModel = (0, mongoose_1.model)("invoice-log", invoiceLogSchema);
