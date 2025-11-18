"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAPI = void 0;
const googleapis_1 = require("googleapis");
class GoogleAPI {
    constructor(credential, token) {
        this.credential = credential;
        this.token = token;
    }
    async getIndexedPages() {
        let indexing = googleapis_1.google.indexing("v3");
    }
}
exports.GoogleAPI = GoogleAPI;
