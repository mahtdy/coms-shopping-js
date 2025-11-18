"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPublishQueueModel = void 0;
const mongoose_1 = require("mongoose");
const contentPublishQueueSchema = new mongoose_1.Schema({
    pageType: {
        type: String,
        require: true
    },
    page: {
        type: mongoose_1.Types.ObjectId,
        refPath: "pageType"
    },
    type: {
        type: String, // commonQuestions , content , comment , "commentReply"
        required: false,
    },
    subId: mongoose_1.Types.ObjectId,
    content: {
        type: String,
        require: true
    },
    contentLength: {
        type: Number,
        required: false
    },
    date: Date,
    cycle: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    error: {
        type: Object,
        required: false
    }
});
exports.ContentPublishQueueModel = (0, mongoose_1.model)("content-publish-queue", contentPublishQueueSchema);
