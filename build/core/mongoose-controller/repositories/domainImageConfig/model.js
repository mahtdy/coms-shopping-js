"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainImageConfigModel = void 0;
const mongoose_1 = require("mongoose");
const domainImageSchema = new mongoose_1.Schema({
    domain: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "domain"
    },
    lastUpdate: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    "upload-path": {
        type: new mongoose_1.Schema({
            fileManager: { type: String, required: true },
            path: { type: String, required: true },
        }, {
            _id: false
        }),
        required: true
    },
    "valid-Suffix": [{ type: String, required: true }],
    // "image-result-Suffixs": [{ type: String, required: true }],
    "nonConvert-Suffixs": [{ type: String, required: true }],
    "image-addressing": {
        type: String,
        enum: ["y-m-d", "y-m", "y", "y-n", "n", "y-m-n"],
        required: true,
    },
    "make-phone-image": { type: Boolean, default: false },
    "phone-width": { type: Number, required: true },
    "auto-translate-image-name": { type: Boolean, required: true },
    "auto-submit-removal-image": { type: Boolean, required: true },
    // watermark: { type: Boolean, required: true },
    // "watermark-config": {
    //     type: Types.ObjectId,
    //     required: false,
    //     ref: "waterMark"
    // },
    // type: { type: String },
    "main-image-result-Suffixs": [{ type: String, required: true }],
    "watermark-main": { type: Boolean, required: true },
    "main-watermark-config": {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "waterMark"
    },
    "main-remaked-compress": { type: Boolean, required: true },
    "main-remaked-compress-quality": { type: Number },
    "remove-main-image-src": { type: Boolean, required: true },
    "compress-main": { type: Boolean },
    "main-compress-quality": { type: Number },
    "show-big-image": { type: Boolean, required: true },
    // "in-content-remove-main-image-src" : {
    //     type : Boolean
    // }, 
    "in-content-image-result-Suffixs": [{ type: String, required: true }],
    "in-content-watermark": { type: Boolean, required: true },
    "in-content-watermark-config": {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "waterMark"
    },
    "in-content-compress": {
        type: Boolean,
        required: true
    },
    "in-content-compress-quality": {
        type: Number
    },
    "remove-in-content-main-image-src": {
        type: Boolean,
        required: true
    },
    "in-content-compress-main": {
        type: Boolean,
        required: false
    },
    "in-content-compress-main-quality": {
        type: Number,
        required: false
    },
    "show-in-content-main-image": {
        type: Boolean,
        required: true
    },
    "tempalte-image-result-Suffixs": [{ type: String, required: true }],
    "template-compress": {
        type: Boolean,
        required: true
    },
    "template-compress-quality": {
        type: Number
    },
});
exports.DomainImageConfigModel = (0, mongoose_1.model)("domain-image-config", domainImageSchema);
