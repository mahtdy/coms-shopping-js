"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalMessageModel = void 0;
const mongoose_1 = require("mongoose");
const internalMessageSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    seen: {
        type: Boolean,
        required: true,
        default: false
    },
    id: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    namespace: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});
exports.InternalMessageModel = (0, mongoose_1.model)("internalMessage", internalMessageSchema);
