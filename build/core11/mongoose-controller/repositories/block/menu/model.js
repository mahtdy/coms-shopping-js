"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../model");
const menuSchema = new mongoose_1.Schema(Object.assign(model_1.blockSchema, {
    type: {
        type: String,
        enum: ["mega", "waterfall"]
    }
}));
exports.MenuModel = (0, mongoose_1.model)("menu", menuSchema);
