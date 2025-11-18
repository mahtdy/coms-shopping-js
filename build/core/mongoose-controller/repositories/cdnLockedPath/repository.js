"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class CDN_LockedPathRepository extends repository_1.default {
    constructor(options) {
        super(model_1.CDN_LockedPathModel, options);
    }
    async clearProccesses() {
        try {
            this.updateMany({}, {
                $set: {
                    paths: []
                }
            });
        }
        catch (error) {
        }
    }
    async addPath(cdn, path) {
        if (typeof cdn != "string")
            return;
        try {
            if (path == "") {
                return;
            }
            if (!path.includes(".") && !path.endsWith("/")) {
                path += "/";
            }
            let doc = await this.findOneAndUpdate({
                cdn
            }, {
                $addToSet: {
                    paths: path
                }
            });
            if (doc == null) {
                await this.insert({
                    cdn,
                    paths: [path]
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async addPaths(cdn, paths) {
        if (typeof cdn != "string")
            return;
        try {
            for (let i = 0; i < paths.length; i++) {
                if (!paths[i].includes(".") && !paths[i].endsWith("/")) {
                    paths[i] += "/";
                }
            }
            let doc = await this.findOneAndUpdate({
                cdn
            }, {
                $addToSet: {
                    paths
                }
            });
            if (doc == null) {
                await this.insert({
                    cdn,
                    paths
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async deletePath(cdn, path) {
        if (typeof cdn != "string")
            return;
        try {
            if (!path.includes(".") && !path.endsWith("/")) {
                path += "/";
            }
            return await this.updateOne({
                cdn
            }, {
                $pull: {
                    paths: path
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async deletePaths(cdn, paths) {
        if (typeof cdn != "string")
            return;
        try {
            for (let i = 0; i < paths.length; i++) {
                if (!paths[i].includes(".") && !paths[i].endsWith("/")) {
                    paths[i] += "/";
                }
            }
            return await this.updateOne({
                cdn
            }, {
                $pull: {
                    paths: {
                        $in: paths
                    }
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = CDN_LockedPathRepository;
