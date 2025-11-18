"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdnLogModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const cdnLogSchema = new mongoose_1.Schema({
    cdn: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    files: {
        type: [String],
        required: true
    },
    operation: {
        type: String,
        required: true
    },
    info: {
        type: Object,
        required: true
    },
});
exports.CdnLogModel = (0, mongoose_1.model)('cdnLog', cdnLogSchema);
