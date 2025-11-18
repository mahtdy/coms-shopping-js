"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const chatMessageSchema = new mongoose_1.Schema({
    clientId: {
        type: String,
        required: false
    },
    chat: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            "file",
            "text",
            "assign"
        ]
    },
    from: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "admin"
    },
    fromUser: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return new Date(Date.now());
        }
    },
    file: {
        type: String,
        required: false
    },
    text: {
        type: String,
        required: false,
    },
    size: {
        type: Number,
        required: false
    },
    replyId: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "chatMessage"
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.ChatMessageModel = (0, mongoose_1.model)('chatMessage', chatMessageSchema);
