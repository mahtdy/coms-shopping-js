"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const mongoose_1 = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const categorySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "language"
    },
    useage: {
        type: Number,
        required: true,
        default: 0
    },
});
categorySchema.plugin(uniqueValidator, { message: "{PATH} is duplicated" });
exports.CategoryModel = (0, mongoose_1.model)('category', categorySchema);
