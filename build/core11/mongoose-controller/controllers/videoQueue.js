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
exports.VideoQueueController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const model_1 = require("../repositories/videoQueue/model");
const repository_1 = __importDefault(require("../repositories/videoQueue/repository"));
const zod_1 = require("zod");
class VideoQueueController extends controller_1.default {
    async validateVideo(video) {
        return this.findOne({
            $or: [
                {
                    src: video,
                },
                {
                    "result.path": video
                }
            ],
            locked: true
        });
    }
    async startQueue(id) {
        try {
            await this.repository.startProccess(id);
            return {
                status: 200,
                message: "در حال پردازش"
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async create(data, ...params) {
        try {
            console.log(data);
            const doc = await this.repository.findOne({
                $or: [
                    {
                        src: data.src,
                    },
                    {
                        "result.path": data.src
                    }
                ],
            });
            if (doc != null)
                return {
                    status: 200,
                    data: doc
                };
        }
        catch (error) {
            throw error;
        }
        return super.create(data);
    }
    findById(id, queryInfo) {
        return super.findById(id);
    }
    async addSubTitle(id, sub) {
        return this.editById(id, {
            $push: {
                subTitles: sub
            }
        });
    }
    async editSubTitle(id, subID, sub) {
        sub["_id"] = subID;
        try {
            return this.editOne({
                _id: id,
                "subTitles._id": subID
            }, {
                $set: {
                    "subTitles.$": sub
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async addHardSubTitle(id, sub) {
        return this.editById(id, {
            $set: {
                hardSub: sub,
                subTitles: [],
                status: model_1.VideoQueueStatus.ready
            },
        });
    }
    async addConfig(id, config) {
        try {
            return this.editById(id, {
                $set: {
                    config,
                    status: model_1.VideoQueueStatus.ready
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async addScreenshots(id, screenshots) {
        return this.editById(id, {
            $set: {
                screenshots
            }
        });
    }
    async deleteSubTitle(id, subID) {
        return this.editById(id, {
            $pull: {
                subTitles: {
                    _id: subID
                }
            }
        });
    }
    lockVideo(videoID, id, type) {
        return this.editById(videoID, {
            $set: {
                id,
                type,
                locked: true
            }
        });
    }
    unlockVideo(videoID, id, type) {
        return this.editOne({
            _id: videoID,
            id,
            type
        }, {
            $set: {
                locked: false
            },
            $unset: {
                id: 1,
                type: 1
            }
        });
    }
}
exports.VideoQueueController = VideoQueueController;
__decorate([
    (0, method_1.Get)("/validate"),
    __param(0, (0, parameters_1.Query)({
        destination: "video",
        schema: zod_1.z.string()
    }))
], VideoQueueController.prototype, "validateVideo", null);
__decorate([
    (0, method_1.Post)("/start"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], VideoQueueController.prototype, "startQueue", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], VideoQueueController.prototype, "findById", null);
__decorate([
    (0, method_1.Post)("/subTitle"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "sub",
        schema: zod_1.z.object({
            sign: zod_1.z.string().default("en"),
            source: zod_1.z.string().url(),
            title: zod_1.z.string(),
            character: zod_1.z.string(),
            offset: zod_1.z.number().optional(),
            isdefault: zod_1.z.boolean().optional()
        })
    }))
], VideoQueueController.prototype, "addSubTitle", null);
__decorate([
    (0, method_1.Put)("/subTitle"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "subID",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "sub",
        schema: zod_1.z.object({
            sign: zod_1.z.string().default("en"),
            source: zod_1.z.string().url(),
            title: zod_1.z.string(),
            character: zod_1.z.string(),
            offset: zod_1.z.number().optional(),
            isdefault: zod_1.z.boolean().optional()
        })
    }))
], VideoQueueController.prototype, "editSubTitle", null);
__decorate([
    (0, method_1.Post)("/subTiltle/hard"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "sub",
        schema: zod_1.z.object({
            sign: zod_1.z.string().default("en"),
            source: zod_1.z.string().url(),
            title: zod_1.z.string(),
            character: zod_1.z.string(),
            offset: zod_1.z.number().optional()
        })
    }))
], VideoQueueController.prototype, "addHardSubTitle", null);
__decorate([
    (0, method_1.Post)("/config"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "config",
        schema: controller_1.default.id
    }))
], VideoQueueController.prototype, "addConfig", null);
__decorate([
    (0, method_1.Post)("/screen-shots"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "screenshots",
        schema: zod_1.z.array(zod_1.z.string().url())
    }))
], VideoQueueController.prototype, "addScreenshots", null);
__decorate([
    (0, method_1.Delete)("/subTitle"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "subID",
        schema: controller_1.default.id
    }))
], VideoQueueController.prototype, "deleteSubTitle", null);
__decorate([
    (0, method_1.Post)("/lock"),
    __param(0, (0, parameters_1.Body)({
        destination: "videoID",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "type",
        schema: zod_1.z.string()
    }))
], VideoQueueController.prototype, "lockVideo", null);
__decorate([
    (0, method_1.Post)("/unlock"),
    __param(0, (0, parameters_1.Body)({
        destination: "videoID",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "type",
        schema: zod_1.z.string()
    }))
], VideoQueueController.prototype, "unlockVideo", null);
const videoQueue = new VideoQueueController("/videoQueue", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        src: controller_1.default.url,
        type: zod_1.z.string().optional()
    })
});
exports.default = videoQueue;
