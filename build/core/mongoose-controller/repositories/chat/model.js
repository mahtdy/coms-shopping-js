"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const chatSchema = new mongoose_1.Schema({
    admin: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    secondAdmin: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    admins: {
        type: [ObjectId],
        required: true,
        default: []
    },
    userSocket: {
        type: String,
        required: false
    },
    adminSockets: {
        type: [String],
        required: true,
        default: []
    },
    messages: {
        type: [
            new mongoose_1.Schema({
                text: {
                    type: String,
                    required: false,
                    default: ""
                },
                date: {
                    type: Date,
                    required: true,
                    default: () => new Date()
                }
            })
        ],
        required: true,
        default: []
    },
    info: {
        type: new mongoose_1.Schema({
            user: {
                type: ObjectId,
                required: false,
                ref: "user"
            },
            ipInfo: {
                type: Object,
                required: true
            },
            userInfo: {
                type: Object,
                required: false
            },
            page: {
                type: String,
                required: false
            },
            views: {
                type: Number,
                required: true,
                default: 1
            },
            lastView: {
                type: Date,
                required: true,
                default: () => new Date()
            },
            firstView: {
                type: Date,
                required: true,
                default: () => new Date()
            },
            lastPage: {
                type: String,
                required: false
            },
            os: String,
            browser: String
        }, {
            _id: false
        }),
        required: false
    },
    notes: {
        type: [new mongoose_1.Schema({
                admin: {
                    type: mongoose_1.Types.ObjectId,
                    required: true
                },
                note: {
                    type: String,
                    required: true
                },
                date: {
                    type: Date,
                    required: true,
                    default: () => {
                        return new Date();
                    }
                }
            })],
        required: true,
        default: []
    },
    isClosed: {
        type: Boolean,
        required: true,
        default: false
    },
    isStart: {
        type: Boolean,
        required: true,
        default: false
    },
    blocked: {
        type: Boolean,
        required: true,
        default: false
    },
    userOnline: {
        type: Boolean,
        required: false,
        default: true
    },
    userLastSeen: {
        type: Date,
        required: false
    },
    adminOnline: {
        type: Boolean,
        required: true,
        default: false
    },
    adminLastSeen: {
        type: Date,
        required: false
    },
    secondAdminOnline: {
        type: Boolean,
        required: false
    },
    secondAdminLastSeen: {
        type: Date,
        required: false
    },
    userToken: {
        type: String,
        required: false
    }
});
exports.ChatModel = (0, mongoose_1.model)('chat', chatSchema);
