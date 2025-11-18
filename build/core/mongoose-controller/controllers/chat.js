"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const redis_cache_1 = __importDefault(require("../../redis-cache"));
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/chat/repository"));
const random_1 = __importDefault(require("../../random"));
const zod_1 = require("zod");
const fileManager_1 = __importDefault(require("../../services/fileManager"));
const article_1 = require("./article");
const path_1 = __importDefault(require("path"));
const cacheService = new redis_cache_1.default("socket_data");
class ChatController extends controller_1.default {
    async deleteByPhone(phone) {
        try {
            await this.repository.findOneAndDelete({
                "info.userInfo.phoneNumber": phone
            });
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async attach(file, files) {
        try {
            var cdn = new fileManager_1.default();
            await cdn.init(true);
            let dest = article_1.ArticleController.getUploadDestination("chat/", "y-m-d") + path_1.default.basename(file);
            // console.log("conf" , cdn.config)
            let data = await cdn.uploadWithState(file, dest);
            // console.log("dataaaa" , data)
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getToken(admin) {
        try {
            let token = random_1.default.generateHashStr(32);
            await cacheService.set(token, admin._id);
            return {
                status: 200,
                data: {
                    token
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
    }
}
exports.ChatController = ChatController;
__decorate([
    (0, method_1.Delete)(""),
    __param(0, (0, parameters_1.Body)({ destination: "phone", schema: zod_1.z.string() }))
], ChatController.prototype, "deleteByPhone", null);
__decorate([
    (0, method_1.Post)("/attach"),
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 5,
            size: 5000000
        },
        mapToBody: true,
        destination: "file",
        // isArray: true,
        schema: zod_1.z.any().optional(),
    }))
], ChatController.prototype, "attach", null);
__decorate([
    (0, method_1.Get)("/token"),
    __param(0, (0, parameters_1.Admin)())
], ChatController.prototype, "getToken", null);
const chat = new ChatController("/chat", new repository_1.default(), {
// insertSchema: z.object({
//     collectionName: z.string(),
//     collectionSchema:  z.record(z.string(), z.object({
//         sub: BaseController.search.optional(),
//         visible: z.enum(["0", "1", "2"]),
//         persianName : z.string(),
//         canEdit : z.boolean().default(false)
//     })),
//     persianName: z.string(),
//     subPart: z.string()
// })
});
exports.default = chat;
