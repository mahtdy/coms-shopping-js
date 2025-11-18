"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoQueueModel = exports.VideoQueueStatus = void 0;
const mongoose_1 = require("mongoose");
const proccessResultSchema = new mongoose_1.Schema({
    path: {
        type: String,
        required: true
    },
    dimension: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
});
var VideoQueueStatus;
(function (VideoQueueStatus) {
    VideoQueueStatus[VideoQueueStatus["ready"] = 0] = "ready";
    VideoQueueStatus[VideoQueueStatus["inQueue"] = 1] = "inQueue";
    VideoQueueStatus[VideoQueueStatus["done"] = 2] = "done";
    VideoQueueStatus[VideoQueueStatus["failed"] = 3] = "failed";
})(VideoQueueStatus || (exports.VideoQueueStatus = VideoQueueStatus = {}));
const videoQueueSchema = new mongoose_1.Schema({
    src: {
        type: String,
        required: true,
        unique: true
    },
    result: {
        type: [proccessResultSchema],
        required: true,
        default: []
    },
    error: {
        type: Object,
        required: true,
        default: {}
    },
    status: {
        type: Number,
        required: true,
        enum: VideoQueueStatus,
        default: VideoQueueStatus.ready
    },
    subTitles: {
        type: [
            new mongoose_1.Schema({
                sign: {
                    type: String,
                    required: true
                },
                source: {
                    type: String,
                    required: true
                },
                hardSub: {
                    type: Boolean,
                    required: false
                },
                title: {
                    type: String,
                    required: true
                },
                character: {
                    type: String,
                    required: false,
                    default: "false"
                },
                offset: {
                    type: Number,
                    required: false
                },
                isdefault: {
                    type: Boolean,
                    required: false
                }
            })
        ],
        required: true,
        default: []
    },
    hardSub: {
        type: new mongoose_1.Schema({
            sign: {
                type: String,
                required: true
            },
            source: {
                type: String,
                required: true
            },
            hardSub: {
                type: Boolean,
                required: false
            },
            title: {
                type: String,
                required: true
            },
            character: {
                type: String,
                required: false,
                default: "false"
            },
            offset: {
                type: Number,
                required: false
            },
        }),
        required: false,
    },
    screenshots: {
        type: [String],
        required: true,
        default: []
    },
    aparat: {
        type: Object,
        required: false
    },
    aparat_url: {
        type: String,
        required: false
    },
    youtube: {
        type: Object,
        required: false
    },
    youtube_url: {
        type: String,
        required: false
    },
    config: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    type: {
        type: String,
        required: false
    }
});
exports.VideoQueueModel = (0, mongoose_1.model)("videoQueue", videoQueueSchema);
