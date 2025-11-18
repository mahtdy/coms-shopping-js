"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorModel = void 0;
const mongoose_1 = require("mongoose");
const authorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    family: {
        type: String,
        required: true
    },
    biography: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false
    }
});
exports.AuthorModel = (0, mongoose_1.model)("author", authorSchema);
