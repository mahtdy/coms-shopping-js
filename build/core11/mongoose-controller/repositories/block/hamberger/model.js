"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HambergerModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../model");
const hambergerSchema = new mongoose_1.Schema(model_1.blockSchema);
exports.HambergerModel = (0, mongoose_1.model)("hamberger", hambergerSchema);
