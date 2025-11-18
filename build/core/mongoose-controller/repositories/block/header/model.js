"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderModel = void 0;
const mongoose_1 = require("mongoose");
const headerSchema = new mongoose_1.Schema({
// navbar : {
//     type: Types.ObjectId,
//     required : true,
// }
});
exports.HeaderModel = (0, mongoose_1.model)("header", headerSchema);
