"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionQueue = void 0;
const agenda_1 = __importDefault(require("agenda"));
const config_1 = __importDefault(require("./config"));
const smsMessager_1 = __importDefault(require("../messaging/smsMessager"));
const emailMessager_1 = __importDefault(require("../messaging/emailMessager"));
// import NotificationMessager from "../messaging/notification";
const internalMessager_1 = __importDefault(require("../messaging/internalMessager"));
const child_process_1 = require("child_process");
var schaduler = new agenda_1.default({
    db: {
        address: config_1.default.getConfig("DB_URL"),
        collection: "jobs",
        options: {
            authSource: "admin",
            auth: {
                username: config_1.default.getConfig("DB_USER"),
                password: config_1.default.getConfig("DB_PASSWORD")
            },
            connectTimeoutMS: 100000
        }
    }
});
const connectionQueue = async function () {
    schaduler.processEvery('1 second');
    // if (port() == 5000) {
    //     await schaduler.start();
    // }
};
exports.connectionQueue = connectionQueue;
schaduler.define("publishContent", async function (job) {
    // var articleRepo = new ArticleRepository()
    var _a, _b;
    await ((_a = job.attrs.data) === null || _a === void 0 ? void 0 : _a.publish(((_b = job.attrs.data) === null || _b === void 0 ? void 0 : _b.id) || ""));
});
schaduler.define("publishSubContent", async function (job) {
    var _a, _b, _c;
    await ((_a = job.attrs.data) === null || _a === void 0 ? void 0 : _a.publishSubContent(((_b = job.attrs.data) === null || _b === void 0 ? void 0 : _b.id) || "", ((_c = job.attrs.data) === null || _c === void 0 ? void 0 : _c.subId) || ""));
});
schaduler.define("sendSMS", function (job) {
    // console.log(job.attrs.data)
    smsMessager_1.default.send(job.attrs.data);
});
schaduler.define("sendSMSMulti", function (job) {
    // console.log(job.attrs.data)
    smsMessager_1.default.sendMulti(job.attrs.data);
});
schaduler.define("renew ssl", function (job) {
    // console.log(job.attrs.data)
    (0, child_process_1.exec)('certbot renew --nginx', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`sslllllllllllllllllll stdout: ${stdout}`);
    });
});
schaduler.define("generate sitemap", function (job) {
    // console.log(job.attrs.data)
    try {
        // const sitemap = SiteMap.getInstance()
        // sitemap.generateSiteMap()
    }
    catch (error) {
    }
});
schaduler.define("sendEmail", function (job) {
    // console.log(job.attrs.data)
    emailMessager_1.default.send(job.attrs.data);
});
schaduler.define("sendEmailMulti", function (job) {
    // console.log(job.attrs.data)
    emailMessager_1.default.sendMulti(job.attrs.data);
});
schaduler.define("sendNotif", function (job) {
    // console.log(job.attrs.data)
    // NotificationMessager.send(
    //     job.attrs.data as any
    // )
});
schaduler.define("sendNotifMulti", function (job) {
    // console.log(job.attrs.data)
    // NotificationMessager.send(
    //     job.attrs.data as any
    // )
});
schaduler.define("sendInternal", function (job) {
    // console.log(job.attrs.data)
    internalMessager_1.default.send(job.attrs.data);
});
schaduler.define("sendInternalMulti", function (job) {
    // console.log(job.attrs.data)
    internalMessager_1.default.sendMulti(job.attrs.data);
});
schaduler.start();
schaduler.on("ready", async function () {
    console.log("agenda start");
    await schaduler.every('0 0 * * *', 'renew ssl');
    await schaduler.every('0 0 * * *', 'generate sitemap');
});
exports.default = schaduler;
// import "./queue/checkGoogle"
