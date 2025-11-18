"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductwarehouseModel = void 0;
const mongoose_1 = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const productwarehouseSchema = new mongoose_1.Schema({
    warehouse: {
        type: mongoose_1.Types.ObjectId,
        require: true,
        ref: "warehouse",
    },
    variant: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "productVariant",
    },
    product: {
        type: mongoose_1.Types.ObjectId,
        require: true,
        ref: "product",
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    variantPrice: {
        type: Number,
        required: true,
    },
    purchasePrice: {
        type: Number,
        required: true,
    },
    minStockThreshold: {
        type: Number,
        required: false,
        default: 10,
    },
    batchNumber: {
        type: String,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    config: {
        type: Object,
        require: false,
    },
    // cost: {
    //   type: Number,
    //   required: true,
    //   default: 0
    // },
});
productwarehouseSchema.plugin(uniqueValidator, {
    message: "{PATH} is duplicated",
});
exports.ProductwarehouseModel = (0, mongoose_1.model)("productwarehouse", productwarehouseSchema);
