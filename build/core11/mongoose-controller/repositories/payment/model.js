"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    factor: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    type: {
        type: String,
        required: true,
        enum: ["pre-pay", "installment", "multi-stage", "simple"]
    },
    payType: {
        type: String,
        enum: ["check", "payGateWay", "transfer", "cash"]
    },
    status: {
        type: String,
        enum: ["waiting", "paid", "confirmed", "rejected"]
    },
    deadline: {
        type: Date,
        required: true,
    },
    info: {
        type: Object,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});
exports.PaymentModel = (0, mongoose_1.model)("payment", paymentSchema);
