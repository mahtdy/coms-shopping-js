"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoDraftModel = void 0;
const mongoose_1 = require("mongoose");
const seoDraftSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        default: "article"
    },
    language: {
        type: String,
        required: true,
    },
    categoryLable: {
        type: String,
        required: false,
        // enum: [
        //     "content",
        //     "shopping"
        //     // + ...
        // ]
    },
    url: {
        type: String,
        required: false
    },
    seoTitle: {
        type: String,
        required: false,
    },
    title: {
        type: String,
        required: false,
    },
    mainKeyWord: {
        type: String,
        required: false
    },
    keyWords: {
        type: [String],
        required: false
    }
});
exports.SeoDraftModel = (0, mongoose_1.model)("seoDraf", seoDraftSchema);
