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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translator = void 0;
const method_1 = require("../decorators/method");
const parameters_1 = require("../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const zod_1 = require("zod");
const translator_1 = __importDefault(require("../translator"));
const fileManager_1 = require("../services/fileManager");
const repository_1 = __importDefault(require("../mongoose-controller/repositories/dbSchema/repository"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/action/repository"));
const controller_2 = __importStar(require("../mongoose-controller/controller"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/translationLog/repository"));
class Translator extends controller_1.default {
    constructor(baseRoute, roleRepo) {
        super(baseRoute);
        this.roleRepo = roleRepo;
        this.dbSchemaRepo = new repository_1.default();
        this.actionRepo = new repository_2.default();
        this.translationLogRepo = new repository_3.default();
    }
    async translate(texts, source, destination) {
        try {
            if (typeof texts == "string") {
                texts = [texts];
            }
            let response = {};
            for (let i = 0; i < texts.length; i++) {
                console.log(i, texts[i]);
                response[texts[i]] = await (0, translator_1.default)(texts[i], source, destination);
                if (i % 5 == 0) {
                    await this.sleep();
                }
            }
            return {
                status: 200,
                data: response
            };
        }
        catch (error) {
            console.log("err", error);
            throw error;
        }
    }
    async asyncTranslate(texts, fileLocate, source, destination) {
        try {
            let data = await this.translationLogRepo.insert({
                source,
                destination,
                fileLocate,
                all: Object.keys(texts).length,
                translated: 0,
                translation: {}
            });
            this.doAsyncTranslate(data._id, texts, source, destination);
            return {
                data
            };
        }
        catch (error) {
            throw error;
        }
        return {};
    }
    async doAsyncTranslate(logId, data, source, destination) {
        try {
            let texts = [];
            let response = {};
            let result = {};
            // for (let i = 0; i < texts.length; i++) {
            let i = 1;
            for (const key in data) {
                result[key] = await (0, translator_1.default)(data[key], source, destination);
                if (i % 5 == 0) {
                    await this.sleep();
                }
                await this.translationLogRepo.findByIdAndUpdate(logId, {
                    $set: {
                        translation: result,
                        translated: i
                    }
                });
                i += 1;
            }
            await this.translationLogRepo.findByIdAndUpdate(logId, {
                $set: {
                    status: "success"
                }
            });
        }
        catch (error) {
            await this.translationLogRepo.findByIdAndUpdate(logId, {
                $set: {
                    status: "error"
                }
            });
        }
    }
    async getAsyncTranslate(id) {
        try {
            return {
                data: await this.translationLogRepo.findById(id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getRunningAsyncTranslate() {
        try {
            return {
                data: await this.translationLogRepo.findAll({
                // status : "pending"
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sleep() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({});
            }, 3000);
        });
    }
    async getTexts() {
        try {
            let paginations = {};
            for (let i = 0; i < controller_2.paginationConfigs.length; i++) {
                paginations[controller_2.paginationConfigs[i].tableLabel] = {};
                for (const key in controller_2.paginationConfigs[i].fields) {
                    paginations[controller_2.paginationConfigs[i].tableLabel][key] = controller_2.paginationConfigs[i].fields[key].fa_title;
                }
            }
            let actions = this.roleRepo.actions;
            let resActions = {};
            for (const key in actions) {
                resActions[key] = {};
                let moduleActions = actions[key];
                for (let i = 0; i < moduleActions.length; i++) {
                    resActions[key][moduleActions[i].name] = moduleActions[i].showTitle;
                }
            }
            let schemas = {};
            const dbSchemas = await this.dbSchemaRepo.findAll({});
            for (let i = 0; i < dbSchemas.length; i++) {
                // console.log(dbSchemas[i].collectionSchema)
                schemas[dbSchemas[i].collectionName] = this.getCollectionSchema(dbSchemas[i].collectionSchema.toJSON());
            }
            const dbactions = await this.actionRepo.findAll({});
            let actionsTexts = {};
            for (let i = 0; i < dbactions.length; i++) {
                actionsTexts[dbactions[i].url + "&" + dbactions[i].method] = dbactions[i].title;
            }
            return {
                data: {
                    msgs: this.controllersTextsArrayToJson((await this.getControllersTexts()).concat(...await this.getServicesTexts())),
                    moduleActions: resActions,
                    schemas,
                    actions: actionsTexts,
                    paginations
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    controllersTextsArrayToJson(texts) {
        var json = {};
        for (let i = 0; i < texts.length; i++) {
            json[texts[i]] = texts[i];
        }
        return json;
    }
    getCollectionSchema(collectionSchema, schema = {}, name = "") {
        for (const key in collectionSchema) {
            schema[name + key] = collectionSchema[key]["persianName"];
            if (collectionSchema[key].sub) {
                schema = this.getCollectionSchema(collectionSchema[key].sub, schema, name + key + ".");
            }
        }
        return schema;
    }
    async getControllersTexts() {
        let folders = [
            "build/core/mongoose-controller/",
            "build/core/mongoose-controller/controllers/",
            "build/core/mongoose-controller/auth/admin/",
            "build/core/mongoose-controller/basePage/",
            "build/apps/admin/controllers/"
        ];
        let results = [];
        let texts = [];
        // fs.red
        for (let i = 0; i < folders.length; i++) {
            // const element = folders[i];
            //    results.push( ... await this.findFolderFiles(folders[i]))
            let files = await this.findFolderFiles(folders[i]);
            for (let j = 0; j < files.length; j++) {
                let res = await this.findControllerTexts(files[j]);
                for (let z = 0; z < res.length; z++) {
                    if (!texts.includes(res[z]) && res[z] != "") {
                        texts.push(res[z]);
                    }
                }
            }
        }
        return texts;
    }
    async getServicesTexts() {
        let folders = [
            "build/core/mongoose-controller/repositories/",
            "build/repositories/",
            "build/core/services/",
            "build/core/messaging/"
        ];
        let results = [];
        let texts = [];
        // fs.red
        for (let i = 0; i < folders.length; i++) {
            // const element = folders[i];
            //    results.push( ... await this.findFolderFiles(folders[i]))
            let files = await this.findFolderFiles(folders[i]);
            for (let j = 0; j < files.length; j++) {
                let res = await this.findServiceTexts(files[j]);
                for (let z = 0; z < res.length; z++) {
                    // const element = array[z];
                    if (!texts.includes(res[z]) && res[z] != "") {
                        texts.push(res[z]);
                    }
                }
            }
        }
        return texts;
    }
    async findControllerTexts(file) {
        let texts = [];
        let fileContent = await fileManager_1.DiskFileManager.readFile(file);
        for (let i = 0; i < fileContent.length; i++) {
            if (fileContent[i].includes("message:")) {
                let lineData = fileContent[i].split("\"");
                if (lineData.length > 2) {
                    texts.push(lineData[1]);
                }
            }
        }
        return texts;
    }
    async findServiceTexts(file) {
        let texts = [];
        let fileContent = await fileManager_1.DiskFileManager.readFile(file);
        for (let i = 0; i < fileContent.length; i++) {
            if (fileContent[i].includes("new Error(")) {
                let lineData = fileContent[i].split("\"");
                if (lineData.length > 2) {
                    texts.push(lineData[1]);
                }
            }
        }
        return texts;
    }
    async findFolderFiles(folder) {
        let files = await fileManager_1.DiskFileManager.scanDir(folder);
        let res = [];
        for (let i = 0; i < files.length; i++) {
            if (files[i].type == "file") {
                // console.log(i, files[i], files[i].children?.length)
                res.push(folder + files[i].id);
            }
            if (files[i].type == "dir") {
                res.push(...await this.findFolderFiles(folder + files[i].id));
            }
        }
        return res;
    }
}
exports.Translator = Translator;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "texts",
        schema: zod_1.z.array(zod_1.z.string()).or(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "source",
        schema: zod_1.z.string().default("en")
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "destination",
        schema: zod_1.z.string().default("fa")
    }))
], Translator.prototype, "translate", null);
__decorate([
    (0, method_1.Post)("/async"),
    __param(0, (0, parameters_1.Body)({
        destination: "texts",
        schema: controller_2.default.search
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "fileLocate",
        schema: zod_1.z.enum(["panel", "server"]).default("panel")
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "source",
        schema: zod_1.z.string().default("en")
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "destination",
        schema: zod_1.z.string().default("fa")
    }))
], Translator.prototype, "asyncTranslate", null);
__decorate([
    (0, method_1.Get)("/async"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id
    }))
], Translator.prototype, "getAsyncTranslate", null);
__decorate([
    (0, method_1.Get)("/async/runnig")
], Translator.prototype, "getRunningAsyncTranslate", null);
__decorate([
    (0, method_1.Get)("/texts")
], Translator.prototype, "getTexts", null);
// const translator = new Translator("/translator")
// export default translator
