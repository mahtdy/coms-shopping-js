"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationConfigModel = void 0;
const mongoose_1 = require("mongoose");
var notificationConfigSchema = new mongoose_1.Schema({
    config: {
        type: Object,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.NotificationConfigModel = (0, mongoose_1.model)("notificationConfig", notificationConfigSchema);
