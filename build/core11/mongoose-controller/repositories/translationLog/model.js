"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationLogModel = void 0;
const mongoose_1 = require("mongoose");
const translationLogSchema = new mongoose_1.Schema({
    all: {
        type: Number,
        required: true
    },
    translated: {
        type: Number,
        required: true
    },
    translation: {
        type: Object,
        required: true
    },
    fileLocate: {
        type: String,
        required: true,
        enum: ["panel", "server"]
    },
    source: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ["error", "success", "pending"],
        default: "pending"
    },
});
exports.TranslationLogModel = (0, mongoose_1.model)("translationLog", translationLogSchema);
