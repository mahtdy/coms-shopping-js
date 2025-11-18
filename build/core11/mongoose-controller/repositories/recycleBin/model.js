"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecycleBinModel = void 0;
const mongoose_1 = require("mongoose");
const recycleBinSchema = new mongoose_1.Schema({
    config: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    original: {
        type: String,
        required: true
    }
});
exports.RecycleBinModel = (0, mongoose_1.model)("recycle-bin", recycleBinSchema);
