"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentGroupModel = void 0;
const mongoose_1 = require("mongoose");
const contentGroupSchema = new mongoose_1.Schema({
    ids: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        default: []
    },
    type: {
        type: String,
        required: true
    }
});
exports.ContentGroupModel = (0, mongoose_1.model)("content-group", contentGroupSchema);
