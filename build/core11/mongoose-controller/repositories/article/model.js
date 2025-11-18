"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleModel = exports.articleSchema = exports.ContentType = exports.ArticleType = exports.ProccessName = exports.ProccessStatus = void 0;
const mongoose_1 = require("mongoose");
// import {  basePageSchema } from "../../basePage";
const model_1 = require("../../basePage/model");
const uniqueValidator = require('mongoose-unique-validator');
const _ = __importStar(require("lodash"));
var ProccessStatus;
(function (ProccessStatus) {
    ProccessStatus[ProccessStatus["inQueue"] = 1] = "inQueue";
    ProccessStatus[ProccessStatus["inProccess"] = 2] = "inProccess";
    ProccessStatus[ProccessStatus["finished"] = 3] = "finished";
    ProccessStatus[ProccessStatus["failed"] = 4] = "failed";
})(ProccessStatus || (exports.ProccessStatus = ProccessStatus = {}));
var ProccessName;
(function (ProccessName) {
    ProccessName["videos"] = "videos";
    ProccessName["content"] = "content";
    ProccessName["images"] = "images";
})(ProccessName || (exports.ProccessName = ProccessName = {}));
var ArticleType;
(function (ArticleType) {
    ArticleType["general"] = "general";
    ArticleType["gallery"] = "gallery";
    ArticleType["video"] = "video";
    ArticleType["podcast"] = "podcast";
    ArticleType["category_faq"] = "category_faq";
    ArticleType["increamental"] = "increamental";
})(ArticleType || (exports.ArticleType = ArticleType = {}));
var ContentType;
(function (ContentType) {
    ContentType["article"] = "article";
    ContentType["page"] = "page";
})(ContentType || (exports.ContentType = ContentType = {}));
const ProccessSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        enum: ProccessName
    },
    persianName: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true,
        enum: ProccessStatus,
        default: ProccessStatus.inQueue
    },
    problems: {
        type: [String],
        required: false
    }
});
const proccessedVideoSchema = new mongoose_1.Schema({
    path: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    dimension: {
        type: String,
        required: false
    },
    size: {
        type: Number,
        required: true
    },
    basePath: {
        type: String,
        required: true
    }
});
let schema = _.cloneDeep(model_1.basePageSchema);
exports.articleSchema = new mongoose_1.Schema(Object.assign({
    isLandingPage: {
        type: Boolean,
        required: true,
        default: false
    },
    type: {
        type: String,
        required: true,
        enum: ArticleType,
        default: ArticleType.general
    },
    suggestArticles: {
        type: [new mongoose_1.Schema({
                status: {
                    type: Boolean,
                    required: true
                },
                content: {
                    type: mongoose_1.Types.ObjectId,
                    required: true,
                    ref: "article"
                }
            }, {
                _id: false
            })],
        default: []
    },
    contentType: {
        type: String,
        required: true,
        enum: ContentType,
        default: ContentType.article
    },
    title: {
        type: String,
        required: false,
        unique: true
    },
    mainImage: {
        type: String,
        required: false,
    },
    summary: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: false
    },
    files: {
        type: [String],
        required: function () {
            return this.type == ArticleType.gallery ||
                this.type == ArticleType.podcast ||
                this.type == ArticleType.video;
        },
        default: []
    },
    status: {
        type: String,
        required: false,
        enum: [
            ""
        ],
        default: ""
    },
    proccesses: {
        type: [ProccessSchema],
        required: true,
        default: () => {
            return [
                {
                    name: "content",
                    persianName: "پردازش محتوا"
                },
                {
                    name: "videos",
                    persianName: "پردازش ویدیو"
                },
                {
                    name: "images",
                    persianName: "پردازش عکس‌ها"
                }
            ];
        }
    },
    istop: {
        type: Boolean,
        required: true,
        default: false
    },
    topDate: {
        type: Date,
        required: false
    },
    needProccess: {
        type: Boolean,
        required: true,
        default: false
    },
    module: {
        type: String,
        default: "article"
    }
}, schema));
exports.articleSchema.plugin(uniqueValidator, { message: "{PATH} is duplicated" });
exports.ArticleModel = (0, mongoose_1.model)("article", exports.articleSchema);
// export default new Model
