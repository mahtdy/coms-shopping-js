"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = __importDefault(require("../../cache"));
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/cdnLog/repository"));
var cdnLog = new controller_1.default("/cdnLog", new repository_1.default({
    cacheService: new cache_1.default("cdnLog")
}));
cdnLog.exclude("/cdnLog", "post");
cdnLog.addRouteWithMeta("es/search", "get", cdnLog.search.bind(cdnLog), controller_1.default.searcheMeta);
exports.default = cdnLog;
