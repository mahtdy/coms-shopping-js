"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordModel = exports.keywordSchema = void 0;
const mongoose_1 = require("mongoose");
exports.keywordSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: true,
        unique: true
    },
    pirority: {
        type: Number,
        required: false,
        min: 1,
        max: 10
    },
    position: {
        type: Number,
        required: false,
    },
    linksCount: {
        type: Number,
        required: false
    },
    pagesCount: {
        type: Number,
        required: false
    },
    isProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    activePagesCount: { type: Number, required: true, default: 0 },
    textCount: { type: Number, required: true, default: 0 },
    imageCount: { type: Number, required: true, default: 0 },
    contentCount: { type: Number, required: true, default: 0 },
    commentCount: { type: Number, required: true, default: 0 },
    faqCount: { type: Number, required: true, default: 0 },
    summaryCount: { type: Number, required: true, default: 0 },
    footerCount: { type: Number, required: true, default: 0 },
    sidBarCount: { type: Number, required: true, default: 0 },
    navBarCount: { type: Number, required: true, default: 0 },
    headerCount: { type: Number, required: true, default: 0 },
    noFlowCount: { type: Number, required: true, default: 0 },
    flowCount: { type: Number, required: true, default: 0 },
    page: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        refPath: "pageType"
    },
    pageType: {
        type: String,
        required: true
    },
});
exports.KeywordModel = (0, mongoose_1.model)("keyword", exports.keywordSchema);
