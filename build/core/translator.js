"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = translator;
const axios_1 = __importDefault(require("axios"));
async function translator(text, source = "fa", destination = "en") {
    try {
        // console.log(`https://translate.google.com/translate_a/t?client=dict-chrome-ex&sl=${source}&tl=${destination}&q=${text}`)
        let response = await axios_1.default.get(encodeURI(`https://translate.google.com/translate_a/t?client=dict-chrome-ex&sl=${source}&tl=${destination}&q=${text}`), {});
        return response.data[0];
    }
    catch (error) {
        throw error;
    }
}
