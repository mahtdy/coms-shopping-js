"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../repository"));
class SimpleLogInRepository extends repository_1.default {
    constructor(collection) {
        super(collection);
    }
    async checkLogIn(user, password) {
        this.collection.findOne({
            user,
            password
        });
    }
}
exports.default = SimpleLogInRepository;
