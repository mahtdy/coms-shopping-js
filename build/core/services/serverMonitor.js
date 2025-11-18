"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import Ping from 'ping-url';
const ping_1 = __importDefault(require("ping"));
class ServerMonitor {
    static async checkServer(url) {
        try {
            var res = await ping_1.default.promise.probe(new URL(url).hostname);
            return {
                status: res.alive,
                time: res.time
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = ServerMonitor;
