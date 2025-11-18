"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseTransferModel = void 0;
const mongoose_1 = require("mongoose");
const warehouseTransferSchema = new mongoose_1.Schema({
    from_warehouse_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "warehouse",
    },
    to_warehouse_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "warehouse",
    },
    variant_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "product_variant",
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    batch_number: {
        type: String,
        required: true,
    },
    transfer_date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "canceled"],
        default: "pending",
    },
});
exports.WarehouseTransferModel = (0, mongoose_1.model)("warehouse_transfer", warehouseTransferSchema);
