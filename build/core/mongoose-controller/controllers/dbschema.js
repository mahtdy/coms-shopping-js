"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBSchemaController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/dbSchema/repository"));
const zod_1 = __importDefault(require("zod"));
class DBSchemaController extends controller_1.default {
}
exports.DBSchemaController = DBSchemaController;
const dbSchema = new DBSchemaController("/dbSchema", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        collectionName: zod_1.default.string(),
        collectionSchema: zod_1.default.record(zod_1.default.string(), zod_1.default.object({
            sub: controller_1.default.search.optional(),
            visible: zod_1.default.enum(["0", "1", "2"]),
            persianName: zod_1.default.string(),
            canEdit: zod_1.default.boolean().default(false)
        })),
        persianName: zod_1.default.string(),
        subPart: zod_1.default.string()
    })
});
exports.default = dbSchema;
