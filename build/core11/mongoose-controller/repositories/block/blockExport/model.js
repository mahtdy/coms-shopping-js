"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockExportModel = void 0;
const mongoose_1 = require("mongoose");
const blockExportSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: true
    },
    json: {
        type: Object,
        required: true
    },
    css: {
        type: String,
        required: false
    },
    url: {
        type: String,
        required: true
    },
    from: {
        type: mongoose_1.Types.ObjectId,
        required: true
    }
});
exports.BlockExportModel = (0, mongoose_1.model)("block-export", blockExportSchema);
