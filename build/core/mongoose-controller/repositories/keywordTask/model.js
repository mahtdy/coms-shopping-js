"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordTaskModel = void 0;
const mongoose_1 = require("mongoose");
const keywordTaskSchema = new mongoose_1.Schema({
    admin: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "admin"
    },
    status: {
        type: String,
        required: true,
        enum: [
            "waiting",
            "loading",
            "running",
            "finished",
        ]
    },
    tasks: {
        type: [new mongoose_1.Schema({
                module: {
                    type: String,
                    required: true
                },
                type: {
                    type: String,
                    enum: [
                        "checkKeywordInContents",
                        "checkKeywordsInContent",
                        "checkKeywordsInContents",
                        "checkKeywordInComments",
                        "checkKeywordsInComments",
                        "checkAllKeyWordsInComments",
                        "changeKeywordLinkInContents",
                        "changeKeywordLinkInComments",
                        "deleteKeywordLinkInContents",
                        "deleteKeywordLinkInComments"
                    ],
                    required: true
                },
                status: {
                    type: String,
                    enum: ["pending", "running", "compeleted"],
                    required: true
                },
                count: {
                    type: Number,
                    required: true
                },
                proccessed: {
                    type: Number,
                    required: true
                }
            })],
        required: true,
        default: []
    },
    tasksList: {
        type: [String],
        enum: [
            "checkKeywordInContents",
            "checkKeywordsInContent",
            "checkKeywordsInContents",
            "checkKeywordInComments",
            "checkKeywordsInComments",
            "checkAllKeyWordsInComments",
            "changeKeywordLinkInContents",
            "changeKeywordLinkInComments",
            "deleteKeywordLinkInContents",
            "deleteKeywordLinkInComments"
        ],
        required: true
    },
    keyword: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "keyword"
    },
    keywords: {
        type: [mongoose_1.Types.ObjectId],
        required: false,
        ref: "keyword"
    },
    page: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        refPath: "pageType"
    },
    pageType: {
        type: String,
        required: false
    }
});
exports.KeywordTaskModel = (0, mongoose_1.model)("keyword-task", keywordTaskSchema);
