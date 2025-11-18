"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseModel = void 0;
const mongoose_1 = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const warehouseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: false,
        maxLength: 250,
        default: "digital warehouse",
    },
    address: {
        type: String,
        required: false,
        maxLength: 500,
        default: "tehran",
    },
    phone: {
        type: String,
        required: true,
        maxLength: 11,
        default: "09123334444",
    },
    manager: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "user",
    },
    capacity: {
        type: Number,
        required: true,
        default: 1000,
    },
    is_active: {
        type: Boolean,
        required: false,
        default: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});
warehouseSchema.plugin(uniqueValidator, { message: "{PATH} is duplicated" });
exports.WarehouseModel = (0, mongoose_1.model)("warehouse", warehouseSchema);
