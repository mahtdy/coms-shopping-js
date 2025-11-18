"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const uniqueValidator = require('mongoose-unique-validator');
const languageSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    panelTitle: {
        type: String,
        required: true
    },
    sign: {
        type: String,
        required: true,
        unique: true
    },
    direction: {
        type: String,
        enum: ["rtl", "ltr"],
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    translation: {
        type: Object,
        required: true,
        default: {}
    },
    fileURL: {
        type: String,
        required: false
    },
    panelFileURL: {
        type: String,
        required: false
    },
    filePath: {
        type: String,
        required: false
    },
    panelFilePath: {
        type: String,
        required: false
    },
    isDomain: {
        type: Boolean,
        required: true,
        default: false
    },
    domain: {
        type: mongoose_1.Types.ObjectId,
        ref: "domain",
        required: false
    },
    isDefault: {
        type: Boolean,
        required: true,
        default: false
    },
    domainCDN: {
        type: Boolean,
        required: false,
    },
    showInLangList: {
        type: Boolean,
        required: true,
        default: false
    },
    index: {
        type: Boolean,
        required: true,
        default: false
    },
    countries: {
        type: [String],
        required: true,
        default: []
    }
});
languageSchema.plugin(uniqueValidator, { message: "تکراری است {PATH} شناسه" });
exports.LanguageModel = (0, mongoose_1.model)('language', languageSchema);
