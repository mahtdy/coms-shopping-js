"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModel = exports.invoiceSchema = void 0;
const mongoose_1 = require("mongoose");
exports.invoiceSchema = new mongoose_1.Schema({
    factorNumber: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    paymentType: {
        type: String,
        required: false,
        enum: ["installment", "multi-stage", "simple"]
    },
    netPrice: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    finalPrice: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    paidPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalPaidPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalRemainedPrice: {
        type: Number,
        required: true
    },
    remainedPrice: {
        type: Number,
        required: true,
    },
    waitForConfirmPrice: {
        type: Number,
        required: true,
        default: 0
    },
    unrefinedPrice: {
        type: Number,
        required: true,
        default: 0
    },
    interest: {
        type: Number,
        required: true,
        default: 0
    },
    penalty: {
        type: Number,
        required: true,
        default: 0
    },
    discountId: {
        type: mongoose_1.Types.ObjectId,
        required: false,
    },
    discount: {
        type: mongoose_1.Types.ObjectId,
        required: false,
    },
    paidAt: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ["expired", "waiting", "paid", "canceled", "paying"],
        defualt: "waiting"
    },
    deadline: {
        type: Date,
        required: false
    },
    attachments: {
        type: [String],
        required: false,
    },
    ownerType: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose_1.Types.ObjectId,
        refPath: "ownerType"
    },
});
exports.InvoiceModel = (0, mongoose_1.model)("invoice", exports.invoiceSchema);
