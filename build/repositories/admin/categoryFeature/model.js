"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryFeatureModel = void 0;
const mongoose_1 = require("mongoose");
const categoryFeatureSchema = new mongoose_1.Schema({
    category: { type: mongoose_1.Types.ObjectId, required: true, ref: "category" },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ["select", "text", "number", "boolean"] },
    values: [
        {
            value: { type: String, required: true },
            priceAdjustment: { type: Number, required: false, default: 0 },
        },
    ],
    affectsPrice: { type: Boolean, default: false },
}, { timestamps: true });
exports.CategoryFeatureModel = (0, mongoose_1.model)("categoryFeature", categoryFeatureSchema);
