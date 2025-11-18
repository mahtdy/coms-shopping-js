"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtStrategy {
    constructor(key) {
        this.key = key;
    }
    sign(payload) {
        return jsonwebtoken_1.default.sign(payload, this.key, {
        // algorithm: jwtAlgorihtm
        });
    }
    decode(token = '') {
        return jsonwebtoken_1.default.verify(token, this.key);
    }
}
exports.default = JwtStrategy;
