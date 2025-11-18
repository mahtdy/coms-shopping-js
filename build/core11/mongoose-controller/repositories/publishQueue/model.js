"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishQueueModel = void 0;
const mongoose_1 = require("mongoose");
const publishQueue = new mongoose_1.Schema({
    categories: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        ref: "category"
    },
    draft: {
        type: mongoose_1.Types.ObjectId,
        required: true,
    },
    type: {
        type: String,
        required: true
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "language"
    },
    author: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "author"
    },
    isRequest: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.PublishQueueModel = (0, mongoose_1.model)("publishQueue", publishQueue);
