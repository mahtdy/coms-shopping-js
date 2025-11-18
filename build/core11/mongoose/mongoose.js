"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import {
//     bodyLimit, environment, port
//     , DB_Address, DB_User, DB_Password,
//     redisPassword, sessionSecret
// } from '../config'
const mongoose_1 = __importDefault(require("mongoose"));
class Mongoose {
    constructor(config) {
        this.config = config;
    }
    async init() {
        try {
            var conf = { ...this.config };
            delete conf.uri;
            mongoose_1.default.set('strictQuery', true);
            await mongoose_1.default.connect(this.config.uri, conf);
            return;
        }
        catch (error) {
            throw error;
        }
    }
    serve(...args) {
        return [];
    }
}
exports.default = Mongoose;
