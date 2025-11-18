"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN_Transfer_Model = void 0;
const mongoose_1 = require("mongoose");
const cdnTransferSchema = new mongoose_1.Schema({
    from: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    to: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    startAt: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    finishedAt: {
        type: Date,
        required: false
    },
    isBackup: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        required: true,
        enum: ["running", "success", "faild"],
        default: "running"
    },
    err: {
        type: Object,
        required: false
    }
});
exports.CDN_Transfer_Model = (0, mongoose_1.model)("cdn_transfer", cdnTransferSchema);
