"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentConfigPreTextModel = void 0;
const mongoose_1 = require("mongoose");
const paymentConfigPreTextSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: false
    }
});
exports.PaymentConfigPreTextModel = (0, mongoose_1.model)("payment-config-pretext", paymentConfigPreTextSchema);
