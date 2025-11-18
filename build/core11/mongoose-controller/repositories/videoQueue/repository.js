"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const rabbitmq_1 = __importDefault(require("../../../rabbitmq/rabbitmq"));
const config_1 = __importDefault(require("../../../services/config"));
const repository_2 = __importDefault(require("../videoConfig/repository"));
const repository_3 = __importDefault(require("../system/repository"));
const repository_4 = __importDefault(require("../domainVideoConfig/repository"));
const repository_5 = __importDefault(require("../language/repository"));
const repository_6 = __importDefault(require("../domain/repository"));
class VideoQueueRepository extends repository_1.default {
    constructor(options) {
        super(model_1.VideoQueueModel, options);
        this.rabbitmq = rabbitmq_1.default.getInstance({
            protocol: 'amqp',
            hostname: config_1.default.getConfig("RABBITMQ_SERVER"),
            port: 5672,
            username: config_1.default.getConfig("RABBITMQ_USER"),
            password: config_1.default.getConfig("RABBITMQ_PASSWORD"),
            locale: 'fa_IR',
            frameMax: 0,
            heartbeat: 0,
            vhost: "vhost",
        });
        this.domainVideoRepo = new repository_4.default();
        this.configRepo = new repository_2.default();
        this.systemConfigRepo = new repository_3.default();
        this.domainRepo = new repository_6.default();
        this.languageRepo = new repository_5.default();
    }
    async getInProccessVideo() {
        return await this.findOne({
            status: model_1.VideoQueueStatus.inQueue
        });
    }
    async getFirsInQueue() {
        return this.findOneAndUpdate({
            status: model_1.VideoQueueStatus.inQueue
        }, {
            $set: {
                status: model_1.VideoQueueStatus.inQueue
            }
        });
    }
    async finishProccess(id, result, mainSrc) {
        return this.findByIdAndUpdate(id, {
            $set: {
                status: model_1.VideoQueueStatus.done,
                result: result,
                src: mainSrc
            }
        });
    }
    async proccessed(src, result) {
        await this.updateOne({
            src
        }, {
            $set: {
                result,
                status: model_1.VideoQueueStatus.done
            }
        });
    }
    async failedProccess(id) {
        return this.findByIdAndUpdate(id, {
            $set: {
                status: model_1.VideoQueueStatus.failed
            }
        });
    }
    async startProccess(id, language) {
        var _a;
        try {
            const video = await this.findById(id);
            if (video == null || video.status == model_1.VideoQueueStatus.done)
                return;
            const channel = await ((_a = this.rabbitmq.client) === null || _a === void 0 ? void 0 : _a.createChannel());
            await (channel === null || channel === void 0 ? void 0 : channel.assertQueue("video"));
            var conf = {};
            let dimensions = [];
            let lang = await this.languageRepo.findById(language);
            let type = video.type;
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                var domain = await this.domainRepo.findById(lang.domain);
            }
            else {
                var domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            let q = {
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            };
            var domainVideo = null;
            if (type != undefined) {
                q["type"] = type;
                domainVideo = await this.domainVideoRepo.findOne(q);
            }
            if (domainVideo == null)
                domainVideo = await this.domainVideoRepo.findOne({
                    domain: domain === null || domain === void 0 ? void 0 : domain._id
                });
            console.log("q", q, domainVideo);
            if (domainVideo == null) {
                return;
            }
            let auto_quality = domainVideo === null || domainVideo === void 0 ? void 0 : domainVideo["auto-save-quality"];
            let dimensionConfigs = domainVideo === null || domainVideo === void 0 ? void 0 : domainVideo["save-quality"];
            if (auto_quality && dimensionConfigs) {
                try {
                    for (let i = 0; i < dimensionConfigs.length; i++) {
                        // const element = array[i];
                        let hieght = parseInt(dimensionConfigs[i].split("p")[0]);
                        let width = Math.floor((hieght * 1280) / 720);
                        dimensions.push(width.toString() + "x" + hieght.toString());
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
            if (dimensions.length == 0) {
                dimensions = [
                    "1280x720",
                    "1920x1080",
                    "853x480"
                ];
            }
            let formats = [];
            let resultFormats = domainVideo["video-result-Suffixs"];
            if (resultFormats) {
                try {
                    for (let i = 0; i < resultFormats.length; i++) {
                        //
                        formats.push("av_" + resultFormats[i]);
                    }
                }
                catch (error) {
                }
            }
            if (video.config == undefined)
                conf["hb_conf"] = {
                    dimensions,
                    "rate": 24,
                    "sharpen_filter": "unsharp",
                    "denoise_preset": "medium",
                    "unsharp_tune": "fine",
                    "nlmeans_tune": "highmotion",
                    "detelecine": "",
                    "lapsharp_tune": "film",
                    "unsharp_preset": "light",
                    "lapsharp_preset": "stronger",
                    "format": formats,
                    // "encoder" : "x265_10bit",
                    "denoise_filter": "hqdn3d",
                    "quality": Math.floor(domainVideo["quality-persent"] / 2),
                    // "preset": "Fast 1080p30",
                    configs: []
                };
            else {
                const config = await this.configRepo.findById(video.config);
                conf["hb_conf"] = {
                    dimensions,
                    "rate": 24,
                    "sharpen_filter": "unsharp",
                    "denoise_preset": "medium",
                    "unsharp_tune": "fine",
                    "nlmeans_tune": "highmotion",
                    "detelecine": "",
                    "lapsharp_tune": "film",
                    "unsharp_preset": "light",
                    "lapsharp_preset": "stronger",
                    "format": formats,
                    // "encoder" : "x265_10bit",
                    "denoise_filter": "hqdn3d",
                    "quality": Math.floor(domainVideo["quality-persent"] / 2),
                    // "preset": "Fast 1080p30",
                    configs: config === null || config === void 0 ? void 0 : config.configs
                };
            }
            conf['video'] = video.src;
            conf["type"] = type;
            console.log("cnf", conf);
            const res = channel === null || channel === void 0 ? void 0 : channel.sendToQueue("video", Buffer.from(JSON.stringify(conf)), {});
            await (channel === null || channel === void 0 ? void 0 : channel.close());
        }
        catch (error) {
            console.log("e", error.message);
            return;
        }
    }
    insert(document, options) {
        return super.insert(document, options);
    }
}
exports.default = VideoQueueRepository;
