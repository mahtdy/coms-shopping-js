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
exports.FakeCommentController = exports.insertSchema = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/fakeComment/repository"));
const zod_1 = __importDefault(require("zod"));
const repository_2 = __importDefault(require("../repositories/languageComment/repository"));
const repository_3 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const fileManager_1 = __importDefault(require("../../services/fileManager"));
const article_1 = require("./article");
const path_1 = __importDefault(require("path"));
exports.insertSchema = zod_1.default.object({
    pageType: zod_1.default.string(),
    page: controller_1.default.id,
    status: zod_1.default.enum(["waiting", "confirmed", "rejected"]).default("waiting"),
    text: zod_1.default.string(),
    userInfo: zod_1.default.any(),
    publishAt: zod_1.default.coerce.date().optional(),
    cycle: controller_1.default.id.optional(),
    replyAdmin: controller_1.default.id.optional(),
    replyText: zod_1.default.string().optional(),
    replyPublishAt: zod_1.default.coerce.date().optional(),
    replyCycle: controller_1.default.id.optional(),
    info: zod_1.default.any()
});
class FakeCommentController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.languageCommentRepo = new repository_2.default();
        this.cdnRepo = new repository_3.default();
    }
    async attachFile(file, files, language) {
        try {
            let lang = await this.languageCommentRepo.findOne({
                language
            });
            if (lang != null) {
                // if(captch)
                let savePath = lang["upload-path"];
                var conf = await this.cdnRepo.findById(savePath.fileManager);
                var cdn = new fileManager_1.default();
                await cdn.init(true);
                let dest = article_1.ArticleController.getUploadDestination(savePath.path, "y-m-d") + path_1.default.basename(file);
                let data = await cdn.upload(file, dest);
                return {
                    status: 200,
                    data
                };
            }
            return {
                status: 400
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async updateOne(id, data) {
        try {
            return await this.editById(id, { $set: data });
        }
        catch (error) {
            throw error;
        }
    }
    async create(data, admin) {
        data.replyAdmin = admin._id;
        return super.create(data);
    }
    delete(id, ...params) {
        return super.delete(id);
    }
    async confirmFakeComment(id) {
        try {
            return await this.editById(id, {
                $set: {
                    status: "confirmed"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectFakeComment(id) {
        try {
            return await this.editById(id, {
                $set: {
                    status: "rejected"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async publish(id, language) {
        try {
            return {
                status: 200,
                data: await this.repository.publish(id, language)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async publishAll(page, language) {
        try {
            return {
                status: 200,
                data: await this.repository.publishAll(page, language)
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        // super.initApis()
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        var pg = this.baseRoute.endsWith("e") ? "s" : "es";
        this.addRouteWithMeta(pg, "get", this.search.bind(this), Object.assign(controller_1.default.searcheMeta, { absolute: false }));
        this.addRouteWithMeta("", "delete", this.delete.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            },
        });
    }
}
exports.FakeCommentController = FakeCommentController;
__decorate([
    (0, method_1.Post)("/attach"),
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.default.string()
    })),
    __param(1, (0, parameters_1.Files)({
        config: {
            name: "file",
            maxCount: 5,
            // size : 5000000
        },
        mapToBody: true,
        destination: "file",
        // isArray: true,
        schema: zod_1.default.any().optional(),
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], FakeCommentController.prototype, "attachFile", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: exports.insertSchema
    }))
], FakeCommentController.prototype, "updateOne", null);
__decorate([
    __param(1, (0, parameters_1.Admin)())
], FakeCommentController.prototype, "create", null);
__decorate([
    (0, method_1.Post)("/confirm"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], FakeCommentController.prototype, "confirmFakeComment", null);
__decorate([
    (0, method_1.Post)("/reject"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], FakeCommentController.prototype, "rejectFakeComment", null);
__decorate([
    (0, method_1.Post)("/publish"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], FakeCommentController.prototype, "publish", null);
__decorate([
    (0, method_1.Post)("/publish/all"),
    __param(0, (0, parameters_1.Body)({
        destination: "page",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], FakeCommentController.prototype, "publishAll", null);
const fakeComment = new FakeCommentController("/manual-comment", new repository_1.default(), {
    insertSchema: exports.insertSchema,
    searchFilters: {
        page: ["eq", "list"],
        pageType: ["eq", "list"]
    }
});
exports.default = fakeComment;
