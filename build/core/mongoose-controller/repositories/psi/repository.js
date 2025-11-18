"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
const queue_1 = __importDefault(require("../../../services/queue"));
const contentRegistry_1 = __importDefault(require("../../contentRegistry"));
const repository_2 = __importDefault(require("./psiLog/repository"));
const random_1 = __importDefault(require("../../../random"));
const repository_3 = __importDefault(require("../system/repository"));
const axios_1 = __importDefault(require("axios"));
const repository_4 = __importDefault(require("../domain/repository"));
const repository_5 = __importDefault(require("./pagePSI/repository"));
class PSI_Repository extends repository_1.default {
    constructor(options) {
        super(model_1.PSI_Model, options);
        this.psi_logRepo = new repository_2.default();
        this.systemConfigRepo = new repository_3.default();
        this.domainRepo = new repository_4.default();
        this.pagePSIRepo = new repository_5.default();
        this.registry = contentRegistry_1.default.getInstance();
        this.initQueue();
    }
    async initQueue() {
        queue_1.default.define("addPSITasks", this.addPSIs.bind(this));
        queue_1.default.define("doPSI", this.doPSI.bind(this));
        // this.addPSIs()
    }
    async insert(document, options) {
        try {
            let d = await this.findOne({});
            var inserted;
            if (d != null) {
                await this.updateOne({
                    _id: d._id
                }, {
                    $set: document
                });
                inserted = await this.findById(d._id);
            }
            else {
                inserted = await this.insert(document);
            }
            await this.updatePSIJobs(inserted);
            return inserted;
        }
        catch (error) {
            throw error;
        }
    }
    async updatePSIJobs(psi) {
        try {
            await this.deletePSIJobs();
            if (!psi.enabled) {
                return;
            }
            let schedules = this.getJobDefinition(psi);
            for (let j = 0; j < schedules.length; j++) {
                queue_1.default.define(schedules[j].name, this.addPSIs.bind(this));
                let r = await queue_1.default.every(schedules[j].time, schedules[j].name, {
                    psiId: psi._id
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async deletePSIJobs() {
        await queue_1.default._collection.deleteMany({
            "data.psiId": {
                $exists: true
            }
        });
    }
    getJobDefinition(doc) {
        var _a, _b;
        let schedules = [];
        if (doc.periodType == "daily") {
            schedules.push({
                time: `0 0 * * *`,
                name: random_1.default.getUniqueId()
            });
        }
        else if (doc.periodType == "weekly") {
            let weekDays = (_a = doc.periodConfig) === null || _a === void 0 ? void 0 : _a.weekDays;
            if (weekDays) {
                for (let i = 0; i < weekDays.length; i++) {
                    schedules.push({
                        time: `${weekDays[i]} at 0:0`,
                        name: random_1.default.getUniqueId()
                    });
                }
            }
        }
        else {
            let monthly = (_b = doc.periodConfig) === null || _b === void 0 ? void 0 : _b.monthly;
            if (monthly) {
                for (let i = 0; i < monthly.length; i++) {
                    schedules.push({
                        time: `0 0 ${monthly[i].day} ${monthly[i].month} *`,
                        name: random_1.default.getUniqueId()
                    });
                }
            }
        }
        return schedules;
    }
    async doPSI(job) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25;
        console.log("doPSI", job.attrs.data);
        const module = this.registry.getRegistry(job.attrs.data["name"]);
        if (module == undefined)
            return;
        const content = await ((_a = module.repo) === null || _a === void 0 ? void 0 : _a.findById(job.attrs.data["id"]));
        if (content == null || content.url == undefined)
            return;
        var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
        var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
        let page = "";
        let defaultDomain = await this.domainRepo.findOne({
            isDefault: true
        });
        if (content.url.startsWith("/")) {
            page = `https://${defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain.domain}${content.url}`;
        }
        else {
            page = `https://${content.url}`;
        }
        console.log("page", page);
        // return
        try {
            let responseMobile = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/google/pagespeed",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    page,
                    device: "mobile"
                }
            });
            let responseDesktop = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/google/pagespeed",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    page,
                    device: "desktop"
                }
            });
            let psi_log = {
                module: job.attrs.data["name"],
                id: job.attrs.data["id"],
                date: new Date(),
                desktopInfo: {
                    score: (_d = (_c = (_b = responseDesktop.data["lighthouseResult"]) === null || _b === void 0 ? void 0 : _b["categories"]) === null || _c === void 0 ? void 0 : _c["performance"]) === null || _d === void 0 ? void 0 : _d["score"],
                    "first-contentful-paint": (_g = (_f = (_e = responseDesktop.data["lighthouseResult"]) === null || _e === void 0 ? void 0 : _e["audits"]) === null || _f === void 0 ? void 0 : _f["first-contentful-paint"]) === null || _g === void 0 ? void 0 : _g["score"],
                    "speed-index": (_k = (_j = (_h = responseDesktop.data["lighthouseResult"]) === null || _h === void 0 ? void 0 : _h["audits"]) === null || _j === void 0 ? void 0 : _j["speed-index"]) === null || _k === void 0 ? void 0 : _k["score"],
                    "total-blocking-time": (_o = (_m = (_l = responseDesktop.data["lighthouseResult"]) === null || _l === void 0 ? void 0 : _l["audits"]) === null || _m === void 0 ? void 0 : _m["total-blocking-time"]) === null || _o === void 0 ? void 0 : _o["score"],
                    "largest-contentful-paint": (_r = (_q = (_p = responseDesktop.data["lighthouseResult"]) === null || _p === void 0 ? void 0 : _p["audits"]) === null || _q === void 0 ? void 0 : _q["largest-contentful-paint"]) === null || _r === void 0 ? void 0 : _r["score"],
                    "cumulative-layout-shift": (_u = (_t = (_s = responseDesktop.data["lighthouseResult"]) === null || _s === void 0 ? void 0 : _s["audits"]) === null || _t === void 0 ? void 0 : _t["cumulative-layout-shift"]) === null || _u === void 0 ? void 0 : _u["score"],
                    "time-to-interactive": (_x = (_w = (_v = responseDesktop.data["lighthouseResult"]) === null || _v === void 0 ? void 0 : _v["audits"]) === null || _w === void 0 ? void 0 : _w["interactive"]) === null || _x === void 0 ? void 0 : _x["score"]
                },
                mobileInfo: {
                    score: (_0 = (_z = (_y = responseMobile.data["lighthouseResult"]) === null || _y === void 0 ? void 0 : _y["categories"]) === null || _z === void 0 ? void 0 : _z["performance"]) === null || _0 === void 0 ? void 0 : _0["score"],
                    "first-contentful-paint": (_3 = (_2 = (_1 = responseMobile.data["lighthouseResult"]) === null || _1 === void 0 ? void 0 : _1["audits"]) === null || _2 === void 0 ? void 0 : _2["first-contentful-paint"]) === null || _3 === void 0 ? void 0 : _3["score"],
                    "speed-index": (_6 = (_5 = (_4 = responseMobile.data["lighthouseResult"]) === null || _4 === void 0 ? void 0 : _4["audits"]) === null || _5 === void 0 ? void 0 : _5["speed-index"]) === null || _6 === void 0 ? void 0 : _6["score"],
                    "total-blocking-time": (_9 = (_8 = (_7 = responseMobile.data["lighthouseResult"]) === null || _7 === void 0 ? void 0 : _7["audits"]) === null || _8 === void 0 ? void 0 : _8["total-blocking-time"]) === null || _9 === void 0 ? void 0 : _9["score"],
                    "largest-contentful-paint": (_12 = (_11 = (_10 = responseMobile.data["lighthouseResult"]) === null || _10 === void 0 ? void 0 : _10["audits"]) === null || _11 === void 0 ? void 0 : _11["largest-contentful-paint"]) === null || _12 === void 0 ? void 0 : _12["score"],
                    "cumulative-layout-shift": (_15 = (_14 = (_13 = responseMobile.data["lighthouseResult"]) === null || _13 === void 0 ? void 0 : _13["audits"]) === null || _14 === void 0 ? void 0 : _14["cumulative-layout-shift"]) === null || _15 === void 0 ? void 0 : _15["score"],
                    "time-to-interactive": (_18 = (_17 = (_16 = responseMobile.data["lighthouseResult"]) === null || _16 === void 0 ? void 0 : _16["audits"]) === null || _17 === void 0 ? void 0 : _17["interactive"]) === null || _18 === void 0 ? void 0 : _18["score"]
                }
            };
            let pagePSI = {
                module: job.attrs.data["name"],
                id: job.attrs.data["id"],
                date: new Date(),
                desktopJson: responseDesktop.data,
                mobileJson: responseMobile.data
            };
            try {
                await this.psi_logRepo.insert(psi_log);
                let r = await this.pagePSIRepo.insert(pagePSI);
                await this.pagePSIRepo.findOneAndDelete({
                    id: {
                        $eq: job.attrs.data["id"],
                    },
                    _id: {
                        $ne: r._id
                    }
                });
                let psiMobile = (_21 = (_20 = (_19 = responseMobile.data["lighthouseResult"]) === null || _19 === void 0 ? void 0 : _19["categories"]) === null || _20 === void 0 ? void 0 : _20["performance"]) === null || _21 === void 0 ? void 0 : _21["score"];
                let psiDesktop = (_24 = (_23 = (_22 = responseDesktop.data["lighthouseResult"]) === null || _22 === void 0 ? void 0 : _22["categories"]) === null || _23 === void 0 ? void 0 : _23["performance"]) === null || _24 === void 0 ? void 0 : _24["score"];
                let psiAvreage;
                if (psiMobile && psiDesktop) {
                    psiAvreage = (psiMobile + psiDesktop) / 2;
                }
                await ((_25 = module.repo) === null || _25 === void 0 ? void 0 : _25.collection.findByIdAndUpdate(job.attrs.data["id"], {
                    $set: {
                        pagePsi: r._id,
                        psiMobile,
                        psiDesktop,
                        psiAvreage
                    }
                }));
            }
            catch (error) {
                console.log(error);
            }
        }
        catch (error) {
            console.log(error);
            return;
        }
    }
    async addPSIs(job) {
        var _a;
        let psiSetting = await this.findOne({
            enabled: true
        });
        if (psiSetting == null) {
            return;
        }
        let registriesName = this.registry.getAllRegistriesName();
        for (let i = 0; i < registriesName.length; i++) {
            const module = this.registry.getRegistry(registriesName[i]);
            let contents = await ((_a = module === null || module === void 0 ? void 0 : module.repo) === null || _a === void 0 ? void 0 : _a.findAll({
                isPublished: true,
                publishDate: {
                    $lt: new Date()
                }
            }));
            for (let j = 0; j < ((contents === null || contents === void 0 ? void 0 : contents.length) || 0); j++) {
                let hour = Math.floor(Math.random() * 23) + 1;
                let minute = Math.floor(Math.random() * 60);
                // 
                const now = new Date();
                const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
                let c = (contents === null || contents === void 0 ? void 0 : contents[j]) || undefined;
                if (targetTime > now) {
                    queue_1.default.schedule(targetTime, "doPSI", {
                        name: registriesName[i],
                        id: (c === null || c === void 0 ? void 0 : c._id) || ""
                    });
                }
            }
        }
    }
}
exports.default = PSI_Repository;
