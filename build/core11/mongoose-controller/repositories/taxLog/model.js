"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxLogModel = void 0;
const mongoose_1 = require("mongoose");
const taxLogSchema = new mongoose_1.Schema({
    invoice: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ["increase", "decrease"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: new Date()
    }
});
exports.TaxLogModel = (0, mongoose_1.model)("tax-log", taxLogSchema);
