"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkTagModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const linkTagSchema = new mongoose_1.Schema({
    link: {
        type: ObjectId,
        required: true,
        unique: true,
        ref: "content"
    },
    tag: {
        type: String,
        required: true,
        unique: true
    },
});
exports.LinkTagModel = (0, mongoose_1.model)('linkTag', linkTagSchema);
