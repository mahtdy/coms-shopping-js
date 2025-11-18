"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/department/repository"));
const zod_1 = require("zod");
class DepartmentController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
}
exports.DepartmentController = DepartmentController;
var department = new DepartmentController("/department", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        name: zod_1.z.string(),
        status: zod_1.z.boolean(),
    })
});
exports.default = department;
