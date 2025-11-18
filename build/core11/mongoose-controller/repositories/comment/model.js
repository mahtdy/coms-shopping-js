"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    text: {
        type: String
    },
    page: {
        type: mongoose_1.Types.ObjectId,
        refPath: "module"
    },
    module: {
        type: String
    },
    level: {
        type: Number,
        required: true,
        default: 1
    },
    language: {
        type: mongoose_1.Types.ObjectId
    },
    user: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "user"
    },
    userInfo: {
        type: Object,
        required: false
    },
    reply: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "comment"
    },
    userReplied: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "user"
    },
    userInfoReplied: {
        type: Object,
        required: false
    },
    create: {
        type: Date,
        default: () => {
            return new Date();
        }
    },
    status: {
        type: String,
        enum: ["confirmed", "rejected", "proccessing"],
        required: true,
        default: "proccessing"
    },
    like: {
        type: Number,
        default: 0
    },
    dislike: {
        type: Number,
        default: 0
    },
    replies: {
        type: Number,
        required: true,
        default: 0
    },
    admin: {
        type: mongoose_1.Types.ObjectId,
        requimanoalred: false,
        ref: "admin"
    },
    adminReplied: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "admin"
    },
    adminReply: {
        type: Boolean,
        required: false
    },
    reported: {
        type: Boolean,
        required: false
    },
    atachment: {
        type: [String],
        required: false
    },
    manual: {
        type: Boolean,
        required: true,
        default: false
    },
    commentInfo: {
        type: new mongoose_1.Schema({
            ip: String,
            geo: Object,
            os: String,
            browser: String
        }),
        required: false
    },
    type: {
        type: String,
        required: true,
        enum: ["question", "comment"],
        default: "comment"
    }
});
exports.CommentModel = (0, mongoose_1.model)("comment", commentSchema);
