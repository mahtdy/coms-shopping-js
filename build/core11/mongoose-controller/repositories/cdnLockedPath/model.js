"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN_LockedPathModel = void 0;
const mongoose_1 = require("mongoose");
const CDN_LockedPathSchema = new mongoose_1.Schema({
    cdn: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "fileManagerConfig"
    },
    paths: {
        type: [String],
        required: true,
        default: []
    }
});
exports.CDN_LockedPathModel = (0, mongoose_1.model)("cdn_locked_path", CDN_LockedPathSchema);
//  CDN_LockedPathModel
