"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expressApplication_1 = __importDefault(require("../expressApplication"));
const express_session_1 = __importDefault(require("express-session"));
class Session {
    constructor(config) {
        this.config = config;
    }
    async init() {
        var app = expressApplication_1.default.getInstance();
        app.app.use((0, express_session_1.default)(this.config));
    }
    serve(...args) {
        return [];
    }
}
exports.default = Session;
