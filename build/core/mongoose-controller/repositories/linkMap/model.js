"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkMapModel = void 0;
const mongoose_1 = require("mongoose");
const linkDataSchema = new mongoose_1.Schema({
    subPartId: {
        type: mongoose_1.Types.ObjectId,
        required: false,
    },
    extraInfo: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false
    },
    isWrong: {
        type: Boolean,
        required: true,
        default: false
    },
    isRejected: {
        type: Boolean,
        required: true,
        default: false
    },
    isProccessed: {
        type: Boolean,
        required: true,
        default: false
    }
});
const linkMapSchema = new mongoose_1.Schema({
    from: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        refPath: "fromType"
    },
    fromType: {
        type: String,
        required: true
    },
    to: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        refPath: "toType"
    },
    toType: {
        type: String,
        required: false
    },
    keyword: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "keyword"
    },
    contentLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },
    summaryLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },
    faqLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },
    commentLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },
});
exports.LinkMapModel = (0, mongoose_1.model)("linkMap", linkMapSchema);
