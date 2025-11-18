"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSocketModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const userSocketSchema = new mongoose_1.Schema({
    token: {
        type: String,
        required: true
    },
    socket: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    }
});
exports.UserSocketModel = (0, mongoose_1.model)('userSocket', userSocketSchema);
