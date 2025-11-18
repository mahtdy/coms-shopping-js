"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupLogModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const backupLogSchema = new mongoose_1.Schema({
    files: {
        type: [String],
        required: true,
        default: []
    },
    backupId: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "backup"
    },
    status: {
        enum: ["inProccess", "proccessed", "failed"],
        type: String,
        default: 'inProccess',
        required: true
    },
    start: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    end: {
        type: Date,
        required: false
    },
    cdn: {
        type: ObjectId,
        required: true,
        ref: "fileManagerConfig"
    },
    err: {
        type: String,
        required: false
    },
    fileSize: {
        type: Number,
        required: false
    },
    isDelete: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.BackupLogModel = (0, mongoose_1.model)('backupLog', backupLogSchema);
