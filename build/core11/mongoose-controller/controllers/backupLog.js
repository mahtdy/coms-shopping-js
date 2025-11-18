"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/backupLog/repository"));
const cache_1 = __importDefault(require("../../cache"));
var backupLog = new controller_1.default("/backupLog", new repository_1.default({
    cacheService: new cache_1.default("backupLog")
}));
exports.default = backupLog;
