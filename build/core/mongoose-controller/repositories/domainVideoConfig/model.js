"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainVideoConfigModel = void 0;
const mongoose_1 = require("mongoose");
const domainVideoSchema = new mongoose_1.Schema({
    "upload-path": {
        type: new mongoose_1.Schema({
            fileManager: String,
            path: String
        }, {
            _id: false
        })
    },
    "editor-upload-size": {
        type: new mongoose_1.Schema({
            unit: {
                type: String,
                enum: ["MB", "GB"]
            },
            value: {
                type: Number,
            }
        }, {
            _id: false
        })
    },
    "download-size": {
        type: new mongoose_1.Schema({
            unit: {
                type: String,
                enum: ["MB", "GB"]
            },
            value: {
                type: Number,
            }
        }, {
            _id: false
        })
    },
    "upload-size": {
        type: new mongoose_1.Schema({
            unit: {
                type: String,
                enum: ["MB", "GB"]
            },
            value: {
                type: Number,
            }
        }, {
            _id: false
        })
    },
    "save-path": {
        type: new mongoose_1.Schema({
            fileManager: String,
            path: String
        }, {
            _id: false
        })
    },
    "quality-persent": {
        type: Number
    },
    "save-paths": {
        type: [new mongoose_1.Schema({
                fileManager: String,
                path: String,
                quality: String
            }, {
                _id: false
            })]
    },
    "save-main-source": {
        type: Boolean
    },
    "video-result-Suffixs": {
        type: [String]
    },
    "valid-Suffix": {
        type: [String]
    },
    "save-quality": {
        type: [String]
    },
    "auto-save-quality": {
        type: Boolean
    },
    domain: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "domain"
    },
    watermark: {
        type: Boolean,
        required: true,
        default: false
    },
    "watermark-config": {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "video-config"
    },
    type: {
        type: String,
        required: false
    }
});
exports.DomainVideoConfigModel = (0, mongoose_1.model)("domain-video-config", domainVideoSchema);
