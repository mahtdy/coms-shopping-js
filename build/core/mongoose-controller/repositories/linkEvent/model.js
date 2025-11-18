"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkEventModel = void 0;
const mongoose_1 = require("mongoose");
const linkEventSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    from: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        refPath: "fromType"
    },
    fromType: {
        type: String,
        required: true
    },
    to: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        refPath: "toType"
    },
    toType: {
        type: String,
        required: true
    },
    part: {
        type: String,
        enum: [
            "comment",
            "content",
            "summary",
            "faq"
        ],
        required: true
    },
    subPartId: {
        type: mongoose_1.Types.ObjectId,
        required: false,
    }
});
exports.LinkEventModel = (0, mongoose_1.model)("link-event", linkEventSchema);
