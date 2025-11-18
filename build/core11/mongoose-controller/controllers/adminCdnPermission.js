"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/adminCdnPermission/repository"));
const cache_1 = __importDefault(require("../../cache"));
const zod_1 = require("zod");
var adminCdnPermission = new controller_1.default("/adminCdnPermission", new repository_1.default({
    cacheService: new cache_1.default("adminCdnPermission")
}), {
    insertSchema: zod_1.z.object({
        admin: controller_1.default.id.describe("هر ادمین یک بار"),
        size: zod_1.z.coerce.number().positive(),
        showTypes: zod_1.z.array(zod_1.z.string()).optional(),
        uploadTypes: zod_1.z.array(zod_1.z.string()).optional()
    })
});
// log.addRouteWithMeta("es/search", "get" , log.search.bind(log),BaseController.searcheMeta)
exports.default = adminCdnPermission;
