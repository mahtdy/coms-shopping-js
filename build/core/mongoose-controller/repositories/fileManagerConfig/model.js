"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerConfigModel = exports.FileManagerType = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
var FileManagerType;
(function (FileManagerType) {
    FileManagerType["objectStorage"] = "objectStorage";
    FileManagerType["ftp"] = "ftp";
})(FileManagerType || (exports.FileManagerType = FileManagerType = {}));
const fileManagerConfigSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: FileManagerType
    },
    hostUrl: {
        type: String,
        required: false
    },
    config: {
        type: Object,
        required: false
    },
    isDefault: {
        type: Boolean,
        required: true,
        default: false
    },
    isDefaultContent: {
        type: Boolean,
        required: true,
        default: false
    },
    isInternal: {
        type: Boolean,
        required: false,
    },
    totalSize: {
        type: Number,
        required: false,
        // megabyte
    },
    usedSize: {
        type: Number,
        required: false,
        // megabyte
    },
    maxSize: {
        type: Number,
        required: false
    },
    filesInfo: {
        type: Object,
        required: false
    },
    isBackup: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    readonly: {
        type: Boolean,
        required: true,
        default: false
    },
    used: {
        type: Boolean,
        required: false,
        default: false
    },
    mirrorCDN: {
        type: mongoose_1.Types.ObjectId,
        required: false,
    },
    backups: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        default: []
    },
    transfered: {
        type: Number,
        required: false
    }
});
exports.FileManagerConfigModel = (0, mongoose_1.model)('fileManagerConfig', fileManagerConfigSchema);
