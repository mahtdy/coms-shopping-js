"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoTaskModel = exports.TaskStatus = exports.TaskType = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
var TaskType;
(function (TaskType) {
    TaskType["T&D"] = "title&description";
    TaskType["createNewContent"] = "createNewContent";
    TaskType["editContent"] = "editContent";
    TaskType["linkToMasterPage"] = "linkToMasterPage";
})(TaskType || (exports.TaskType = TaskType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["finished"] = "finished";
    TaskStatus["inProcess"] = "inProcess";
    TaskStatus["ready"] = "ready";
    TaskStatus["waitForCheck"] = "waitForCheck";
    TaskStatus["done"] = "done";
    TaskStatus["rejected"] = "rejected";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
const seoTaskSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    dateOfDuty: {
        type: Date,
        required: false
    },
    assigner: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    assigned: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    type: {
        type: String,
        required: true,
        enum: TaskType
    },
    status: {
        type: String,
        required: true,
        enum: TaskStatus
    },
    taskInfo: {
        type: Object,
        required: false
    },
    page: {
        type: String,
        requierd: false
    },
    article: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "article"
    }
});
exports.SeoTaskModel = (0, mongoose_1.model)('seoTask', seoTaskSchema);
