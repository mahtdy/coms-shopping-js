"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerPermissionModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const fileManagerPermissionSchema = new mongoose_1.Schema({
    admin: {
        type: ObjectId,
        required: true,
        ref: "admin"
    },
    size: {
        type: "Number",
        required: true
    },
    pathsPermission: {
        type: [
            new mongoose_1.Schema({
                path: {
                    type: String,
                    required: true
                },
                allowedActions: {
                    type: [String],
                    required: true
                },
                showType: {
                    type: [String],
                    required: false
                },
                uploadTypes: {
                    type: [String],
                    required: false
                },
                recurcive: {
                    type: Boolean,
                    required: true,
                    default: true
                },
                status: {
                    type: Boolean,
                    required: true,
                    default: true
                }
            })
        ],
        required: true,
        default: []
    },
    cdn: {
        type: ObjectId,
        required: true,
        ref: 'fileManagerConfig'
    }
});
exports.FileManagerPermissionModel = (0, mongoose_1.model)('fileManagerPermission', fileManagerPermissionSchema);
