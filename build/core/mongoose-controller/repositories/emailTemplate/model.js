"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const emailTemplateSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    inputs: {
        type: [String],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    isHTML: {
        type: Boolean,
        required: true,
        default: false
    },
    defaultEmailConfig: {
        type: ObjectId,
        required: false,
        ref: "emailConfig"
    },
    module: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["waiting", "active", "inactive"],
        default: "waiting",
        required: true
    },
    isCore: {
        type: Boolean,
        required: true,
        default: false
    },
    adminCreator: {
        type: mongoose_1.Types.ObjectId,
        ref: "admin",
        required: false
    },
    apiCreator: {
        type: mongoose_1.Types.ObjectId,
        ref: "apikey",
        required: false
    }
});
exports.EmailTemplateModel = (0, mongoose_1.model)('emailTemplate', emailTemplateSchema);
