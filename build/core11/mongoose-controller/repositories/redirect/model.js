"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const redirectSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ["regex", "1To1", "auto", "oldToNew", "important", "update", "language"],
        default: "1To1",
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    regexConfig: {
        type: Object,
        required: false
    },
    code: {
        type: String,
        required: true,
        default: "301",
        enum: ["301", '302', '303', '304', '307', '308']
    },
    isAutomatic: {
        type: Boolean,
        required: true,
        default: false
    },
    external: {
        type: Boolean,
        required: true,
        default: false
    },
    fromStatic: {
        type: Boolean,
        required: true,
        default: false
    },
    toStatic: {
        type: Boolean,
        required: true,
        default: false
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "language"
    },
    domain: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "domain"
    },
    created: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    }
});
exports.RedirectModel = (0, mongoose_1.model)('redirect', redirectSchema);
