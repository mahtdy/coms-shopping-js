"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentBlockModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const commentBlockSchema = new mongoose_2.Schema({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    blockType: {
        type: String,
        required: true,
        enum: ["temporary", "permanent"]
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    duration: {
        type: Number,
        required: false,
        min: 0
    },
    durationType: {
        type: String,
        required: true,
        enum: ["hour", "day"]
    },
    expire: {
        type: Date,
        required: false
    }
});
exports.CommentBlockModel = (0, mongoose_1.model)("comment-block", commentBlockSchema);
