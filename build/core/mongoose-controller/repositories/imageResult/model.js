"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageResultModel = void 0;
const mongoose_1 = require("mongoose");
const positionSchema = new mongoose_1.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
});
const imageResultSchema = new mongoose_1.Schema({
    source: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
    isMainCompressed: {},
    imageLocation: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    resolution: {
        type: new mongoose_1.Schema({
            width: {
                type: Number
            },
            height: {
                type: Number
            }
        })
    },
    cropingData: {
        type: Map,
        of: positionSchema,
        required: false,
    },
    lastBuild: { type: Date, required: true, default: () => new Date() },
    results: {
        type: [new mongoose_1.Schema({
                type: {
                    type: String,
                    required: true,
                },
                template: {
                    type: String,
                    required: true,
                },
                src: {
                    type: String,
                    required: true,
                },
            })],
    },
    pageType: { type: String, required: true },
    page: {
        type: mongoose_1.Schema.Types.Mixed, // چون می‌تونه ObjectId یا BasePage یا string باشه
        required: true,
    },
});
exports.ImageResultModel = (0, mongoose_1.model)("image-result", imageResultSchema);
