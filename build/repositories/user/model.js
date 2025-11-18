"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../../core/mongoose-controller/repositories/user/model");
exports.UserModel = (0, mongoose_1.model)('user', model_1.userSchema);
