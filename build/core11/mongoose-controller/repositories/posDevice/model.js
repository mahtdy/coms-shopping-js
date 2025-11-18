"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POS_DeviceModel = void 0;
const mongoose_1 = require("mongoose");
const pos_DeviceSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    bankAccount: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "bank-account"
    },
    canDelete: {
        type: Boolean,
        required: true,
        default: true
    }
});
exports.POS_DeviceModel = (0, mongoose_1.model)("pos-device", pos_DeviceSchema);
