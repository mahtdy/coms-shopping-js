"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBSchemaModel = void 0;
const mongoose_1 = require("mongoose");
const collectionSchema = new mongoose_1.Schema({
    sub: {
        type: Object,
        required: false
    },
    visible: {
        type: String,
        required: true,
        enum: ["0", "1", "2"],
        default: 1
    },
    persianName: {
        type: String,
        required: true
    },
    canEdit: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    _id: false
});
const dbSchema = new mongoose_1.Schema({
    collectionName: {
        type: String,
        required: true,
        unique: true
    },
    collectionSchema: {
        type: Map,
        of: collectionSchema,
        required: true,
    },
    persianName: {
        type: String,
        required: true,
    },
    subPart: {
        type: String,
        required: true
    }
});
exports.DBSchemaModel = (0, mongoose_1.model)("dbSchema", dbSchema);
