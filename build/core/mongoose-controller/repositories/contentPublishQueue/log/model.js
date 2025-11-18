"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPublishLogModel = void 0;
const mongoose_1 = require("mongoose");
const contentPublishLogSchema = new mongoose_1.Schema({
    pageType: {
        type: String,
        require: true
    },
    page: mongoose_1.Types.ObjectId,
    subId: mongoose_1.Types.ObjectId,
    content: {
        type: String,
        require: true
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
exports.ContentPublishLogModel = (0, mongoose_1.model)("content-publish-log", contentPublishLogSchema);
