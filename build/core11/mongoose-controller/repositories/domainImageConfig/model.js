"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainImageConfigModel = void 0;
const mongoose_1 = require("mongoose");
const domainImageSchema = new mongoose_1.Schema({
    "upload-path": {
        type: new mongoose_1.Schema({
            fileManager: String,
            path: String
        }, {
            _id: false
        })
    },
    "valid-Suffix": {
        type: [String]
    },
    "image-result-Suffixs": {
        type: [String]
    },
    "nonConvert-Suffixs": {
        type: [String]
    },
    "image-addressing": {
        type: String
    },
    "convert-main": {
        type: Boolean
    },
    "compress-main": {
        type: Boolean
    },
    "make-phone-image": {
        type: Boolean,
        required: true,
        default: true
    },
    "compress-quality": {
        type: Number,
        required: true,
        default: 80
    },
    "phone-width": {
        type: Number,
        required: true,
        default: 500,
        min: 300,
        max: 500
    },
    domain: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "domain"
    },
    "watermark-main": {
        type: Boolean
    },
    "main-watermark-config": {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "waterMark"
    },
    watermark: {
        type: Boolean,
        required: true,
        default: false
    },
    "watermark-config": {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "waterMark"
    },
    type: {
        type: String,
        required: false
    }
});
exports.DomainImageConfigModel = (0, mongoose_1.model)("domain-image-config", domainImageSchema);
