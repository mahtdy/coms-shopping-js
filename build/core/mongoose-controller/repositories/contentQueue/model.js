"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentQueueModel = void 0;
const mongoose_1 = require("mongoose");
const contentQueueSchema = new mongoose_1.Schema({
    data: {
        type: Object,
        required: true
    }
});
exports.ContentQueueModel = (0, mongoose_1.model)("content-queue", contentQueueSchema);
