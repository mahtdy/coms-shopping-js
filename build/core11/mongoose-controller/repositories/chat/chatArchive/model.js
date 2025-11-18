"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatArchiveModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const chatArchiveSchema = new mongoose_1.Schema({
    admin: {
        type: ObjectId,
        required: true,
        ref: "admin"
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    messages: {
        type: [new mongoose_1.Schema({
                text: {
                    type: String,
                    required: true
                },
                date: {
                    type: Date,
                    required: true
                },
                from: {
                    type: String,
                    required: true
                },
            })],
        required: true
    },
    info: {
        type: Object,
        required: true
    },
});
exports.ChatArchiveModel = (0, mongoose_1.model)('chatArchive', chatArchiveSchema);
