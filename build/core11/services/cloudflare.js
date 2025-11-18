"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudflare_1 = __importDefault(require("cloudflare"));
class CloadFlareHelper {
    constructor(apikey, email, id) {
        this.apikey = apikey;
        this.email = email;
        this.id = id;
        console.log({
            email: this.email,
            key: this.apikey
        });
        this.cf = new cloudflare_1.default({
            apiEmail: this.email,
            apiKey: this.apikey
        });
    }
    async addNameServer(ip, zoneid, name) {
        var _a;
        try {
            let res = await this.cf.dns.records.create({
                zone_id: zoneid,
                type: 'A',
                name,
                content: ip,
                ttl: 5000,
                proxied: true,
            });
            return {
                name,
                id: (_a = res['result']) === null || _a === void 0 ? void 0 : _a.id
            };
        }
        catch (error) {
            console.log(error.response.body);
            throw error;
        }
    }
    async deleteNameServers(zoneId, recordId) {
        console.log(zoneId, recordId);
        try {
            await this.cf.dns.records.delete(recordId, {
                zone_id: zoneId
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getNameServers(zone_id) {
        try {
            let nameServers = await this.cf.dns.records.list({
                zone_id
            });
            return nameServers;
        }
        catch (error) {
            throw error;
        }
    }
    async getZones() {
        try {
            let result = await this.cf.zones.list();
            let zones = result['result'];
            return zones.map((data) => {
                return {
                    domain: data['name'],
                    zoneid: data['id'],
                    name_servers: data['name_servers'],
                    status: data['status']
                };
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getActiveZones() {
        try {
            let zones = await this.getZones();
            zones = zones.filter((data) => {
                return data['status'] == 'active';
            });
            return zones;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = CloadFlareHelper;
// f2c9ad8966fefebb264bf74de8ce3311c347d
// 0128713eb7c7721193711cb6be9d537c
