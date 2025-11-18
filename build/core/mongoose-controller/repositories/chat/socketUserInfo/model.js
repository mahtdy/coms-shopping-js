"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUserInfoModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const socketUserInfoSchema = new mongoose_1.Schema({
    socket: {
        type: String,
        required: true
    },
    info: {
        type: Object,
        required: true
    },
});
exports.SocketUserInfoModel = (0, mongoose_1.model)('socketUserInfo', socketUserInfoSchema);
