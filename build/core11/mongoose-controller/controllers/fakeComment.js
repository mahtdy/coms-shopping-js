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
exports.insertSchema = zod_1.default.object({
    pageType: zod_1.default.string(),
    page: controller_1.default.id,
    status: zod_1.default.enum(["waiting", "confirmed", "rejected"]).default("waiting"),
    text: zod_1.default.string(),
    userInfo: zod_1.default.any(),
    publishAt: zod_1.default.coerce.date(),
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
    }
    async updateOne(id, body) {
    }
    async create(data, ...params) {
        return super.create(data);
    }
    delete(id, ...params) {
        return super.delete(id);
    }
    async confirmFakeComment(id) {
    }
    async rejectFakeComment(id) {
    }
    initApis() {
        super.initApis();
    }
}
exports.FakeCommentController = FakeCommentController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.default.object({})
    }))
], FakeCommentController.prototype, "updateOne", null);
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
const fakeComment = new FakeCommentController("/manual-comment", new repository_1.default(), {
    insertSchema: exports.insertSchema
});
exports.default = fakeComment;
