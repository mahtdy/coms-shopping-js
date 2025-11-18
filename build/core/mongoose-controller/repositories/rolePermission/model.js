"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionModel = void 0;
const mongoose_1 = require("mongoose");
var RolePermissionSchema = new mongoose_1.Schema({
    role: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    allowedActions: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        default: [],
        ref: "action"
    },
    schemaFilter: {
        type: [
            new mongoose_1.Schema({
                dbSchema: {
                    type: mongoose_1.Types.ObjectId,
                    required: true,
                    ref: "dbSchema"
                },
                allowed: {
                    type: [String],
                    required: true,
                    default: []
                }
            }, {
                _id: false
            })
        ],
        required: true,
        default: []
    },
    moduleAction: {
        type: [
            new mongoose_1.Schema({
                subPart: {
                    type: String,
                    required: true
                },
                config: {
                    type: Object,
                    required: true,
                    default: {}
                }
            })
        ],
        required: true,
        default: []
    }
});
exports.RolePermissionModel = (0, mongoose_1.model)("rolePermission", RolePermissionSchema);
