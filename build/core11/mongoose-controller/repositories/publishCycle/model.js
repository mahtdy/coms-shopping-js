"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishCycleModel = void 0;
const mongoose_1 = require("mongoose");
const publishCycleSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    }
});
exports.PublishCycleModel = (0, mongoose_1.model)("publish-cycle", publishCycleSchema);
