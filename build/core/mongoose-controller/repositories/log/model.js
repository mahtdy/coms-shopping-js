"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogModel = void 0;
const mongoose_1 = require("mongoose");
const logSchema = new mongoose_1.Schema({
    admin: {
        type: mongoose_1.Types.ObjectId,
        requierd: false,
        ref: "admin"
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    collectionName: {
        type: String,
        required: false
    },
    ipAddress: {
        type: String,
        requierd: true
    },
    afterData: {
        type: Object,
        required: false
    },
    beforeData: {
        type: Object,
        required: false
    },
    url: {
        type: String,
        requierd: true
    },
    method: {
        type: String,
        requierd: true
    },
    queryParam: {
        type: Object,
        required: false
    },
    body: {
        type: Object,
        required: false
    },
    success: {
        type: Boolean,
        required: true
    },
    statusCode: {
        type: Number,
        required: true
    },
    response: {
        type: Object,
        required: true
    }
});
exports.LogModel = (0, mongoose_1.model)('log', logSchema);
