"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountModel = void 0;
const mongoose_1 = require("mongoose");
const discountSchema = new mongoose_1.Schema({
    // user: { type: Types.ObjectId, ref: "user", required: false },
    disTitle: { type: String, required: true },
    disType: { type: String, enum: ["general", "special"], required: true },
    applyOnInvoice: { type: Boolean, required: true, default: false },
    autoApplyOnInvoice: { type: Boolean, required: true, default: false },
    disStart: { type: Date, required: true, default: () => new Date() },
    disEnd: { type: Date, required: true, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    firstInvoiceOnly: { type: Boolean, required: true, default: false },
    amountRange: {
        from: { type: Number, required: true },
        to: { type: Number, required: true },
    },
    disValue: {
        type: { type: String, enum: ["fixed", "random", "percent"], required: true },
        fixedAmount: { type: Number },
        randomRange: { from: { type: Number }, to: { type: Number } },
    },
    maxProfitLimit: { type: Boolean, required: true, default: true },
    usageCount: { type: Number, required: true, default: 1 },
    useInSpecialProducts: { type: Boolean, required: true, default: false },
    generateCode: { type: Boolean, required: true, default: true },
    codeSettings: {
        charCount: { type: Number },
        randomDigitCount: { type: Number },
        prefix: { type: String },
        type: { type: String, enum: ["letters", "numbers", "fixed"] },
        fixedValue: { type: String },
    },
    disCode: { type: String, unique: true },
    filters: {
        userFilter: {
            allUsers: { type: Boolean },
            gender: { type: String, enum: ["male", "female"] },
            ageRange: { from: { type: Number }, to: { type: Number } },
        },
        productFilter: {
            allProducts: { type: Boolean },
            category: [{ type: String }],
            brand: [{ type: String }],
        },
    },
    isActive: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, default: Date.now },
});
exports.DiscountModel = (0, mongoose_1.model)("Discount", discountSchema);
