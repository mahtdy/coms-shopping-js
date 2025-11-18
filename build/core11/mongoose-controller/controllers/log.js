"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../repository"));
const controller_1 = __importDefault(require("../controller"));
const model_1 = require("../repositories/log/model");
var log = new controller_1.default("/log", new repository_1.default(model_1.LogModel, {}));
log.exclude("/log", "post");
log.addRouteWithMeta("es/search", "get", log.search.bind(log), controller_1.default.searcheMeta);
exports.default = log;
