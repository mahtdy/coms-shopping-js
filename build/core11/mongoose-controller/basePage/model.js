"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basePageSchema = exports.contentSchema = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const proccessedVideoSchema = new mongoose_2.Schema({
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
const VideosSchema = new mongoose_2.Schema({
    mainSrc: {
        type: String,
        required: true
    },
    result: {
        type: [proccessedVideoSchema],
        required: false
    },
    isProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    subTitles: {
        type: [new mongoose_2.Schema({
                hard: {
                    type: Boolean,
                    required: false
                },
                src: {
                    type: String,
                    required: true
                },
                info: {
                    type: Object,
                    required: false
                }
            })],
        required: false
    },
});
exports.contentSchema = {
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    type: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: false
    },
    publishAt: {
        type: Date,
        required: false
    },
    cycle: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "publish-cycle"
    },
    locked: {
        type: Boolean,
        required: false
    },
    comments: {
        type: [
            new mongoose_2.Schema({
                text: {
                    type: String,
                    required: true
                },
                admin: {
                    type: Object,
                    required: true,
                },
                date: {
                    type: Date,
                    required: true
                },
                reply: {
                    type: String,
                    required: false
                }
            }),
        ]
    }
};
exports.basePageSchema = {
    content: {
        type: String,
        required: false,
        default: ""
    },
    contents: {
        type: [new mongoose_2.Schema(exports.contentSchema)],
        required: false
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "language"
    },
    category: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "category"
    },
    categories: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        ref: "category",
        default: []
    },
    ancestors: {
        type: [mongoose_1.Types.ObjectId],
        required: false,
        ref: "category"
    },
    author: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "author"
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: false
    },
    modifyDate: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    publishDate: {
        type: Date,
        required: false
    },
    insertDate: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    commentStatus: {
        type: Boolean,
        required: true,
        default: true
    },
    commentImportant: {
        type: Boolean,
        required: true,
        default: false
    },
    noIndex: {
        type: Boolean,
        required: true,
        default: false
    },
    isDraft: {
        type: Boolean,
        required: true,
        default: true
    },
    fileUses: {
        type: [String],
        required: true,
        default: []
    },
    commonQuestions: {
        type: [new mongoose_2.Schema({
                question: {
                    type: String,
                    required: true,
                },
                answer: {
                    type: String,
                    requierd: true
                },
                publishAt: {
                    type: Date,
                    required: false
                },
                cycle: {
                    type: mongoose_1.Types.ObjectId,
                    required: false,
                    ref: "publish-cycle"
                },
            })],
        required: false
    },
    view: {
        type: Number,
        required: true,
        default: false
    },
    viewMode: {
        type: String,
        required: true,
        enum: ["public", "forUsers", "private"],
        default: "public"
    },
    viewCategory: {
        type: mongoose_1.Types.ObjectId,
        required: function () {
            return this.viewMode == "private";
        },
        ref: "userCategory"
    },
    seo: {
        type: Object,
        required: false
    },
    social: {
        type: Object,
        required: false
    },
    feedBack: {
        type: new mongoose_2.Schema({
            yes: {
                type: Number,
                required: false
            },
            no: {
                type: Number,
                required: false
            },
            avrage_point: {
                type: Number,
                required: false
            },
            total_feed: {
                type: Number,
                required: false
            }
        }),
        required: false
    },
    questionOppened: {
        type: String,
        required: true,
        enum: ["yes", "no", "private"],
        default: "yes"
    },
    questions: {
        type: new mongoose_2.Schema({
            question: {
                type: String,
                required: false
            },
            answer: {
                type: String,
                required: false
            },
            asker: {
                type: mongoose_1.Types.ObjectId,
                ref: "user"
            }
        })
    },
    template: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "template"
    },
    imageProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    videoProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    publisher: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "admin"
    },
    videos: {
        type: [mongoose_1.Types.ObjectId],
        required: false,
        ref: "videoQueue"
    },
    video: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "videoQueue"
    },
    seoContent: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "content"
    },
    url: {
        type: String,
        required: false
    },
    Refrences: {
        type: [new mongoose_2.Schema({
                title: String,
                url: String
            })],
        required: false
    },
    tags: {
        type: [String],
        required: false
    },
    contentNumber: {
        type: Number,
        required: false
    },
    contentLanguages: {
        type: [new mongoose_2.Schema({
                content: {
                    type: mongoose_1.Types.ObjectId,
                    required: true,
                    refPath: "module"
                },
                language: {
                    type: mongoose_1.Types.ObjectId,
                    required: true,
                    ref: "language"
                }
            })],
        default: []
    },
    pagePsi: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "page-psi"
    },
    psiMobile: {
        type: Number,
        required: false
    },
    psiDesktop: {
        type: Number,
        required: false
    },
    psiAvreage: {
        type: Number,
        required: false
    },
    contetnUpdateStart: {
        type: Date,
        required: false
    },
    contetnUpdateEnd: {
        type: Date,
        required: false
    },
    commentUpdateStart: {
        type: Date,
        required: false
    },
    commentUpdateEnd: {
        type: Date,
        required: false
    },
    commonQuestionUpdateStart: {
        type: Date,
        required: false
    },
    commonQuestionUpdateEnd: {
        type: Date,
        required: false
    },
    resolutionConfig: {
        type: new mongoose_2.Schema({
            source: {
                type: String,
                required: false
            },
            conf: {
                type: Object,
                required: false
            }
        }, {
            _id: false
        }),
        required: true,
        default: {}
    },
    imageConfig: {
        type: Object,
        required: false,
        default: {}
    },
};
