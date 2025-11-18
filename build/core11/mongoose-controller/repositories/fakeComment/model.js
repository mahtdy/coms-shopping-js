"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeCommentModel = void 0;
const mongoose_1 = require("mongoose");
const fakeCommentSchema = new mongoose_1.Schema({
    pageType: {
        type: String,
        required: true
    },
    page: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        refPath: "pageType"
    },
    status: {
        type: String,
        enum: ["waiting", "confirmed", "rejected"],
        default: "waiting"
    },
    text: {
        type: String,
        required: true
    },
    userInfo: {
        type: mongoose_1.Schema.Types.Mixed, // To store any type of data
        required: true
    },
    publishAt: {
        type: Date,
        required: true
    },
    cycle: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    replyAdmin: {
        type: mongoose_1.Types.ObjectId, // Can be either ObjectId or string
        required: false
    },
    replyText: {
        type: String,
        required: false
    },
    replyPublishAt: {
        type: Date,
        required: false
    },
    replyCycle: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    info: {
        type: Object,
        required: false
    }
});
exports.FakeCommentModel = (0, mongoose_1.model)("fake-comment", fakeCommentSchema);
