"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConfigModel = void 0;
const mongoose_1 = require("mongoose");
const videoConfigSchema = new mongoose_1.Schema({
    lable: {
        type: String,
        required: true
    },
    configs: {
        type: [Object],
        required: true
    }
});
exports.VideoConfigModel = (0, mongoose_1.model)("video-config", videoConfigSchema);
