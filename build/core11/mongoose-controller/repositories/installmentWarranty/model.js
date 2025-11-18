"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentWarrantyModel = void 0;
const mongoose_1 = require("mongoose");
const installmentWarrantySchema = new mongoose_1.Schema({
    installment: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "installment"
    },
    type: {
        type: String,
        enum: ["check", "other"],
        required: true
    },
    info: {
        type: Object,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    attachments: {
        type: [String],
        required: false
    },
    checkStatus: {
        type: String,
        required: false
    }
});
exports.InstallmentWarrantyModel = (0, mongoose_1.model)("installment-warranty", installmentWarrantySchema);
