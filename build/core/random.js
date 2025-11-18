"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
class RandomGenarator {
    constructor() { }
    static randomNumber() {
        // return 12345
        return Math.floor(Math.random() * 90000) + 10000;
    }
    static generateHash() {
        let random = Math.floor(Math.random() * 9000000000000) + 1000000000000;
        let random2 = Math.floor(Math.random() * 900) + 100;
        let hashed = (Date.now() + random * random2).toString(36);
        return hashed;
    }
    static generateHashStr(length) {
        var chars = 'abcdefghijklmnopqrstuvwxyz';
        var text = '';
        length = length || 6;
        for (var i = 0; i < length; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return text;
    }
    static async generateToken() {
        return new Promise((resolve, reject) => {
            (0, crypto_1.randomBytes)(48, function (err, buffer) {
                if (err) {
                    return reject(err);
                }
                var token = buffer.toString('hex');
                return resolve(token);
            });
        });
    }
    static getUniqueId() {
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        var first = ("000" + firstPart.toString(36)).slice(-3);
        var second = ("000" + secondPart.toString(36)).slice(-3);
        return first + second;
    }
}
exports.default = RandomGenarator;
