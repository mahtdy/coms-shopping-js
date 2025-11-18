"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCdnPermissionModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const adminCdnPermissionSchema = new mongoose_1.Schema({
    admin: {
        type: ObjectId,
        required: true,
        ref: "admin"
    },
    size: {
        type: "Number",
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
});
exports.AdminCdnPermissionModel = (0, mongoose_1.model)('adminCdnPermission', adminCdnPermissionSchema);
