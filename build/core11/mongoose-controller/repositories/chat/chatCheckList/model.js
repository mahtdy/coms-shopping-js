"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCheckListModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const chatCheckListSchema = new mongoose_1.Schema({
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
            })],
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
    checked: {
        type: Boolean,
        required: false,
        default: false
    },
    token: {
        type: String,
        required: true
    }
});
exports.ChatCheckListModel = (0, mongoose_1.model)('chatCheckList', chatCheckListSchema);
