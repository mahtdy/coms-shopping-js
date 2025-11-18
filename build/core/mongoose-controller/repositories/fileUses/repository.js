"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
class FileUsesRepository extends repository_1.default {
    constructor(options) {
        super(model_1.FileUsesModel, options);
    }
    async checkBlackListDirectories(fileAddress) {
        return true;
    }
    async makeChangeFileUses(id, files, source) {
        try {
            await this.deleteMany({
                file: {
                    $nin: files
                },
                useType: "inside",
                data: id
            });
            var newFiles = files.map((elem) => {
                return {
                    file: elem,
                    useType: "inside",
                    data: id,
                    source
                };
            });
            let res = await this.insertMany(newFiles);
            return res;
        }
        catch (error) {
            console.log("error");
        }
    }
    async canDelete(file, id) {
        try {
            let exists = await this.isExists({
                file,
                data: {
                    $ne: id
                }
            });
            if (exists) {
                return false;
            }
            return this.checkBlackListDirectories(file);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = FileUsesRepository;
