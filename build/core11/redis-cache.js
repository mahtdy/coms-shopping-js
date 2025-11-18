"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const cache_1 = __importDefault(require("./cache"));
const redisClient = ioredis_1.default.createClient();
class RedisCache extends cache_1.default {
    async get(key, part) {
        var p = part || "";
        return new Promise((resolve, reject) => {
            redisClient.get(this.prefix + p + key, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }
    async set(key, data, part) {
        var p = part || "";
        if (typeof data != "string") {
            data = JSON.stringify(data);
        }
        return await redisClient.set(this.prefix + p + key, data);
    }
    async setWithTtl(key, data, ttl) {
        if (typeof data != "string") {
            data = JSON.stringify(data);
        }
        return await redisClient.set(this.prefix + key, data, 'EX', ttl);
    }
    async unset(key) {
        return await redisClient.del(this.prefix + key);
    }
}
exports.default = RedisCache;
