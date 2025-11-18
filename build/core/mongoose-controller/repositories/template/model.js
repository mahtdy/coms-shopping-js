"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateModel = void 0;
const mongoose_1 = require("mongoose");
const templateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    created: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    isDefault: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.TemplateModel = (0, mongoose_1.model)("template", templateSchema);
