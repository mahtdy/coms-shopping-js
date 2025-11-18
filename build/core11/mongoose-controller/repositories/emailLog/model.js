"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLogModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const emailLogSchema = new mongoose_1.Schema({
    config: {
        type: ObjectId,
        required: true,
        ref: "emailConfig"
    },
    result: {
        type: Boolean,
        required: true
    },
    importance: {
        type: Number,
        required: true
    },
    failureReason: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: () => {
            return new Date();
        },
        required: true
    },
});
exports.EmailLogModel = (0, mongoose_1.model)('emailLog', emailLogSchema);
