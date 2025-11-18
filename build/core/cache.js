"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CacheService {
    constructor(prefix) {
        this.prefix = prefix + "_";
    }
    async get(key, part) {
        return;
    }
    async set(key, data, part) {
        return;
    }
    async setWithTtl(key, data, ttl) {
        return;
    }
    async unset(key) {
        // return await cacheClient.DEL(this.prefix + key)
    }
}
exports.default = CacheService;
