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
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const zod_1 = require("zod");
const repository_1 = __importDefault(require("../repositories/keyword/repository"));
const repository_2 = __importDefault(require("../repositories/linkTag/repository"));
const repository_3 = __importDefault(require("../repositories/content/repository"));
const repository_4 = __importDefault(require("../repositories/domain/repository"));
const repository_5 = __importDefault(require("../repositories/linkMap/repository"));
class LinkEventController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.keywordRepo = new repository_1.default();
        this.linkTagRepo = new repository_2.default();
        this.contentRepo = new repository_3.default();
        this.domainRepo = new repository_4.default();
        this.linkMapRepo = new repository_5.default(this.keywordRepo);
    }
    async clicked(data) {
        try {
            console.log("data", data);
            let keyword = await this.keywordRepo.findOne({
                text: data.keyword
            });
            if (keyword == null) {
                return {
                    status: 200
                };
            }
            let content = null;
            if (data.target.startsWith("/tag_")) {
                const linkTag = await this.linkTagRepo.findOne({
                    tag: data.target
                });
                if (linkTag != null) {
                    content = await this.contentRepo.findById(linkTag.link);
                    if (content == null) {
                        return {
                            status: 200
                        };
                    }
                }
            }
            else {
                let u = data.target;
                if (data.target.startsWith("http")) {
                    let url = new URL(data.target);
                    // u =
                    let domain = await this.domainRepo.findOne({
                        domain: url.host
                    });
                    if (domain == null) {
                        return {
                            status: 200
                        };
                    }
                    u = domain.isDefault ? url.pathname : url.host + url.pathname;
                }
                content = await this.contentRepo.findOne({
                    url: u
                });
            }
            if (content == null) {
                return {
                    status: 200
                };
            }
            const linkMap = await this.linkMapRepo.findOne({
                from: data.page,
                to: content.id,
                keyword: keyword._id
            });
            if (linkMap != null) {
                return this.create({
                    keyword: keyword._id,
                    to: content.id,
                    toType: linkMap.toType,
                    from: linkMap.from,
                    fromType: linkMap.fromType,
                    part: data.part,
                    subPartId: data.subPartId
                });
            }
        }
        catch (error) {
        }
        return {
            status: 200,
            data: {}
        };
    }
    initApis() {
    }
}
exports.default = LinkEventController;
__decorate([
    (0, method_1.Post)("/clicked"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            keyword: zod_1.z.string(),
            page: controller_1.default.id,
            target: zod_1.z.string(),
            part: zod_1.z.enum([
                "comment",
                "content",
                "summary",
                "faq"
            ]),
            subPartId: controller_1.default.id.optional(),
        })
    }))
], LinkEventController.prototype, "clicked", null);
