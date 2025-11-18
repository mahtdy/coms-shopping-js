"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModel = void 0;
const mongoose_1 = require("mongoose");
var roleSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    parent: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "role"
    }
});
exports.RoleModel = (0, mongoose_1.model)("role", roleSchema);
