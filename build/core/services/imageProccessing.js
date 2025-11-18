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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const gm_1 = __importDefault(require("gm"));
var gmCli = gm_1.default.subClass({ imageMagick: true });
const model_1 = require("../mongoose-controller/repositories/waterMarkConfig/model");
const fileManager_1 = require("./fileManager");
const random_1 = __importDefault(require("../random"));
const repository_1 = __importDefault(require("../mongoose-controller/repositories/waterMarkConfig/repository"));
var text2png = require('./text2png');
const jimp_1 = __importDefault(require("jimp"));
const path_1 = __importDefault(require("path"));
const canvas_1 = require("canvas");
const filters = __importStar(require("instagram-filters"));
const fs_1 = __importDefault(require("fs"));
const errorLogger_1 = __importDefault(require("../errorLogger"));
const util_1 = require("util");
const gmAsync = (img) => ({
    write: (0, util_1.promisify)(img.write).bind(img)
});
var localImagesMap = {};
var filterConfig = {
    amaro: filters.amaro,
    clarendon: filters.clarendon,
    gingham: filters.gingham,
    moon: filters.moon,
    lark: filters.lark,
    reyes: filters.reyes,
    juno: filters.juno,
    slumber: filters.slumber,
    crema: filters.crema,
    ludwig: filters.ludwig,
    aden: filters.aden,
    perpetua: filters.perpetua,
    mayfair: filters.mayfair,
    rise: filters.rise,
    hudson: filters.hudson,
    valencia: filters.valencia,
    "x-pro2": filters.xpro2,
    sierra: filters.sierra,
    willow: filters.willow,
    "lo-fi": filters.lofi,
    inkwell: filters.inkwell,
    hefe: filters.hefe,
    nashville: filters.nashville,
    stinson: filters.stinson,
    vesper: filters.vesper,
    earlybird: filters.earlybird,
    brannan: filters.brannan,
    sutro: filters.sutro,
    toaster: filters.toaster,
    walden: filters.walden,
    1977: filters.year1977,
    kelvin: filters.kelvin,
    maven: filters.maven,
    ginza: filters.ginza,
    skyline: filters.skyline,
    dogpatch: filters.dogpatch,
    brooklyn: filters.brooklyn,
    helena: filters.helena,
    ashby: filters.ashby,
    charmes: filters.charmes,
};
class ImageProccessesor {
    constructor() {
    }
    static async proccess(baseDir, path, lable) {
        var paths = [];
        try {
            var p = path;
            var ps = [];
            ps.push(path);
            var waterMarkRepository = new repository_1.default();
            var waterMarks = await waterMarkRepository.findOne({
                lable: lable
            }, {
                fromDb: true
            });
            if (waterMarks === null || waterMarks === void 0 ? void 0 : waterMarks.configs) {
                for (let i = 0; i < (waterMarks === null || waterMarks === void 0 ? void 0 : waterMarks.configs.length); i++) {
                    let data = await this.waterMark(baseDir, path, waterMarks.configs[i]);
                    paths.push({
                        name: "",
                        path: data
                    });
                }
            }
            await fileManager_1.DiskFileManager.removeFiles(ps);
        }
        catch (error) {
            var pathsToDel = [];
            for (let i = 0; i < paths.length; i++) {
                pathsToDel.push(paths[i].path);
            }
            try {
                await fileManager_1.DiskFileManager.removeFiles(pathsToDel);
            }
            catch (err) {
                throw err;
            }
            throw error;
        }
        return paths;
    }
    static async proccessFromConfig(baseDir, pathh, configs, customConfig) {
        var _a, _b, _c, _d;
        var ps = [];
        let paths = [];
        var p = pathh;
        let forWebP = [];
        for (let i = 0; i < (configs === null || configs === void 0 ? void 0 : configs.length); i++) {
            let newPath = await this.crop(baseDir, p, Object.assign(configs[i].resolotion, customConfig[configs[i].name]));
            let webP;
            if ((_a = configs[i].compersionConfig.resultTypes) === null || _a === void 0 ? void 0 : _a.includes("png")) {
                pathh = newPath;
                pathh = await this.getPNG(baseDir, pathh, configs[i].compersionConfig);
                ps.push(pathh);
                await this.proccessResult(pathh, configs[i].compersionConfig);
                paths.push({
                    path: pathh,
                    name: "png" + "$" + configs[i].name
                });
                webP = pathh;
            }
            if ((_b = configs[i].compersionConfig.resultTypes) === null || _b === void 0 ? void 0 : _b.includes("jpg")) {
                pathh = newPath;
                pathh = await this.getJpeg(baseDir, pathh, configs[i].compersionConfig);
                ps.push(pathh);
                await this.proccessResult(pathh, configs[i].compersionConfig);
                paths.push({
                    path: pathh,
                    name: "jpg" + "$" + configs[i].name
                });
                webP = pathh;
            }
            // if (configs[i].compersionConfig.resultTypes?.includes("avif")) {
            //     pathh = newPath
            //     pathh = await this.getAVIF(baseDir, pathh, configs[i].compersionConfig)
            //     console.log("path" ,paths)
            //     ps.push(pathh)
            //     await this.proccessResult(pathh, configs[i].compersionConfig)
            //     paths.push({
            //         path: pathh,
            //         name: "jpg" + "$" + configs[i].name
            //     })
            //     webP = pathh
            // }
            forWebP.push(webP);
            fileManager_1.DiskFileManager.removeFile(newPath);
        }
        for (let i = 0; i < (configs === null || configs === void 0 ? void 0 : configs.length); i++) {
            let newPath = await this.crop(baseDir, p, Object.assign(configs[i].resolotion, customConfig[configs[i].name]));
            if (((_c = configs[i].compersionConfig.resultTypes) === null || _c === void 0 ? void 0 : _c.includes("webp")) && forWebP[i] != undefined) {
                pathh = newPath;
                pathh = await this.getWebP(baseDir, forWebP[i], {});
                ps.push(pathh);
                // await this.proccessResult(pathh, configs[i].compersionConfig)
                paths.push({
                    path: pathh,
                    name: "webp" + "$" + configs[i].name
                });
            }
            if ((_d = configs[i].compersionConfig.resultTypes) === null || _d === void 0 ? void 0 : _d.includes("avif")) {
                pathh = newPath;
                pathh = await this.getAVIF(baseDir, forWebP[i], {});
                ps.push(pathh);
                paths.push({
                    path: pathh,
                    name: "avif" + "$" + configs[i].name
                });
            }
            fileManager_1.DiskFileManager.removeFile(newPath);
        }
        return paths;
    }
    static async proccessResult(p, waterMark) {
        // return
        await new Promise(async (resolve, reject) => {
            var res = gmCli(p);
            if (waterMark.resultQuality)
                res = res.quality(waterMark.resultQuality);
            if (waterMark.resultAngle)
                res = res.rotate('#000000ff', waterMark.resultAngle);
            if (waterMark.flipVertical == true)
                res = res.flip();
            if (waterMark.flipHorizontal == true)
                res = res.flop();
            var i = undefined;
            if (!p.endsWith(".webp") && waterMark.resultSize) {
                try {
                    i = await jimp_1.default.read(p);
                    var h = Math.round((i.bitmap.height / i.bitmap.width) * waterMark.resultSize);
                    res = res.resize(50000, h);
                }
                catch (error) {
                }
            }
            await this.effect(p, waterMark);
            if (waterMark.filter && !p.endsWith(".png")) {
                await this.customFilter(p, waterMark.filter);
            }
            await this.border(p, waterMark);
            res.write(p, async function (err, stdout, stderr, command) {
                if (err) {
                    return reject(err);
                }
                return resolve(p);
            });
        });
    }
    static async refresh(baseDir, filepath, config) {
        var paths = [];
        try {
            if (config.configs) {
                var p = filepath;
                for (let i = 0; i < config.configs.length; i++) {
                    let ex = p;
                    p = await this.waterMark(baseDir, p, config.configs[i]);
                    if (ex != filepath) {
                        fileManager_1.DiskFileManager.removeFile(ex);
                    }
                    if (config.configs[i].diagonalLines) {
                        let ib = await jimp_1.default.read(p);
                        var res = gmCli(p);
                        res = res.stroke(config.configs[i].diagonalLinesColor || "black", 4);
                        res = res.drawLine(0, 0, ib.bitmap.width, ib.bitmap.height);
                        res = res.drawLine(0, ib.bitmap.height, ib.bitmap.width, 0);
                        await new Promise((resolve, reject) => {
                            res.write(p, async function (err, stdout, stderr, command) {
                                if (err) {
                                    return reject(err);
                                }
                                return resolve(p);
                            });
                        });
                    }
                }
            }
            else {
                var respath = `${baseDir}${random_1.default.generateHash()}_output${path_1.default.extname(filepath)}`;
                var res = gmCli(filepath);
                await new Promise((resolve, reject) => {
                    res.write(respath, function (err, stdout, stderr, command) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(respath);
                    });
                });
                p = respath;
            }
            await this.proccessResult(p, config);
            return p;
        }
        catch (error) {
            var pathsToDel = [];
            for (let i = 0; i < paths.length; i++) {
                pathsToDel.push(paths[i].path);
            }
            try {
                await fileManager_1.DiskFileManager.removeFiles(pathsToDel);
            }
            catch (err) {
                throw err;
            }
            throw error;
        }
    }
    static async apply(baseDir, path, config) {
        var paths = [];
        try {
            var p = path;
            var ps = [];
            ps.push(path);
            if (path.endsWith("png")) {
                path = await this.getPNG(baseDir, path, config);
                await this.proccessResult(path, config);
                paths.push({
                    path,
                    name: "png"
                });
            }
            else if (path.endsWith("jpg")) {
                path = p;
                path = await this.getJpeg(baseDir, path, config);
                await this.proccessResult(path, config);
                paths.push({
                    path,
                    name: "jpg"
                });
            }
            await fileManager_1.DiskFileManager.wirteStream(p, fs_1.default.createReadStream(path, {}));
            await fileManager_1.DiskFileManager.removeFile(path);
        }
        catch (error) {
            var pathsToDel = [];
            for (let i = 0; i < paths.length; i++) {
                pathsToDel.push(paths[i].path);
            }
            try {
                await fileManager_1.DiskFileManager.removeFiles(pathsToDel);
            }
            catch (err) {
                //log error
                throw err;
            }
            throw error;
        }
        // return paths
    }
    static async getWebP(baseDir, path, waterMark) {
        var respath = `${baseDir}${random_1.default.generateHash()}_output.webp`;
        try {
            var p = await this.waterMark(baseDir, path, waterMark);
            await new Promise((resolve, reject) => {
                var res = gmCli(p);
                res.write(respath, async function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(respath);
                });
            });
            return respath;
        }
        catch (error) {
            throw error;
        }
    }
    static async getJPGOnly(baseDir, path, term) {
        var respath = `${path.replace(term, "")}.jpg`;
        try {
            await new Promise((resolve, reject) => {
                var res = gmCli(path);
                res.write(respath, async function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(respath);
                });
            });
            return respath;
        }
        catch (error) {
            throw error;
        }
    }
    static async getDimensions(path) {
        return new Promise(async function (resolve, reject) {
            if (path.startsWith("http")) {
                let p = await fileManager_1.DiskFileManager.downloadFile(path);
                gmCli(p).size(async (err, dimensions) => {
                    await fileManager_1.DiskFileManager.removeFile(p);
                    if (err)
                        reject(err);
                    resolve(dimensions);
                });
            }
            else {
                gmCli(path).size((err, dimensions) => {
                    if (err)
                        reject(err);
                    resolve(dimensions);
                });
            }
        });
    }
    static async crop(baseDir, p, options) {
        try {
            let respath = `${baseDir}${random_1.default.generateHash()}.${path_1.default.extname(p)}`;
            var res = gmCli(p);
            let dimensions = await this.getDimensions(p);
            let heightRate = dimensions.height / options.h;
            let widthRate = dimensions.width / options.w;
            let target = {
                h: options.h,
                w: options.w
            };
            if (widthRate > heightRate) {
                target.h = dimensions.height;
                target.w = Math.floor(target.w * (heightRate));
            }
            else {
                target.w = dimensions.width;
                target.h = Math.floor(target.h * (widthRate));
            }
            if (options.x != undefined && options.y != undefined)
                res = res.crop(target.w, target.h, options.x, options.y);
            else
                res = res.crop(target.w, target.h, Math.floor((dimensions.width - target.w) / 2), Math.floor((dimensions.height - target.h) / 2));
            res.resize(options.w, options.h);
            return new Promise((resolve, reject) => {
                res.write(respath, async function (err, stdout, stderr, command) {
                    if (err) {
                        console.log("err", respath);
                        return reject(err);
                    }
                    return resolve(respath);
                });
            });
        }
        catch (error) {
            throw error;
        }
    }
    static async getPNG(baseDir, path, waterMark) {
        var respath = `${baseDir}${random_1.default.generateHash()}_output.png`;
        try {
            var p = await this.waterMark(baseDir, path, waterMark);
            await new Promise((resolve, reject) => {
                var res = gmCli(p);
                res.write(respath, async function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(respath);
                });
            });
            return respath;
        }
        catch (error) {
            throw error;
        }
    }
    static async getJpeg(baseDir, path, waterMark) {
        var respath = `${baseDir}${random_1.default.generateHash()}_output.jpg`;
        try {
            var p = await this.waterMark(baseDir, path, waterMark);
            await new Promise((resolve, reject) => {
                var res = gmCli(p);
                res.write(respath, async function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(respath);
                });
            });
            return respath;
        }
        catch (error) {
            throw error;
        }
    }
    static async getAVIF(baseDir, path, waterMark) {
        var respath = `${baseDir}${random_1.default.generateHash()}_output.avif`;
        try {
            var p = await this.waterMark(baseDir, path, waterMark);
            await new Promise((resolve, reject) => {
                var res = gmCli(p);
                res.write(respath, async function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(respath);
                });
            });
            return respath;
        }
        catch (error) {
            throw error;
        }
    }
    static async resize(baseDir, path, extName = "png", x = 150, y = 150, options) {
        var respath = `${baseDir}${random_1.default.generateHash()}_resize_output.${extName}`;
        return new Promise((resolve, reject) => {
            gmCli(path)
                .quality(100)
                .resize(x, y, options)
                .write(respath, function (err, stdout, stderr, command) {
                if (err) {
                    return reject(err);
                }
                return resolve(respath);
            });
        });
    }
    static async safeRemove(...files) {
        for (const f of files) {
            try {
                await fileManager_1.DiskFileManager.removeFile(f);
            }
            catch (_a) { }
        }
    }
    static async resizeAndRename(baseDir, imagePath, options) {
        var _a;
        let img = await fileManager_1.DiskFileManager.downloadFile(imagePath);
        let inf = await this.getDimensions(img);
        let nonSupports = [".webp", ".avif"];
        for (let i = 0; i < nonSupports.length; i++) {
            if (img.endsWith(nonSupports[i])) {
                const delImg = img;
                img = await this.getJPGOnly("src/uploads/tmp/", img, nonSupports[i]);
                await this.safeRemove(delImg);
                break;
            }
        }
        inf = await this.getDimensions(img);
        const { width, height } = await this.getDimensions(img);
        const y = Math.floor((height * options.x) / width);
        const base = path_1.default.basename(img).replace(/\.[^.]+$/, ""); // بدون پسوند
        const prefix = options.mobile ? "-mb" : "";
        const newBase = `${base}${prefix}-${options.x}x${y}`;
        let processedImg = img;
        if (((_a = options.watermark) === null || _a === void 0 ? void 0 : _a.configs) && options.isMapImg != true) {
            for (const cfg of options.watermark.configs) {
                const old = processedImg;
                processedImg = await this.waterMark("temp/", processedImg, { ...cfg });
                await this.safeRemove(old);
            }
            await this.proccessResult(processedImg, options.watermark);
        }
        const results = await Promise.all(options.suffixs.map(async (suffix) => {
            const resPath = `${baseDir}/${newBase}.${suffix}`.replace("//", "/");
            await new Promise((resolve, reject) => {
                gmCli(processedImg)
                    .quality(options.q)
                    .resize(options.x)
                    .write(resPath, (err) => err ? reject(err) : resolve(resPath));
            });
            return resPath;
        }));
        await this.safeRemove(img, processedImg);
        return results;
    }
    static async waterMark(baseDir, path, waterMark) {
        if (waterMark.type == model_1.waterMarkType.image) {
            try {
                return await this.makeWaterMarkImage(baseDir, path, waterMark);
            }
            catch (error) {
                throw error;
            }
        }
        else {
            if (waterMark.imageAddress != undefined && waterMark.imageAddress != null) {
                try {
                    return await this.makeWaterMarkImage(baseDir, path, waterMark);
                }
                catch (error) {
                    throw error;
                }
            }
            else {
                try {
                    return await this.makeWaterMarkText(baseDir, path, waterMark);
                }
                catch (error) {
                    throw error;
                }
            }
        }
    }
    static async makeWaterMarkText(baseDir, path, waterMark) {
        try {
            if (!waterMark.text)
                return path;
            var tempName = `temp_${Date.now()}.png`;
            var italic = waterMark.italic ? "italic " : "";
            var bold = waterMark.bold ? "bold " : "";
            var underline = waterMark.underline ? "underline " : "";
            var font = waterMark.fontName;
            let fonts = font === null || font === void 0 ? void 0 : font.split("/");
            font = fonts[(fonts === null || fonts === void 0 ? void 0 : fonts.length) - 1].split(".")[0];
            await fileManager_1.DiskFileManager.writeFile(`src/uploads/${tempName}`, text2png(waterMark.text, {
                backgroundColor: waterMark.backgroundColor,
                strokeWidth: waterMark.strokeWidths,
                strokeColor: waterMark.strokeColor,
                shadowColor: waterMark.shadowColor,
                shadowBlur: waterMark.shadowBlur,
                shadowOffsetX: waterMark.shadowOffsetX,
                shadowOffsetY: waterMark.shadowOffsetY,
                underline: waterMark.underline,
                color: waterMark.fontColor,
                font: `${italic}${bold} ${underline}${waterMark.fontSize}px ${font}`,
                fontSize: waterMark.fontSize,
                padding: 8,
                localFontPath: `src/fonts${waterMark.fontName}`,
                localFontName: `${font}`,
                textAlign: waterMark.textAlign,
                lineSpacing: waterMark.lineSpacing,
                wordSpacing: waterMark.wordSpacing,
            }));
            if (waterMark.angle) {
                await new Promise((resolve, reject) => {
                    (0, gm_1.default)(`src/uploads/${tempName}`)
                        .rotate("transparent", waterMark.angle)
                        .write(`src/uploads/${tempName}`, function (err, stdout, stderr, command) {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(`src/uploads/${tempName}`);
                    });
                });
            }
            var wmPath = await this.transparency(waterMark, `src/uploads/${tempName}`);
            var respath = await this.makeWaterMark(baseDir, path, wmPath, Object.assign({
                gravity: waterMark.gravity,
                position_x: waterMark.position_x,
                position_y: waterMark.position_y,
                x: 0,
                y: 0
            }, JSON.parse(JSON.stringify(waterMark))));
            await fileManager_1.DiskFileManager.removeFiles([
                wmPath,
            ]);
            return respath;
        }
        catch (error) {
            throw error;
        }
    }
    static async makeWatermarks(img, waterMarks, baseDir) {
        let temp = img;
        let result;
        let deleteList = [];
        for (let i = 0; i < waterMarks.length; i++) {
            result = await this.waterMark(baseDir || "src/uploads/", temp, { ...waterMarks[i] });
            deleteList.push(temp);
            temp = result;
        }
        for (let i = 0; i < deleteList.length; i++) {
            try {
                await fileManager_1.DiskFileManager.removeFile(deleteList[i]);
            }
            catch (error) {
            }
        }
        return result || img;
    }
    static async makeWaterMarkImage(baseDir, p, waterMark) {
        var wmDimensions = await this.calculateWaterMarkDimentions(p, waterMark.imageAddress, waterMark.waterMarkSizeType == "relative", waterMark.waterMarkSize);
        if (waterMark.imageAddress.startsWith("http")) {
            waterMark.imageAddress = await fileManager_1.DiskFileManager.downloadFile(waterMark.imageAddress, "temp/");
        }
        var wpath = await this.resize(baseDir, waterMark.imageAddress, "png", wmDimensions.x || waterMark.x, wmDimensions.y || waterMark.y, "!");
        fileManager_1.DiskFileManager.removeFile(waterMark.imageAddress);
        await new Promise((resolve, reject) => {
            (0, gm_1.default)(wpath)
                .rotate("transparent", waterMark.angle).
                write(wpath, function (err, stdout, stderr, command) {
                if (err) {
                    return reject(err);
                }
                return resolve(waterMark.imageAddress);
            });
        });
        // }
        var wmPath = await this.transparency(waterMark, wpath);
        delete waterMark['x'];
        delete waterMark['y'];
        var respath = await this.makeWaterMark(baseDir, p, wmPath, Object.assign({
            position_x: waterMark.position_x,
            position_y: waterMark.position_y,
            x: 0,
            y: 0
        }, JSON.parse(JSON.stringify(waterMark))));
        await fileManager_1.DiskFileManager.removeFiles([
            wmPath,
            // p
        ]);
        return respath;
    }
    static async makeConfig(baseDir, p, waterMark) {
        await this.effect(p, waterMark);
        return p;
    }
    static async transparency(waterMark, path) {
        if (waterMark.transparency == undefined) {
            return path;
        }
        var image = await jimp_1.default.read(path);
        var paths = path.split(".");
        paths = paths.slice(0, paths.length);
        path = paths.join('.') + ".png";
        return new Promise((resolve, reject) => {
            image.opacity(waterMark.transparency * 0.01)
                .write(path, function (err) {
                if (err) {
                    return reject(err);
                }
                setTimeout(async () => {
                    fileManager_1.DiskFileManager.removeFile(paths.join('.'));
                });
                return resolve(path);
            });
        });
    }
    static async transparencyAndResize(waterMark, path, dimension) {
        if (waterMark.transparency == undefined) {
            return path;
        }
        var image = await jimp_1.default.read(path);
        var paths = path.split(".");
        paths = paths.slice(0, paths.length);
        path = paths.join('') + ".png";
        return new Promise((resolve, reject) => {
            image.opacity(waterMark.transparency * 0.01)
                .resize(dimension.x || 0, dimension.y || 0)
                .write(path, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve(path);
            });
        });
    }
    static async calculateWaterMarkDimentions(imgPath, waterMarkPath, isPercent, value) {
        if (isPercent) {
            return new Promise((resolve, reject) => {
                gmCli(imgPath)
                    .size(function (err, dimensions) {
                    if (err) {
                        return reject(err);
                    }
                    gmCli(waterMarkPath)
                        .size(function (err, wmDimensions) {
                        if (err) {
                            return reject(err);
                        }
                        var resWidth = Math.round(value * dimensions.width);
                        var resHight = Math.round((resWidth / wmDimensions.width) * wmDimensions.height);
                        return resolve({
                            x: resWidth,
                            y: resHight
                        });
                    });
                });
            });
        }
        else {
            return {
                x: 0,
                y: 0
            };
        }
    }
    static async calculateDimentions(imgPath, width, isPercent) {
        if (isPercent) {
            return new Promise((resolve, reject) => {
                gmCli(imgPath)
                    .size(function (err, dimensions) {
                    if (err) {
                        return reject(err);
                    }
                    if (err) {
                        return reject(err);
                    }
                    let value = width / dimensions.width;
                    var resWidth = Math.round(value * dimensions.width);
                    var resHight = Math.round(value * dimensions.height);
                    return resolve({
                        x: resWidth,
                        y: resHight
                    });
                });
            });
        }
        else {
            return {
                x: 0,
                y: 0
            };
        }
    }
    static async makeWaterMark(baseDir, p, waterMarkPath, config) {
        var respath = `${baseDir}${random_1.default.generateHash()}_waterMark_output${path_1.default.extname(p)}`;
        if (config.tile) {
            var image = await jimp_1.default.read(p);
            let wm_img = await (0, canvas_1.loadImage)(waterMarkPath);
            var res = gmCli(p);
            for (let i = 0; i < image.bitmap.width; i += config.tile + wm_img.width) {
                for (let j = 0; j < image.bitmap.height; j += config.tile + wm_img.height) {
                    res = res.draw(`image Over ${i},${j},${config.x},${config.y} "${waterMarkPath}"`);
                }
            }
            var pp = await new Promise((resolve, reject) => {
                res.write(respath, function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                        console.log(err);
                    }
                    resolve(respath);
                });
            });
        }
        else {
            let dimension = await this.getDimensions(p);
            config.position_x = config.position_x * dimension.width;
            config.position_y = config.position_y * dimension.height;
            var pp = await new Promise((resolve, reject) => {
                var res = gmCli(p)
                    .draw(`image Over ${config.position_x || 0},${config.position_y || 0},${config.x || 0},${config.y || 0} "${waterMarkPath}"`);
                res.write(respath, function (err, stdout, stderr, command) {
                    if (err) {
                        return reject(err);
                        console.log(err);
                    }
                    resolve(respath);
                });
            });
        }
        return pp;
    }
    static async tileWaterMark(p, waterMarkPath, x, y, image) {
    }
    static async effect(p, config) {
        try {
            if (config.filter) {
                await this.customFilter(p, config.filter);
            }
            else {
                if (p.includes(".webp"))
                    return;
                let image = (0, gm_1.default)(p);
                if (config.contrast) {
                    // gm از -100 تا +100 contrast می‌گیرد
                    // Sharp linear +1/-128 شبیه‌سازی می‌شه
                    const contrastValue = Math.round(config.contrast * 100);
                    image = image.contrast(contrastValue > 0 ? contrastValue : -contrastValue);
                }
                if (config.brightness) {
                    // gm brightness را با modulate شبیه‌سازی می‌کنیم
                    const brightness = Math.round((1 + config.brightness) * 100);
                    image = image.modulate(brightness, 100, 100);
                }
                if (config.grayscale === true) {
                    image = image.type("Grayscale");
                }
                if (config.sepia === true) {
                    // برای sepia در gm می‌توان از sepia-tone استفاده کرد
                    image = image.sepia();
                }
                await gmAsync(image).write(p);
            }
        }
        catch (error) {
            throw error;
        }
    }
    static async customFilter(p, filter) {
        var canvas = (0, canvas_1.createCanvas)(0, 0);
        var ctx = canvas.getContext("2d");
        var image = await (0, canvas_1.loadImage)(p);
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
        var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var operation = filterConfig[filter];
        var filteredPixels = operation()(pixels);
        ctx.putImageData(filteredPixels, 0, 0);
        await fileManager_1.DiskFileManager.wirteStream(p, canvas.createJPEGStream());
    }
    static async border(p, config) {
        try {
            let image = (0, gm_1.default)(p);
            const borderLeft = config.borderLeft || 0;
            const borderRight = config.borderRight || 0;
            const borderTop = config.borderTop || 0;
            const borderBottom = config.borderBotton || 0; // دقت کن که typo احتمالی: borderBotton => borderBottom
            const borderColor = config.borderColor || "white";
            // اضافه کردن حاشیه
            // gm دستور border دارد که تمام لبه‌ها را با یک اندازه می‌سازد، اما برای هر طرف می‌توان از extent استفاده کرد
            // ابتدا اندازه جدید تصویر را محاسبه می‌کنیم
            const size = await new Promise((resolve, reject) => {
                image.size((err, size) => {
                    if (err)
                        reject(err);
                    else
                        resolve(size);
                });
            });
            const newWidth = size.width + borderLeft + borderRight;
            const newHeight = size.height + borderTop + borderBottom;
            image = image
                .background(borderColor)
                .extent(newWidth, newHeight); // extent تصویر را با offset اضافه می‌کند
            // خروجی
            await gmAsync(image).write(p);
            return p;
        }
        catch (err) {
            throw err;
        }
    }
    static async compress(p, newName, percent) {
        return new Promise((resolve, reject) => {
            var res = gmCli(p);
            res = res.quality(percent);
            res.write(newName, async function (err, stdout, stderr, command) {
                if (err) {
                    return reject(err);
                }
                return resolve(p);
            });
        });
    }
}
exports.default = ImageProccessesor;
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "proccess"
            }
        };
    })
], ImageProccessesor, "proccess", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "proccessResult"
            }
        };
    })
], ImageProccessesor, "proccessResult", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "getWebP"
            }
        };
    })
], ImageProccessesor, "getWebP", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "getPNG"
            }
        };
    })
], ImageProccessesor, "getPNG", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "getJpeg"
            }
        };
    })
], ImageProccessesor, "getJpeg", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "resize"
            }
        };
    })
], ImageProccessesor, "resize", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "waterMark"
            }
        };
    })
], ImageProccessesor, "waterMark", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "makeWaterMarkText"
            }
        };
    })
], ImageProccessesor, "makeWaterMarkText", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "makeWaterMarkImage"
            }
        };
    })
], ImageProccessesor, "makeWaterMarkImage", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "makeConfig"
            }
        };
    })
], ImageProccessesor, "makeConfig", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "transparency"
            }
        };
    })
], ImageProccessesor, "transparency", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "transparencyAndResize"
            }
        };
    })
], ImageProccessesor, "transparencyAndResize", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "calculateWaterMarkDimentions"
            }
        };
    })
], ImageProccessesor, "calculateWaterMarkDimentions", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "makeWaterMark"
            }
        };
    })
], ImageProccessesor, "makeWaterMark", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "tileWaterMark"
            }
        };
    })
], ImageProccessesor, "tileWaterMark", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "effect"
            }
        };
    })
], ImageProccessesor, "effect", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "customFilter"
            }
        };
    })
], ImageProccessesor, "customFilter", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "border"
            }
        };
    })
], ImageProccessesor, "border", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "watermark",
            error: err.message,
            isCritical: false,
            otherInfo: {
                function: "compress"
            }
        };
    })
], ImageProccessesor, "compress", null);
async function makeSamples() {
    var res = gmCli("src/uploads/filters/original.jpg");
    res = res.resize(50000, 178);
    var paths = [];
    res.write("src/uploads/filters/original.jpg", async function (err, stdout, stderr, command) {
        for (const key in filterConfig) {
            fs_1.default.copyFileSync("src/uploads/filters/original.jpg", `src/uploads/filters/${key}.jpg`);
            await ImageProccessesor.customFilter(`src/uploads/filters/${key}.jpg`, key);
            paths.push(`2.187.100.179:5000/uploads/filters/${key}.jpg`);
        }
        fs_1.default.writeFileSync(`src/uploads/filters.json`, JSON.stringify(paths));
    });
}
// makeSamples()
