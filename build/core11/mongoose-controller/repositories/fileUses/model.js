"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUsesModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const fileUsesSchema = new mongoose_1.Schema({
    file: {
        type: String,
        required: true
    },
    useType: {
        type: String,
        required: true,
        enum: [
            'inside',
            'outside'
        ]
    },
    data: {
        type: ObjectId,
        required: function (value) {
            if (this.useType == "inside")
                return true;
            return false;
        },
        refPath: 'source'
    },
    source: {
        type: String,
        required: function (value) {
            if (this.useType == "inside")
                return true;
            return false;
        },
    }
});
exports.FileUsesModel = (0, mongoose_1.model)('fileUses', fileUsesSchema);
