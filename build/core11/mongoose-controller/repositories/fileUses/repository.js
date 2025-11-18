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
            console.log(error);
        }
    }
}
exports.default = FileUsesRepository;
