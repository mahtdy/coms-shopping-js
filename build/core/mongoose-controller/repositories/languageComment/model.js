"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCommentConfigModel = void 0;
const mongoose_1 = require("mongoose");
const languageCommentSchema = new mongoose_1.Schema({
    "ungegistered-user-comment": {
        type: Boolean
    },
    "min-comment-delay": {
        type: Number
    },
    "min-comment-delay-unit": {
        type: String,
        enum: ["minute", "second", "hour"]
    },
    "max-comment-character": {
        type: Number
    },
    "max-comment-show-limit": {
        type: Number
    },
    "template": {
        type: String
    },
    "captcha": {
        type: Boolean
    },
    "captcha-type": {
        type: String,
        enum: ["google", "cload", "system"]
    },
    "comment-reply": {
        type: Boolean
    },
    "comment-rate": {
        type: Boolean
    },
    "comment-submit-without-confirm": {
        type: Boolean
    },
    "comment-show-sort": {
        type: String,
        enum: ["latest", "oldest", "system"]
    },
    "comment-policy": {
        type: String
    },
    "validate-phone": Boolean,
    "show-auto-signup": Boolean,
    "email": Boolean,
    "atach": Boolean,
    "allowd-file-types": [String],
    "atach-size": Number,
    "atach-size-unit": {
        type: String,
        enum: ["MB", "KB"]
    },
    "atach-count": Number,
    "upload-path": new mongoose_1.Schema({
        fileManager: String,
        path: String
    }, { _id: false }),
    "like-type": {
        type: String,
        required: true,
        enum: ["like-dislike", "like"],
        default: "like"
    },
    //editor
    "editor": Boolean,
    "external-link-type": {
        type: String,
        enum: ["follow", "nofollow"]
    },
    "editor-upload-path": new mongoose_1.Schema({
        fileManager: String,
        path: String
    }, {
        _id: false
    }),
    "editor-upload-types": [String],
    "editor-upload-size": Number,
    "editor-upload-unit": {
        type: String,
        enum: ["MB", "KB"]
    },
    "image-width": {
        type: Number,
        min: 300,
        max: 500
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        ref: "language"
    }
});
exports.LanguageCommentConfigModel = (0, mongoose_1.model)("language-comment", languageCommentSchema);
