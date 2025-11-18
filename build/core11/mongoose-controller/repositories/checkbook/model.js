"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckbookModel = void 0;
const mongoose_1 = require("mongoose");
const checkbookSchema = new mongoose_1.Schema({
    startNumber: {
        type: Number,
        required: true
    },
    endNumber: {
        type: Number,
        required: true
    },
    account: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "bank-account"
    },
    pageCount: {
        type: Number,
        required: true,
        default: 0
    }
});
exports.CheckbookModel = (0, mongoose_1.model)("checkbook", checkbookSchema);
