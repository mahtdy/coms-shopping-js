"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsMessageLogModel = void 0;
const mongoose_1 = require("mongoose");
var smsMessageLogSchema = new mongoose_1.Schema({
    reciver: {
        type: String,
        required: true
    },
    sendDate: {
        type: Date,
        required: true
    },
    delivered: {
        type: Boolean,
        required: false
    },
    fialed: {
        type: Boolean,
        required: false
    },
    falureMSG: {
        type: Object,
        required: false
    },
    senderId: {
        type: String,
        required: false
    },
    data: {
        type: Object,
        required: false
    },
    sender: {
        type: mongoose_1.Types.ObjectId,
        ref: "smsConfig",
        required: true,
    },
    template: {
        type: mongoose_1.Types.ObjectId,
        ref: "smsTemplate",
        required: true,
    }
});
exports.SmsMessageLogModel = (0, mongoose_1.model)("smsMessageLog", smsMessageLogSchema);
