"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModel = void 0;
const mongoose_1 = require("mongoose");
const random_1 = __importDefault(require("../../../random"));
var ObjectId = mongoose_1.Types.ObjectId;
const contentSchema = new mongoose_1.Schema({
    originalUrl: {
        type: String,
        required: true,
        default: ""
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        default: "article"
    },
    id: {
        type: String,
        required: false
    },
    seoTitle: {
        type: String,
        required: true,
    },
    metaDescription: {
        type: String,
        required: true,
    },
    metaKeyWords: {
        type: [String],
        required: true,
    },
    metaTags: {
        type: [String],
        required: true,
    },
    mainKeyWord: {
        type: String,
        required: true,
        default: () => {
            return random_1.default.generateHashStr(30);
        },
        unique: true
    },
    keyWords: {
        type: [String],
        required: false,
        // unique: true
    },
    isMainLang: {
        type: Boolean,
        required: true,
        default: true
    },
    isStatic: {
        type: Boolean,
        required: true,
        default: false
    },
    language: {
        type: String,
        required: false,
    },
    category: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    author: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    categoryInfo: {
        type: Object,
        required: false
    },
    authorInfo: {
        type: Object,
        required: false
    },
    mainArticle: {
        type: ObjectId,
        required: false
    },
    categoryLable: {
        type: String,
        required: false,
        // enum: [
        //     "content",
        //     "shopping"
        //     // + ...
        // ]
    },
    social: {
        type: [new mongoose_1.Schema({
                socialName: {
                    type: String,
                    required: true,
                    enum: ["twitter", "facebook"]
                },
                title: {
                    type: String,
                    required: true
                },
                description: {
                    type: String,
                    required: true
                },
                image: {
                    type: String,
                    required: false
                }
            })],
        required: true,
        default: []
    },
    "canoncialAddress": {
        type: String,
        required: false
    },
    "oldAddress": {
        type: String,
        required: false
    },
    redirecturl: {
        type: String,
        required: false
    },
    redirect_status: {
        type: String,
        required: false
    },
    changefreq: {
        type: String,
        required: true,
        default: "never"
    },
    priority: {
        type: Number,
        required: true,
        default: 0.5
    }
});
exports.ContentModel = (0, mongoose_1.model)('content', contentSchema);
