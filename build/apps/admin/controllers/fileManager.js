"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fileManager_1 = require("../../../core/mongoose-controller/controllers/fileManager");
const uploader_1 = __importDefault(require("../../../core/express/middlewares/uploader"));
var fileManager = new fileManager_1.FileManager("/fileManager");
fileManager.verifyUpload = async function (req, res, next) {
    try {
        var admin = req.session['admin'];
        var fileManager = req.session["fileManager"];
        let directory = req.query.directory;
        if (fileManager == undefined) {
            next(new Error("file manger not found"));
            return;
        }
        var config = await this.fileManagerPermission.findOne({
            admin: admin._id,
            cdn: fileManager._id,
            // pathsPermission
        });
        if (admin.isSuperAdmin) {
            // console.log(req.body)
            var exec = (0, uploader_1.default)([
                {
                    name: "file",
                    maxCount: 10,
                    size: parseInt((100.5 * 1048576).toString(), 10),
                    // types: ["pdf"]
                }
            ]);
            exec(req, res, next);
            return;
        }
        if (config == null) {
            var exec = (0, uploader_1.default)([
                {
                    name: "file",
                    maxCount: 10,
                    size: parseInt((100.5 * 1048576).toString(), 10),
                    // types: ["pdf"]
                }
            ]);
            exec(req, res, next);
            return;
        }
        var exec = (0, uploader_1.default)([
            {
                name: "file",
                maxCount: 10,
                size: parseInt((config.size * 1048576).toString(), 10),
                types: config.uploadTypes
                // types: ["pdf"]
            }
        ]);
        exec(req, res, next);
        return;
    }
    catch (error) {
        next(error);
        return;
    }
};
fileManager.addRoute("/upload", "post", fileManager.upload.bind(fileManager), {
    preExecs: fileManager.getCheckAccsess("upload"),
    middlewares: [fileManager.verifyUpload.bind(fileManager)],
    // contentType : "multipart/form-data"
});
// console.log("query",fileManager.getPathQuery("conetet/test/1/2/" , "view")['$or'])
exports.default = fileManager;
