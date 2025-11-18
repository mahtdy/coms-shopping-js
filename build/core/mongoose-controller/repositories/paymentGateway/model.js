"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayModel = void 0;
const mongoose_1 = require("mongoose");
const paymentGatewaySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    // name : {
    //     type : String,
    //     required : true
    // },
    type: {
        type: String,
        required: true,
        enum: [
            "melat",
            "saderat",
            "meli",
            "eghtesad-novin",
            "saman",
            "ap",
            "parsian",
            "pasargad",
            "id-pay",
            "zarinpal",
            "pay",
            "nextpay",
            "test"
        ]
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    isRegistered: {
        type: Boolean,
        required: true,
        default: false
    },
    bankAccount: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "bank-account"
    },
    canDelete: {
        type: Boolean,
        required: true,
        default: true
    },
    config: {
        type: Object,
        required: true
    },
    domain: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "domain"
    }
});
exports.PaymentGatewayModel = (0, mongoose_1.model)("payment-gateway", paymentGatewaySchema);
