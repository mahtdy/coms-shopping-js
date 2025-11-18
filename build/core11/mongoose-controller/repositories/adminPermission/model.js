"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPermissionModel = void 0;
const mongoose_1 = require("mongoose");
var AdminPermissionSchema = new mongoose_1.Schema({
    admin: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "admin"
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
exports.AdminPermissionModel = (0, mongoose_1.model)("adminPermission", AdminPermissionSchema);
