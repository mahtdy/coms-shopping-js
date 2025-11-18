"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHistoryModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const loginHistorySchema = new mongoose_1.Schema({
    count: {
        type: "Number",
        required: true
    },
    id: {
        type: ObjectId,
        required: true,
        refPath: "owner"
    },
    owner: {
        type: String,
        required: true,
        enum: ["admin", "user"]
    }
});
exports.LoginHistoryModel = (0, mongoose_1.model)('loginHistory', loginHistorySchema);
