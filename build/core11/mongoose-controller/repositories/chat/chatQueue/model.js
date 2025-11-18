"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatQueueModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const chatQueueSchema = new mongoose_1.Schema({
    socket: {
        type: String,
        required: true
    },
    messages: {
        type: [
            new mongoose_1.Schema({
                text: {
                    type: String,
                    required: true
                },
                date: {
                    type: String,
                    required: true,
                    default: () => {
                        return new Date(Date.now());
                    }
                },
            }, { _id: false })
        ],
        required: true
    },
    info: {
        type: new mongoose_1.Schema({
            ipInfo: {
                type: Object,
                required: true
            },
            user: {
                type: ObjectId,
                required: false,
                ref: "user"
            },
            userInfo: {
                type: Object,
                required: true
            },
            page: {
                type: String,
                required: true
            },
            firstView: {
                type: Date,
                required: true,
                default: () => new Date()
            },
            os: String,
            browser: String
        }),
        required: true
    },
    token: {
        type: String,
        required: true
    }
});
exports.ChatQueueModel = (0, mongoose_1.model)('chatQueue', chatQueueSchema);
