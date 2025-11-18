"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantyModel = void 0;
const mongoose_1 = require("mongoose");
const WarrantySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
    },
    duration: {
        value: {
            type: Number,
            required: true,
            min: 1,
        },
        unit: {
            type: String,
            required: true,
            enum: ["day", "month", "year"],
        },
    },
    pricingType: {
        type: String,
        required: true,
        enum: ["fixed", "percentage", "feature_based", "tiered"],
        index: true,
    },
    fixedPrice: {
        type: Number,
        min: 0,
    },
    percentagePrice: {
        type: Number,
        min: 0,
        max: 100,
    },
    featureBasedPricing: [{
            featureId: {
                type: mongoose_1.Schema.Types.ObjectId,
                required: true,
            },
            featureName: {
                type: String,
                required: true,
            },
            valuePrices: [{
                    value: mongoose_1.Schema.Types.Mixed,
                    additionalPrice: {
                        type: Number,
                        required: true,
                    },
                }],
        }],
    tieredPricing: [{
            minPrice: {
                type: Number,
                required: true,
                min: 0,
            },
            maxPrice: {
                type: Number,
                required: true,
                min: 0,
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            },
        }],
    services: [{
            title: {
                type: String,
                required: true,
            },
            description: String,
            isIncluded: {
                type: Boolean,
                default: true,
            },
        }],
    applicableCategories: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Category",
        }],
    applicableBrands: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Brand",
        }],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isPublic: {
        type: Boolean,
        default: true,
        index: true,
    },
    displayOrder: {
        type: Number,
        default: 0,
        index: true,
    },
    terms: String,
    validFrom: Date,
    validTo: Date,
}, {
    timestamps: true,
    versionKey: false,
});
WarrantySchema.index({ isActive: 1, isPublic: 1, displayOrder: 1 });
WarrantySchema.index({ applicableCategories: 1, isActive: 1 });
WarrantySchema.index({ applicableBrands: 1, isActive: 1 });
exports.WarrantyModel = (0, mongoose_1.model)("Warranty", WarrantySchema);
