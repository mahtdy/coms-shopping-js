"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../services/config"));
const jwtStrategy_1 = __importDefault(require("./jwtStrategy"));
class UserAuthenticator extends jwtStrategy_1.default {
    constructor() {
        super(config_1.default.getConfig("jwtSecret"));
    }
    isAuthenticate(token) {
        try {
            return this.decode(token);
        }
        catch (error) {
            throw error;
        }
    }
    authenticate(payload) {
        try {
            return this.sign(payload);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = UserAuthenticator;
