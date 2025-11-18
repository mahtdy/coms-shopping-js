"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundLogModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const notFoundLogSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true
    },
    lastDate: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    count: {
        type: Number,
        required: true,
        default: 1
    }
});
exports.NotFoundLogModel = (0, mongoose_1.model)('notFoundLog', notFoundLogSchema);
