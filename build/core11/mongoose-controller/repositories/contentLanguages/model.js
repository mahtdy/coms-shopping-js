"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentLanguageModel = void 0;
const mongoose_1 = require("mongoose");
const contentLanguageSchema = new mongoose_1.Schema({
    module: String,
    group: {
        type: [new mongoose_1.Schema({
                content: {
                    type: mongoose_1.Types.ObjectId,
                    required: true
                },
                language: {
                    type: mongoose_1.Types.ObjectId,
                    required: true,
                    ref: "language"
                }
            })],
        default: []
    }
});
exports.ContentLanguageModel = (0, mongoose_1.model)("content-language", contentLanguageSchema);
