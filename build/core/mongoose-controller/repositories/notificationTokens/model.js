"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTokenModel = void 0;
const mongoose_1 = require("mongoose");
const notificationTokenSchema = new mongoose_1.Schema({
    domain: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    config: {
        type: Object,
        required: true
    },
    type: {
        type: String,
        required: true,
        default: "web-push"
    }
});
exports.NotificationTokenModel = (0, mongoose_1.model)("notification-token", notificationTokenSchema);
