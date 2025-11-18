"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN_OperationModel = void 0;
const mongoose_1 = require("mongoose");
const CDN_OperationSchema = new mongoose_1.Schema({
    operation: {
        type: String,
        required: true,
        enum: [
            "copy",
            "copyToOther",
            "moveToOther",
            "move",
            "unzip",
            "zip",
            "download-folder",
            "delete",
            "restore",
            "hard-delete",
            "rename",
            "backup-restore"
        ]
    },
    admin: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "admin"
    },
    cdn: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "fileManagerConfig"
    },
    toCdn: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "fileManagerConfig"
    },
    type: {
        type: String,
        required: false
    },
    code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ["running", "failed", "successed"],
        default: "running"
    },
    checked: {
        type: Boolean,
        required: true,
        default: false
    },
    moveToHidden: {
        type: Boolean,
        required: false
    },
    atachment: {
        type: String,
        required: false
    },
    err: {
        type: Object,
        required: false
    },
    info: {
        type: Object,
        required: false
    }
});
exports.CDN_OperationModel = (0, mongoose_1.model)("cdn_operation", CDN_OperationSchema);
