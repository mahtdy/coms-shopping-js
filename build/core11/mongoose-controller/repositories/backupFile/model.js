"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupFileModel = void 0;
const mongoose_1 = require("mongoose");
const backupFileSchema = new mongoose_1.Schema({
    backCDN: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    cdn: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    backFile: {
        type: String,
        required: true
    },
    cdnFile: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        required: true,
        default: () => new Date()
    }
});
exports.BackupFileModel = (0, mongoose_1.model)("backup-file", backupFileSchema);
