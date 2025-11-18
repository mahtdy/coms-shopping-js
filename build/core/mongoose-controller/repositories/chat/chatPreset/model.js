"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPresetModel = void 0;
const mongoose_1 = require("mongoose");
const chatPresetSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: ""
    }
});
exports.ChatPresetModel = (0, mongoose_1.model)("chatPreset", chatPresetSchema);
