"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantModel = void 0;
const mongoose_1 = require("mongoose");
const productVariantSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Types.ObjectId, required: true, ref: "product" },
    sku: { type: String, required: true, unique: true },
    features: [
        {
            featureId: { type: mongoose_1.Types.ObjectId, ref: "categoryFeature", required: false },
            name: { type: String, required: true },
            value: { type: String, required: true },
            priceAdjustment: { type: Number, required: false, default: 0 },
        },
    ],
    basePrice: { type: Number, required: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.ProductVariantModel = (0, mongoose_1.model)("productVariant", productVariantSchema);
