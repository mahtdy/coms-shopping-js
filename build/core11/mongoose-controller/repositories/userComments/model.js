"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCommentModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const userCommentSchema = new mongoose_1.Schema({
    comment: {
        type: mongoose_2.Types.ObjectId,
        required: true
    },
    type: {
        type: [String],
        enum: ["like", "dislike"]
    },
    clientId: {
        type: String,
        required: true
    }
});
exports.UserCommentModel = (0, mongoose_1.model)("user-comment", userCommentSchema);
