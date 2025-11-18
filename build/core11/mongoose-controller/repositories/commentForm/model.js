"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentFormModel = void 0;
const mongoose_1 = require("mongoose");
const commentFormSchema = new mongoose_1.Schema({
    hash: {
        type: String,
        required: true,
        unique: true
    },
    info: {
        type: Object,
        required: true
    },
    submitted: {
        type: Boolean,
        required: true,
        default: false
    },
    notificationTokens: {
        type: [new mongoose_1.Schema({
                domain: mongoose_1.Types.ObjectId,
                type: {
                    type: String,
                    default: "web-push"
                },
                config: Object
            })],
        required: false
    }
});
exports.CommentFormModel = (0, mongoose_1.model)("comment-form", commentFormSchema);
