"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = upload;
exports.mapUploadsToBody = mapUploadsToBody;
exports.moveFilesToCDN = moveFilesToCDN;
const multer_1 = __importStar(require("multer"));
const path_1 = __importDefault(require("path"));
const fileManager_1 = __importDefault(require("../../services/fileManager"));
async function execute(execution) {
    return (req, res, next) => {
        execution(req, res, next);
    };
}
function upload(config) {
    return (req, res, next) => {
        // console.log("ccc",config)
        // console.log("file",config)
        // console.log("body",req.files)
        // if(req.files == undefined){
        //     console.log("body" ,req.body)
        //     return multer().any()(req,res,next)
        // }
        // console.log("ddd" , req.files)
        var uploader = (0, multer_1.default)({
            fileFilter: function (req, file, cb) {
                var _a;
                const index = config.findIndex((elem) => {
                    return file.fieldname == elem.name;
                });
                // for (let i = 0; i < config.length; i++) {
                //     console.log("file12",file)
                if (config[index].types) {
                    var ext = path_1.default.extname(file.originalname);
                    if ((_a = config[index].types) === null || _a === void 0 ? void 0 : _a.includes(ext.substr(1))) {
                        cb(null, true);
                    }
                    else {
                        req.fileValidationErr = new multer_1.MulterError("LIMIT_UNEXPECTED_FILE");
                        return cb(null, false);
                        // throw new M
                        // cb()
                        // return false
                        // throw 
                    }
                }
                else {
                    cb(null, true);
                }
                // }
            },
            storage: multer_1.default.diskStorage({
                filename: function (req, file, cb) {
                    var name = config[0].rename ? Date.now() + path_1.default.extname(file.originalname) : file.originalname;
                    cb(null, name);
                },
                destination: function (req, file, cb) {
                    cb(null, config[0].dest || "src/uploads/");
                },
            }),
            limits: {
                fileSize: config[0].size || 50000000000000,
            }
        });
        uploader.fields(config)(req, res, function (error) {
            if (error != undefined) {
                next(error);
                // next()
                return;
            }
            if (req.fileValidationErr) {
                next(req.fileValidationErr);
                return;
            }
            next();
            return;
        });
    };
}
function mapUploadsToBody(name, toSplitName) {
    return (req, res, next) => {
        var _a, _b;
        if (req.files == undefined) {
            // console.log("body" ,req.body)
            next();
            return;
        }
        if (typeof name == "string") {
            if (req.files != undefined && ((_a = req.files[name]) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                // console.log(req.files[name][0])
                req.body[name] = req.files[name][0].path;
            }
            if (toSplitName != undefined && req.body[toSplitName] != undefined) {
                req.body[toSplitName] = req.body[toSplitName].split(",");
            }
            next();
            return;
        }
        else {
            for (let i = 0; i < name.length; i++) {
                if (req.files != undefined && req.files[name[i]] != undefined && ((_b = req.files[name[i]]) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                    req.body[name[i]] = req.files[name[i]][0].path;
                }
                if (toSplitName != undefined && req.body[toSplitName] != undefined) {
                    req.body[toSplitName] = req.body[toSplitName].split(",");
                }
            }
            next();
            return;
        }
    };
}
function moveFilesToCDN(name, options) {
    return async (req, res, next) => {
        if (req.files) {
            var cdn;
            if (options === null || options === void 0 ? void 0 : options.customServer) {
                cdn = new fileManager_1.default();
                if (typeof options.customServer == "function") {
                    // console.log(await options.customServer())
                    cdn.initFromConfig(await options.customServer());
                }
                else
                    cdn.initFromConfig(options.customServer);
            }
            else {
                (options === null || options === void 0 ? void 0 : options.server) ? cdn = new fileManager_1.default(options === null || options === void 0 ? void 0 : options.server) : cdn = new fileManager_1.default();
            }
            req.cdn_conf = cdn.getConfig();
            let cdnPath = "";
            if ((options === null || options === void 0 ? void 0 : options.path) != undefined) {
                if (typeof options.path == "string") {
                    cdnPath = options.path;
                }
                else {
                    try {
                        cdnPath = await options.path();
                    }
                    catch (error) {
                    }
                }
            }
            if (typeof name == "string") {
                try {
                    if (req.files != undefined && req.files[name] != undefined && req.files[name].length > 0) {
                        if (req.files[name].length == 1) {
                            var destinationPath = req.files[name][0].path.split("/");
                            if (options === null || options === void 0 ? void 0 : options.uploadWithState) {
                                req.body[name] = await cdn.uploadWithState(req.files[name][0].path, cdnPath + destinationPath[destinationPath.length - 1]);
                            }
                            else {
                                req.body[name] = await cdn.upload(req.files[name][0].path, cdnPath + destinationPath[destinationPath.length - 1]);
                            }
                        }
                        else {
                            var urls = [];
                            for (let i = 0; i < req.files[name].length; i++) {
                                var destinationPath = req.files[name][i].path.split("/");
                                req.destinationPath = cdnPath + destinationPath[destinationPath.length - 1];
                                if (options === null || options === void 0 ? void 0 : options.uploadWithState) {
                                    let f = await cdn.uploadWithState(req.files[name][i].path, cdnPath + destinationPath[destinationPath.length - 1]);
                                    urls.push(f);
                                }
                                else {
                                    let f = await cdn.upload(req.files[name][i].path, cdnPath + destinationPath[destinationPath.length - 1]);
                                    urls.push(f);
                                }
                            }
                            req.body[name] = urls;
                        }
                        // console.log(req.body)
                    }
                    next();
                    return;
                }
                catch (error) {
                    next(error);
                    return;
                }
            }
            else {
                var paths = [];
                var pathsToDelete = [];
                for (let i = 0; i < name.length; i++) {
                    if (req.files != undefined && req.files[name[i]] != undefined && req.files[name[i]].length > 0) {
                        var destinationPath = req.files[name[i]][0].path.split("/");
                        req.destinationPath = cdnPath + destinationPath[destinationPath.length - 1];
                        if (options === null || options === void 0 ? void 0 : options.uploadWithState) {
                            req.body[name[i]] = await cdn.uploadWithState(req.files[name[i]][0].path, cdnPath + destinationPath[destinationPath.length - 1]);
                        }
                        else {
                            req.body[name[i]] = await cdn.upload(req.files[name[i]][0].path, cdnPath + destinationPath[destinationPath.length - 1]);
                        }
                    }
                }
                next();
                return;
            }
        }
        next();
        return;
    };
}
