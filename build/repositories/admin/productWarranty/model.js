"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductWarrantyModel = void 0;
const mongoose_1 = require("mongoose");
const ProductWarrantySchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    warranty: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Warranty",
        required: true,
        index: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
        index: true,
    },
    customPrice: {
        type: Number,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
ProductWarrantySchema.index({ product: 1, warranty: 1 }, { unique: true });
ProductWarrantySchema.index({ product: 1, isDefault: 1 });
ProductWarrantySchema.index({ product: 1, isActive: 1 });
exports.ProductWarrantyModel = (0, mongoose_1.model)("ProductWarranty", ProductWarrantySchema);
