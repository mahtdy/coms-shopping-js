"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const backupSchema = new mongoose_1.Schema({
    cdn: {
        type: ObjectId,
        required: false,
        ref: "fileManagerConfig"
    },
    backupType: {
        enum: ['source', 'database', 'file', 'full'],
        type: String,
        required: true
    },
    isInternalDB: {
        type: Boolean,
        required: true,
        default: true
    },
    periodType: {
        type: String,
        enum: ["hourly", "daily", "weekly", "monthly", "custom"],
        required: true
        // default : false
    },
    periodConfig: {
        type: Object,
        required: false
    },
    deletionSchedule: {
        type: Number,
        required: true,
        default: 10
    },
    dbConfig: {
        type: new mongoose_1.Schema({
            type: {
                type: String,
                required: true,
                enum: [
                    'mongodb',
                    'postgresql'
                ]
            },
            host: {
                type: String,
                required: true
            },
            port: {
                type: Number,
                required: true
            },
            username: {
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            },
            database: {
                type: String,
                required: true
            },
            auth_db: {
                type: String,
                required: false
            }
        }),
        required: false
    },
    path: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: [
            "waiting",
            "inProccess",
            "proccessed",
            "disabled"
        ],
        default: "waiting"
    },
});
exports.BackupModel = (0, mongoose_1.model)('backup', backupSchema);
