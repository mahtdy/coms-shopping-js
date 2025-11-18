"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("./mongoose-controller/repositories/language/repository"));
const part_1 = __importDefault(require("./part"));
const fs_1 = __importDefault(require("fs"));
class AdmimPart extends part_1.default {
    constructor(route, options) {
        super(route, options);
        this.langRepo = new repository_1.default();
        this.initLanguages();
        this.langMap = {};
    }
    getRoutes() {
        // console.log("part")
        return super.getRoutes();
    }
    async initLanguages() {
        let langs = await this.langRepo.findAll({});
        for (let i = 0; i < langs.length; i++) {
            let index = "";
            if (typeof langs[i]._id == "string")
                index = langs[i]._id;
            else {
                index = langs[i]._id.toHexString();
            }
            // console.log(langs[i].sign , langs[i]._id)
            if (langs[i].filePath) {
                // this.langMap[langs[i]._id.toHexString()] = JSON.parse(langs[i].filePath
                fs_1.default.readFile(langs[i].filePath, (err, data) => {
                    if (err) {
                        fs_1.default.readFile("src/uploads/languages/deafult.json", (err, data) => {
                            if (!err)
                                this.langMap[index] = JSON.parse(data.toString("utf-8"));
                        });
                    }
                    else
                        this.langMap[index] = JSON.parse(data.toString("utf-8"));
                });
            }
            else {
                fs_1.default.readFile("src/uploads/languages/deafult.json", (err, data) => {
                    if (!err)
                        this.langMap[index] = JSON.parse(data.toString("utf-8"));
                });
            }
        }
    }
    serve() {
        var _a;
        let routes = super.serve();
        for (let i = 0; i < routes.length; i++) {
            if (routes[i].postExec == undefined) {
                routes[i].postExec = [];
            }
            (_a = routes[i].postExec) === null || _a === void 0 ? void 0 : _a.push({
                func: this.languagePostExec.bind(this),
                meta: {
                    params: {
                        "1": {
                            source: "session"
                        }
                    }
                }
            });
        }
        return routes;
    }
    async languagePostExec(res, session) {
        var _a;
        if (!res.message)
            return res;
        if (session.language && this.langMap[session.language]) {
            res.message = ((_a = this.langMap[session.language]) === null || _a === void 0 ? void 0 : _a.msgs[res.message]) || res.message;
        }
        return res;
    }
}
exports.default = AdmimPart;
