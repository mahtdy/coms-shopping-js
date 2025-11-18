"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryHistoryModel = void 0;
const mongoose_1 = require("mongoose");
const inventoryHistorySchema = new mongoose_1.Schema({
    inventory_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "inventory",
    },
    change_type: {
        type: String,
        enum: ["purchase", "sale", "transfer", "adjustment"],
        required: true,
    },
    quantity_changed: {
        type: Number,
        required: true,
    },
    batch_number: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});
exports.InventoryHistoryModel = (0, mongoose_1.model)("inventory_history", inventoryHistorySchema);
