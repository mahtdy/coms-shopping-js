"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const departmentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    startDate: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
});
exports.DepartmentModel = (0, mongoose_1.model)('department', departmentSchema);
