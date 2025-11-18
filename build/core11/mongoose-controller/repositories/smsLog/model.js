"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsLogModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const smsLogSchema = new mongoose_1.Schema({
    config: {
        type: ObjectId,
        required: true,
        ref: "smsConfig"
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
exports.SmsLogModel = (0, mongoose_1.model)('smsLog', smsLogSchema);
