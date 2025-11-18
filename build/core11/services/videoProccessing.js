"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadVideo = downloadVideo;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("./config"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
class VideoProccessor {
    constructor() {
    }
    static async getDimention(path) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(path, function (err, metadata) {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve({
                        x: metadata.streams[0].width || 5000,
                        y: metadata.streams[0].height || 5000
                    });
                }
            });
        });
    }
    static async screenshot(source, timemarks) {
        console.log(source, timemarks);
        // var screenshot = 
        try {
            var filename = Date.now() + ".png";
            // filename = "uploads/tmp/" + filename
            var folder = "src/uploads/tmp/";
            var dimensions = await this.getDimention(source);
            return new Promise((resolve, reject) => {
                var evn = (0, fluent_ffmpeg_1.default)(source).screenshot({
                    count: 1,
                    filename,
                    size: `${dimensions.x}x${dimensions.y}`,
                    // timestamps : [0],
                    timemarks,
                    folder,
                });
                let sended = false;
                evn.on('error', function (err) {
                    console.log("err", err);
                    if (sended)
                        return;
                    reject(err);
                    sended = true;
                })
                    .on('progress', function (progress) {
                    // console.log(progress);
                })
                    .on('end', async function () {
                    console.log("end");
                    if (sended)
                        return;
                    resolve(filename);
                    sended = true;
                });
            });
            // await eventToPromise(evn, 'end')
            // return filename
        }
        catch (error) {
            console.log(error);
            console.log("error");
        }
    }
}
exports.default = VideoProccessor;
async function downloadVideo(source) {
    var filePath = config_1.default.getConfig("staticRoute") + path_1.default.basename(source);
    const response = await (0, axios_1.default)({
        method: 'GET',
        url: source,
        responseType: 'stream',
        proxy: false
    });
    response.data.pipe(fs_1.default.createWriteStream(filePath));
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve(filePath);
        });
        response.data.on('error', (err) => {
            reject(err);
        });
    });
}
