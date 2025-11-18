"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const socket_io_1 = require("socket.io");
// import app, { server } from "../app";
const socket_io_redis_1 = require("socket.io-redis");
// import { ObjectID } from "mongodb"
const mongoose_1 = require("mongoose");
const redis = __importStar(require("redis"));
const repository_1 = __importDefault(require("../mongoose-controller/repositories/chat/repository"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/chat/userSocket/repository"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/chat/chatQueue/repository"));
const repository_4 = __importDefault(require("../mongoose-controller/repositories/system/repository"));
const repository_5 = __importDefault(require("../mongoose-controller/repositories/chat/socketUserInfo/repository"));
const repository_6 = __importDefault(require("../mongoose-controller/repositories/chat/chatCheckList/repository"));
// import SystemErrorLogRepository from "../services/repository/systemErrorLog"
const repository_7 = __importDefault(require("../mongoose-controller/repositories/chat/chatArchive/repository"));
const repository_8 = __importDefault(require("../mongoose-controller/repositories/chat/messages/repository"));
const repository_9 = __importDefault(require("../mongoose-controller/repositories/chat/chatPreset/repository"));
// import SystemErrorLog from "../database/models/systemErrorLog"
// import CacheService from "../services/cache";
const random_1 = __importDefault(require("../random"));
const request_1 = __importDefault(require("request"));
// import getValidIp from "../lib/ip"
function getValidIp(ip) {
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7);
    }
    else {
        var ipv6 = ip.split(":");
        if (ipv6.length > 8) {
            let ipv6Address = "";
            for (let index = 0; index < 8; index++) {
                ipv6Address = ipv6Address + ipv6[index] + ":";
            }
            ip = ipv6Address.substr(0, ipv6Address.length - 2);
        }
    }
    return ip;
}
const smsMessager_1 = __importDefault(require("../messaging/smsMessager"));
const redis_cache_1 = __importDefault(require("../redis-cache"));
const plugin_1 = require("../plugin");
const emailMessager_1 = __importDefault(require("../messaging/emailMessager"));
// var systemErrorRepo = new SystemErrorLogRepository()
class Socket extends plugin_1.Plugin {
    constructor(adminRepo, server) {
        super();
        this.adminRepo = adminRepo;
        this.server = server;
    }
    async init() {
        const chatArchiveRepo = new repository_7.default();
        const chatQueueRepo = new repository_3.default();
        const systemConfigRepo = new repository_4.default();
        const chatCheckListRepo = new repository_6.default();
        const socketUserInfoRepo = new repository_5.default();
        const chatRepo = new repository_1.default();
        const chatMessageRepo = new repository_8.default();
        const userSocketRepo = new repository_2.default();
        const chatPresetRepo = new repository_9.default();
        // var cacheService = new CacheService("socket_data")
        const cacheService = new redis_cache_1.default("socket_data");
        var adminSockets = {};
        const io = new socket_io_1.Server(this.server, {
            // transports : ["websocket"]
            cors: {
                // origin: "http://192.168.1.27:7000"
                origin: ["http://192.168.1.19:3000", "http://192.168.1.27:7000"],
                // origin: "http://192.168.1.27:7000"
            },
        });
        //redis adapter for saving chats in cache
        var redisClient = redis.createClient({
            // auth_pass: redisPassword,
            socket_keepalive: true
        });
        io.adapter((0, socket_io_redis_1.createAdapter)({
            pubClient: redisClient,
            subClient: redisClient.duplicate()
        }));
        io.on("connection", (socket) => {
            console.log("connection1", socket.id); // x8WIv7-mJelg7on_ALbx
        });
        io.on("error", () => {
            console.log("err");
        });
        //seporate admin and user namespace
        var adminIo = io.of("/admin");
        var userIo = io.of("/user");
        // admin
        adminIo.use(async (socket, next) => {
            // console.log("connection", socket.handshake)
            // console.log(adminSockets[socket.id], socket.id)
            if (adminSockets[socket.id] != undefined) {
                next();
                return;
            }
            const token = socket.handshake.auth.token;
            try {
                var adminId = await cacheService.get(token);
                // console.log(adminId)
            }
            catch (error) {
                next(new Error("invalid"));
                return;
            }
            if (adminId != undefined) {
                adminSockets[socket.id] = adminId;
                try {
                    chatRepo.updateMany({
                        admin: adminId,
                        isClosed: false
                    }, {
                        $set: {
                            adminSocket: socket.id
                        }
                    });
                }
                catch (error) {
                }
                next();
            }
            else {
                next(new Error("invalid"));
            }
        });
        require("events").captureRejections = true;
        async function getChatInfo(adminId) {
            const all = await chatRepo.findAll({});
            const closed = await chatRepo.findAll({ isClosed: true });
            const own = await chatRepo.findAll({
                isClosed: false,
                admin: adminId
            });
            const queue = await chatRepo.findAll({
                isStart: false
            });
            return {
                all,
                closed,
                own,
                queue
            };
        }
        adminIo.on('connection', async (socket) => {
            let adminId = adminSockets[socket.id];
            try {
                let chats = await chatRepo.findAll({
                    admin: adminId,
                    isClosed: false
                }, {
                    projection: {
                        userSocket: 1
                    }
                });
                chatRepo.updateMany({
                    admin: adminId,
                    isClosed: false
                }, {
                    $addToSet: {
                        adminSockets: socket.id
                    }
                });
                // chat
                chats.forEach((chat) => {
                    var _a;
                    if (chat.userSocket != undefined)
                        (_a = userIo.sockets.get(chat.userSocket)) === null || _a === void 0 ? void 0 : _a.emit("adminOnline");
                });
            }
            catch (error) {
            }
            // get list of users 
            socket.on("getUsers", async (msg) => {
                try {
                    var list = await chatQueueRepo.paginate({}, 10, 1);
                    socket.emit("userList", list);
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                }
            });
            socket.on("deleteMessage", async (msg) => {
                var _a, _b;
                var chatId = msg.chatId;
                var messageId = msg.messageId;
                // var adminId = adminSockets[socket.id]
                try {
                    var chatQueue = await chatRepo.findOne({
                        _id: chatId
                    });
                    var newMessage = await chatMessageRepo.findOneAndDelete({
                        chat: chatId,
                        _id: messageId
                    });
                    if (newMessage == null) {
                        return;
                    }
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
                if (chatQueue != null) {
                    if (chatQueue.userSocket != undefined)
                        (_a = userIo.sockets.get(chatQueue.userSocket)) === null || _a === void 0 ? void 0 : _a.emit("messageDeleted", messageId);
                    if (chatQueue.adminSockets) {
                        for (let i = 0; i < chatQueue.adminSockets.length; i++) {
                            (_b = adminIo.sockets.get(chatQueue.adminSockets[i])) === null || _b === void 0 ? void 0 : _b.emit("messageDeleted", messageId);
                        }
                    }
                }
            });
            socket.on("block", async (msg) => {
                var _a, _b;
                try {
                    let chat = await chatRepo.findByIdAndUpdate(msg.chatId, {
                        $set: {
                            blocked: true
                        }
                    });
                    if (chat === null || chat === void 0 ? void 0 : chat.adminSockets) {
                        for (let i = 0; i < chat.adminSockets.length; i++) {
                            // const element = array[i];
                            // if(socket.id != chat.adminSockets[i]){
                            (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("blocked", msg.chatId);
                            // }
                        }
                    }
                    if (chat === null || chat === void 0 ? void 0 : chat.userSocket) {
                        (_b = userIo.sockets.get(chat.userSocket)) === null || _b === void 0 ? void 0 : _b.emit("blocked", msg.chatId);
                    }
                }
                catch (error) {
                }
            });
            socket.on("unblock", async (msg) => {
                var _a, _b;
                try {
                    let chat = await chatRepo.findByIdAndUpdate(msg.chatId, {
                        $set: {
                            blocked: false
                        }
                    });
                    if (chat === null || chat === void 0 ? void 0 : chat.adminSockets) {
                        for (let i = 0; i < chat.adminSockets.length; i++) {
                            // const element = array[i];
                            // if(socket.id != chat.adminSockets[i]){
                            (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("unblocked", msg.chatId);
                            // }
                        }
                    }
                    if (chat === null || chat === void 0 ? void 0 : chat.userSocket) {
                        (_b = userIo.sockets.get(chat.userSocket)) === null || _b === void 0 ? void 0 : _b.emit("unblocked", msg.chatId);
                    }
                }
                catch (error) {
                }
            });
            socket.on("getChats", async (msg) => {
                try {
                    adminSockets[socket.id] = adminId;
                    // console.log("getUsers", msg)
                    // var list = await chatRepo.paginate({}, 10, 1)
                    socket.emit("chats", await getChatInfo(adminId));
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                }
            });
            socket.on('disconnect', async function () {
                // console.log(adminSockets)
                delete adminSockets[socket.id];
                try {
                    var chats = await chatRepo.findAll({
                        adminSockets: socket.id,
                        isClosed: false
                    }, {
                        projection: {
                            userSocket: 1
                        }
                    });
                    await chatRepo.updateMany({
                        admin: adminId,
                        isClosed: false
                    }, {
                        $pull: {
                            adminSockets: socket.id
                        }
                    });
                    chats.forEach((chat) => {
                        var _a;
                        if (chat.userSocket != undefined)
                            (_a = userIo.sockets.get(chat.userSocket)) === null || _a === void 0 ? void 0 : _a.emit("adminOfline");
                        // userIo.sockets.get("")?.emit("adminOfline")
                    });
                }
                catch (error) {
                }
            });
            socket.on('confirmSocket', async (msg) => {
                var _a, _b;
                console.log("msg", msg);
                try {
                    var chatQueue = await chatRepo.findById(msg.id);
                    if (chatQueue == null) {
                        logSystemError("error", socket, {
                            msg: "invalid chat id"
                        });
                        return;
                    }
                    let sockets = [];
                    for (const key in adminSockets) {
                        if (adminSockets[key] == adminSockets[socket.id]) {
                            sockets.push(key);
                        }
                    }
                    var chat = await chatRepo.updateOne({
                        _id: chatQueue._id
                    }, {
                        $set: {
                            isStart: true,
                            adminSockets: sockets,
                            admin: adminId
                        }
                    });
                    for (let i = 0; i < ((_a = chat.messages) === null || _a === void 0 ? void 0 : _a.length); i++) {
                        await chatMessageRepo.insert({
                            chat: chat._id,
                            type: "text",
                            text: chat.messages[i]['text'],
                            fromUser: chat.info.userInfo['phoneNumber'],
                            date: chat.messages[i]['date']
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                    return;
                }
                console.log("chatStarted", chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.userSocket);
                (_b = userIo.sockets.get((chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.userSocket) || "")) === null || _b === void 0 ? void 0 : _b.emit("chatStarted", chat._id);
            });
            socket.on('newMessage', async (msg) => {
                var _a, _b;
                var chatId = msg.chatId;
                var txt = msg.text;
                const clientId = msg.clientId;
                const replyId = msg.replyId;
                var adminId = adminSockets[socket.id];
                try {
                    var chatQueue = await chatRepo.findOne({
                        _id: chatId
                    });
                    var newMessage = await chatMessageRepo.insert({
                        clientId,
                        chat: chatId,
                        text: txt,
                        type: msg.type || "text",
                        file: msg.file,
                        from: adminId,
                        size: msg.size,
                        replyId
                    });
                    newMessage = await chatMessageRepo.findOne({ _id: newMessage._id }, {
                        population: [{
                                path: "replyId"
                            }]
                    });
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
                if (chatQueue != null) {
                    if (chatQueue.userSocket != undefined)
                        (_a = userIo.sockets.get(chatQueue.userSocket)) === null || _a === void 0 ? void 0 : _a.emit("newMessage", newMessage);
                    if (chatQueue.adminSockets) {
                        for (let i = 0; i < chatQueue.adminSockets.length; i++) {
                            (_b = adminIo.sockets.get(chatQueue.adminSockets[i])) === null || _b === void 0 ? void 0 : _b.emit("newMessage", newMessage);
                        }
                    }
                }
            });
            socket.on("messagesDelivered", async (msg) => {
                var _a;
                var adminId = adminSockets[socket.id];
                try {
                    var chatQueue = await chatRepo.findOne({
                        admin: adminId,
                        _id: msg.chatId
                    });
                    chatMessageRepo.updateMany({
                        chat: {
                            $eq: msg.chatId
                        },
                        _id: {
                            "$in": msg.msgs
                        }
                    }, {
                        $set: {
                            isDelivered: true
                        }
                    });
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
                if (chatQueue == null) {
                    return;
                }
                if (chatQueue.userSocket != undefined)
                    (_a = userIo.sockets.get(chatQueue.userSocket)) === null || _a === void 0 ? void 0 : _a.emit("deliveredMessages", msg.msgs);
            });
            socket.on("endChat", async (msg) => {
                var adminId = adminSockets[socket.id];
                try {
                    var chat = await chatRepo.findOneAndUpdate({
                        _id: msg.chatId,
                        admin: adminId
                    }, {
                        $set: {
                            isClosed: true
                        }
                    });
                    if (chat == null) {
                        logSystemError("یافت نشد", socket, {
                            msg: "یافت نشد"
                        });
                        return;
                    }
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
            });
            socket.on("getPreset", async (msg) => {
                try {
                    let txt = msg.txt;
                    if (txt)
                        var q = {
                            text: {
                                $regex: txt
                            }
                        };
                    else {
                        var q = {};
                    }
                    let presets = await chatPresetRepo.findAll(q);
                    socket.emit("presets", presets);
                }
                catch (error) {
                }
            });
            socket.on("addPreset", async (msg) => {
                try {
                    let txt = msg.txt;
                    // if (txt)
                    //     var q :any = {
                    //         text: {
                    //             $regex: txt
                    //         }
                    //     }
                    // else {
                    //     var q:any = {}
                    // }
                    let presets = await chatPresetRepo.insert({
                        text: txt,
                        category: msg.category || " "
                    });
                    // socket.emit("presets", presets)
                }
                catch (error) {
                    console.log(error);
                }
            });
            socket.on("getChat", async (msg) => {
                try {
                    let chat = await chatRepo.findById(msg.chatId);
                    socket.emit("chatInfo", chat);
                }
                catch (error) {
                    throw error;
                }
            });
            socket.on("assign", async (msg) => {
                var _a, _b;
                var chatId = msg.chatId;
                var targetAdmin = msg.admin;
                var currentAdmin = adminSockets[socket.id];
                var targetAdminSockets = [];
                for (const key in adminSockets) {
                    if (adminSockets[key] == targetAdmin) {
                        targetAdminSockets.push(key);
                    }
                }
                try {
                    var chat = await chatRepo.findOneAndUpdate({
                        _id: chatId,
                        admin: adminId
                    }, {
                        $set: {
                            admin: targetAdmin,
                            adminSockets: targetAdminSockets
                        },
                        $addToSet: {
                            admins: adminId
                        }
                    });
                    let admin = await this.adminRepo.findById(adminId);
                    let targetAdminObj = await this.adminRepo.findById(targetAdmin);
                    chatMessageRepo.insert({
                        chat: chatId,
                        type: "assign",
                        from: adminId,
                        text: `چت به ${(targetAdminObj === null || targetAdminObj === void 0 ? void 0 : targetAdminObj.name) + " " + (targetAdminObj === null || targetAdminObj === void 0 ? void 0 : targetAdminObj.familyName)} ارجا شد`
                    });
                    if (chat != null) {
                        for (let i = 0; i < targetAdminSockets.length; i++) {
                            (_a = adminIo.sockets.get(targetAdminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("assginedNewChat", chatId);
                        }
                        if (chat.adminSockets) {
                            var chatInfo = await getChatInfo(adminId);
                            for (let i = 0; i < chat.adminSockets.length; i++) {
                                // const element = array[i];
                                // socket.emit("chats", await getChatInfo())
                                (_b = adminIo.sockets.get(chat.adminSockets[i])) === null || _b === void 0 ? void 0 : _b.emit("chats", chatInfo);
                            }
                        }
                    }
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
            });
            socket.on("getOnlineAdmins", async (msg) => {
                socket.emit("onlineAdmins", adminSockets);
            });
            socket.on("adminsChat", (msg) => {
                var _a;
                (_a = adminIo.sockets.get(msg.to)) === null || _a === void 0 ? void 0 : _a.emit("adminNewMsg", {
                    from: adminSockets[socket.id],
                    text: msg.text
                });
            });
            socket.on("getAdminInfo", async (msg) => {
                try {
                    var admin = await this.adminRepo.getProfile(msg.chatId);
                    socket.emit("adminInfo", admin);
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
            });
            socket.on("getMessages", async (msg) => {
                try {
                    let chatId = msg.chatId;
                    let page = msg.page || 1;
                    let limit = msg.limit || 100;
                    let chats = await chatMessageRepo.paginate({
                        chat: {
                            $eq: chatId
                        }
                    }, limit, page, {
                        sort: {
                            _id: -1
                        }
                    });
                    socket.emit("chatMessages", chats);
                }
                catch (error) {
                    console.log(error);
                }
            });
            socket.on("addNote", async (msg) => {
                var _a;
                console.log("addNote", msg);
                try {
                    var chatQueue = await chatRepo.findOneAndUpdate({
                        _id: msg.chatId
                    }, {
                        $push: {
                            notes: {
                                admin: adminId,
                                note: msg.note
                            }
                        }
                    });
                    let chat = await chatRepo.findOne({
                        _id: msg.chatId
                    });
                    if (chat === null || chat === void 0 ? void 0 : chat.adminSockets) {
                        for (let i = 0; i < chat.adminSockets.length; i++) {
                            (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("notes", {
                                notes: chat.notes,
                                chatId: msg.chatId
                            });
                        }
                    }
                    if ((chat === null || chat === void 0 ? void 0 : chat.isStart) != true) {
                        socket.emit("notes", {
                            notes: chat === null || chat === void 0 ? void 0 : chat.notes,
                            chatId: msg.chatId
                        });
                    }
                }
                catch (error) {
                }
            });
            socket.on("deleteNote", async (msg) => {
                var _a;
                try {
                    console.log("deleteNote", msg);
                    var chatQueue = await chatRepo.findOneAndUpdate({
                        _id: msg.chatId
                    }, {
                        $pull: {
                            notes: {
                                _id: msg.noteId
                            }
                        }
                    });
                    let chat = await chatRepo.findOne({
                        _id: msg.chatId
                    });
                    if (chat === null || chat === void 0 ? void 0 : chat.adminSockets) {
                        for (let i = 0; i < chat.adminSockets.length; i++) {
                            // adminIo.sockets.get(chat.adminSockets[i])?.emit("notes", chat.notes)
                            (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("notes", {
                                notes: chat.notes,
                                chatId: msg.chatId
                            });
                        }
                    }
                    if ((chat === null || chat === void 0 ? void 0 : chat.isStart) != true) {
                        socket.emit("notes", {
                            notes: chat === null || chat === void 0 ? void 0 : chat.notes,
                            chatId: msg.chatId
                        });
                    }
                }
                catch (error) {
                }
            });
            socket.on("getNotes", async (msg) => {
                var _a;
                try {
                    let chat = await chatRepo.findOne({
                        _id: msg.chatId
                    });
                    if (chat === null || chat === void 0 ? void 0 : chat.adminSockets) {
                        for (let i = 0; i < chat.adminSockets.length; i++) {
                            // adminIo.sockets.get(chat.adminSockets[i])?.emit("notes", chat.notes)
                            (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("notes", {
                                notes: chat.notes,
                                chatId: msg.chatId
                            });
                        }
                    }
                    if ((chat === null || chat === void 0 ? void 0 : chat.isStart) != true) {
                        socket.emit("notes", {
                            notes: chat === null || chat === void 0 ? void 0 : chat.notes,
                            chatId: msg.chatId
                        });
                    }
                }
                catch (error) {
                }
            });
            socket.on("getAdmins", async (msg) => {
                try {
                    let query = {};
                    if (msg.q && msg.q != "") {
                        let qs = msg.q.split(" ");
                        if (qs.length > 1) {
                            query['$or'] = [
                                {
                                    name: {
                                        $regex: qs[0]
                                    }
                                },
                                {
                                    familyName: {
                                        $regex: qs[1]
                                    }
                                }
                            ];
                        }
                        else {
                            query['name'] = {
                                $regex: msg.q
                            };
                        }
                    }
                    let admins = await this.adminRepo.findAll(query, {
                        population: [{
                                path: "department"
                            }]
                    });
                    let res = [];
                    let onlins = [];
                    for (const key in adminSockets) {
                        if (!onlins.includes(adminSockets[key])) {
                            onlins.push(adminSockets[key]);
                        }
                    }
                    for (let i = 0; i < admins.length; i++) {
                        // adminSockets
                        let isOnline = onlins.includes(admins[i]._id.toString());
                        res.push({
                            department: admins[i].department,
                            name: admins[i].name,
                            family: admins[i].familyName,
                            id: admins[i]._id,
                            isOnline
                        });
                    }
                    socket.emit("admins", res);
                }
                catch (error) {
                }
            });
        });
        // user
        userIo.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (token != "abc") {
                // next(new Error("invalid"));
                next();
            }
            else {
                next();
            }
        });
        // function handleUser(func : Function)  {
        //      return (socket :Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> ) => {
        //      }
        // }
        userIo.on('connection', (socket) => {
            socket.on("restoreSocket", async (msg) => {
                var _a;
                console.log("restore chat", msg);
                const chatId = msg.chatId;
                const token = msg.token;
                try {
                    let chat = await chatRepo.findOne({
                        _id: chatId,
                        userToken: token
                    });
                    if (chat != null) {
                        await chatRepo.updateOne({
                            _id: chat._id
                        }, {
                            $set: {
                                "info.lastPage": msg.page,
                                "info.lastView": new Date(),
                                "info.os": msg.os,
                                "info.browser": msg.browser,
                                userSocket: socket.id,
                                userOnline: true,
                                userToken: token,
                                "info.ipInfo": await getGeoInfo(getValidIp(socket.handshake.address))
                            },
                            $inc: {
                                "info.views": 1
                            }
                        });
                        if (chat.adminSockets)
                            for (let i = 0; i < chat.adminSockets.length; i++) {
                                (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("userOnline", chat._id);
                            }
                        if (chat.isStart == false) {
                            if (Object.keys(adminSockets).length === 0) {
                                socket.emit("callLater", chat);
                            }
                            else {
                                socket.emit("addedToQueue", chat);
                            }
                            return;
                        }
                        socket.emit("chat", {
                            chat: await chatRepo.findById(chat._id),
                            token
                        });
                    }
                    else {
                        socket.emit("restartChat");
                    }
                }
                catch (error) {
                }
            });
            socket.on("checkFormInfo", async (msg) => {
                try {
                    var needVerify = await systemConfigRepo.getConf("need-verify-chat");
                    if (needVerify != null && needVerify.value == true) {
                        var verifyWay = await systemConfigRepo.getConf("verify-chat-way");
                        socket.emit("formInfo", {
                            need: true,
                            way: (verifyWay === null || verifyWay === void 0 ? void 0 : verifyWay.value) || "phone"
                        });
                    }
                    else {
                        socket.emit("formInfo", {
                            need: false
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                }
            });
            // if user already signed up in system
            // socket.on("startChatExistsUser", async (msg) => {
            //     try {
            //         var userInfo = await cacheService.get(socket.handshake.auth.token)
            //         if (userInfo == null) {
            //             socket.emit("error", "invalid user")
            //             return
            //         }
            //         userInfo = JSON.parse(userInfo)
            //     } catch (error) {
            //         logSystemError(error, socket)
            //         return
            //     }
            //     if (Object.keys(adminSockets).length === 0) {
            //         try {
            //             await chatCheckListRepo.insert({
            //                 messages: msg.messages,
            //                 info: {
            //                     page: msg.userPage,
            //                     userInfo: userInfo,
            //                     ipInfo: await getGeoInfo(getValidIp(socket.handshake.address))
            //                 }
            //             } as any)
            //             socket.emit("callLater")
            //         } catch (error) {
            //             logSystemError(error, socket)
            //             return
            //         }
            //     }
            //     else {
            //         try {
            //             var userQueue = await chatQueueRepo.insert({
            //                 socket: socket.id,
            //                 messages: msg.messages,
            //                 info: {
            //                     page: msg.userPage,
            //                     userInfo: userInfo,
            //                     ipInfo: await getGeoInfo(getValidIp(socket.handshake.address))
            //                 }
            //             } as unknown as ChatQueue)
            //             socket.emit("addedToQueue")
            //             adminIo.sockets.forEach((adminSocket) => {
            //                 adminSocket.emit("newUser", userQueue)
            //             })
            //         } catch (error) {
            //             logSystemError(error, socket)
            //         }
            //     }
            // })
            socket.on("start chat", async (msg) => {
                var _a, _b;
                var isExists = await chatRepo.isExists({
                    userSocket: socket.id
                });
                console.log("start", isExists);
                if (isExists) {
                    return;
                }
                try {
                    var verifyWay = await systemConfigRepo.getConf("verify-chat-way");
                    msg.random = random_1.default.randomNumber();
                    console.log("random", msg.random, verifyWay);
                    if ((verifyWay === null || verifyWay === void 0 ? void 0 : verifyWay.value) == "phone") {
                        var res = await smsMessager_1.default.send({
                            receptor: (_a = msg.userInfo) === null || _a === void 0 ? void 0 : _a.phoneNumber,
                            template: "chatVerify",
                            parameters: {
                                random: msg.random
                            }
                        });
                        //send sms or email
                        socket.emit("random", res != false);
                    }
                    else {
                        var res = await emailMessager_1.default.send({
                            receptor: (_b = msg.userInfo) === null || _b === void 0 ? void 0 : _b.email,
                            template: "chatVerify",
                            parameters: {
                                random: msg.random
                            }
                        });
                        socket.emit("random", res != false);
                    }
                    if (res != false)
                        await cacheService.setWithTtl(socket.id, msg, 60 * 2);
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                    return;
                }
            });
            socket.on("getAdmins", async (msg) => {
                try {
                    let isAdminOnline = false;
                    let adminIDs = [];
                    let admins = [];
                    for (const key in adminSockets) {
                        if (!adminIDs.includes(adminSockets[key])) {
                            var admin = await this.adminRepo.getProfile(adminSockets[key]);
                            adminIDs.push(adminSockets[key]);
                            admins.push(admin);
                        }
                    }
                    socket.emit("admins", admins);
                    // admin['isAdminOnline'] = isAdminOnline
                }
                catch (error) {
                }
            });
            socket.on("confirm random", async (msg) => {
                var _a;
                try {
                    var data = JSON.parse(await cacheService.get(socket.id));
                    if (data['userInfo']) {
                        data['userInfo']['name'] = msg.name;
                        data['userInfo']['family'] = msg.family;
                    }
                    // return
                    if (data != null) {
                        if (data.random == msg.random) {
                            var chat = await chatRepo.findOne({
                                $or: [
                                    {
                                        "info.userInfo.phoneNumber": data.userInfo.phoneNumber
                                    },
                                    {
                                        "info.userInfo.email": data.userInfo.email
                                    },
                                ]
                            });
                            console.log(msg, chat);
                            let token = random_1.default.generateHashStr(32);
                            if (chat != null) {
                                await chatRepo.updateOne({
                                    _id: chat._id
                                }, {
                                    $set: {
                                        "info.lastPage": msg.page,
                                        "info.lastView": new Date(),
                                        "info.os": msg.os,
                                        "info.browser": msg.browser,
                                        userSocket: socket.id,
                                        userOnline: true,
                                        // userToken: token,
                                        "info.ipInfo": await getGeoInfo(getValidIp(socket.handshake.address))
                                    },
                                    $inc: {
                                        "info.views": 1
                                    }
                                });
                                if (chat.adminSockets)
                                    for (let i = 0; i < chat.adminSockets.length; i++) {
                                        (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("userOnline", chat._id);
                                    }
                                if (chat.isStart == false) {
                                    if (Object.keys(adminSockets).length === 0) {
                                        socket.emit("callLater", chat);
                                    }
                                    else {
                                        socket.emit("addedToQueue", chat);
                                    }
                                    return;
                                }
                                socket.emit("chat", {
                                    chat: await chatRepo.findById(chat._id),
                                    token: chat.userToken
                                });
                                return;
                            }
                            chat = await chatRepo.insert({
                                userSocket: socket.id,
                                messages: msg.messages,
                                info: {
                                    page: data.userPage,
                                    userInfo: data.userInfo,
                                    ipInfo: await getGeoInfo(getValidIp(socket.handshake.address)),
                                    os: msg.os,
                                    browser: msg.browser,
                                    firstView: new Date()
                                },
                                userToken: token
                            });
                            if (Object.keys(adminSockets).length === 0) {
                                socket.emit("callLater", chat);
                            }
                            else {
                                socket.emit("addedToQueue", chat);
                                adminIo.sockets.forEach(async (adminSocket) => {
                                    adminSocket.emit("newUser", chat);
                                    adminSocket.emit("chats", await getChatInfo(adminSockets[adminSocket.id]));
                                });
                            }
                        }
                        else {
                            socket.emit("wrongRandom", {});
                        }
                    }
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                }
            });
            socket.on("addMessagesQueue", async (msg) => {
                try {
                    var data = await chatRepo.findOneAndUpdate({
                        // socket: socket.id
                        _id: msg._id,
                        token: msg.token
                    }, {
                        $push: { messages: msg }
                    });
                    console.log(data);
                }
                catch (error) {
                    logSystemError(error, socket);
                }
            });
            socket.on('newMessage', async (msg) => {
                var _a, _b, _c;
                console.log(msg);
                const chatId = msg.chatId;
                const txt = msg.text;
                const replyId = msg.replyId;
                const clientId = msg.clientId;
                var date = new Date(Date.now());
                var messageId = new mongoose_1.Types.ObjectId();
                try {
                    var chatQueue = await chatRepo.findOne({
                        _id: chatId,
                        userToken: msg.token,
                        isStart: true
                        // userSocket: socket.id,
                        // isClosed: false
                    });
                    if (chatQueue == null)
                        return;
                    var newMessage = await chatMessageRepo.insert({
                        clientId,
                        chat: chatId,
                        text: txt,
                        type: msg.type || "text",
                        file: msg.file,
                        size: msg.size,
                        fromUser: (_b = (_a = chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.info) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.phoneNumber,
                        replyId
                    });
                    newMessage = await chatMessageRepo.findOne({ _id: newMessage._id }, {
                        population: [{
                                path: "replyId"
                            }]
                    });
                }
                catch (error) {
                    console.log(error);
                    logSystemError(error, socket);
                    return;
                }
                if (chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.adminSockets) {
                    for (let i = 0; i < (chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.adminSockets.length); i++) {
                        // adminIo.sockets.get(chatQueue.adminSockets[i])?.emit("userOfline")
                        (_c = adminIo.sockets.get(chatQueue.adminSockets[i])) === null || _c === void 0 ? void 0 : _c.emit("newMessage", newMessage);
                    }
                }
                socket.emit("newMessage", newMessage);
            });
            // const element = chs[i];
            socket.on("messagesDelivered", async (msg) => {
                var _a;
                try {
                    var chatQueue = await chatRepo.findOne({
                        _id: msg.chatId
                    });
                    await chatMessageRepo.updateMany({
                        chat: msg.chatId,
                        _id: {
                            $in: msg.msgs
                        }
                    }, {
                        $set: {
                            isDelivered: true
                        }
                    });
                }
                catch (error) {
                    console.log(error);
                    return;
                }
                if (chatQueue == null) {
                    return;
                }
                if (chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.adminSockets)
                    for (let i = 0; i < (chatQueue === null || chatQueue === void 0 ? void 0 : chatQueue.adminSockets.length); i++) {
                        (_a = adminIo.sockets.get(chatQueue.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("deliveredMessages", msg.msgs);
                    }
            });
            socket.on("getMessages", async (msg) => {
                try {
                    // console.log("socket id", socket.id)
                    // await sleep(1500)
                    var chat = await chatRepo.findOne({
                        userSocket: socket.id
                    });
                    let page = msg.page || 1;
                    let limit = msg.limit || 100;
                    let chats = await chatMessageRepo.paginate({
                        chat: {
                            $eq: chat === null || chat === void 0 ? void 0 : chat._id
                        }
                    }, limit, page, {
                        sort: {
                            _id: -1
                        }
                    });
                    socket.emit("chatMessages", chats);
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
            });
            socket.on('disconnect', async function () {
                var _a;
                try {
                    var chat = await chatRepo.findOne({
                        userSocket: socket.id,
                        isClosed: false
                    }, {
                    // projection: {
                    //     userSocket: 1
                    // }
                    });
                    await chatRepo.updateOne({
                        userSocket: socket.id
                    }, {
                        $set: {
                            userOnline: false,
                            userLastSeen: new Date()
                        },
                        $unset: {
                            userSocket: 1
                        }
                    });
                    if (chat != null)
                        if (chat.adminSockets != undefined)
                            for (let i = 0; i < (chat === null || chat === void 0 ? void 0 : chat.adminSockets.length); i++) {
                                (_a = adminIo.sockets.get(chat.adminSockets[i])) === null || _a === void 0 ? void 0 : _a.emit("userOfline", chat._id);
                            }
                }
                catch (error) {
                }
            });
            socket.on("getAdminInfo", async (msg) => {
                try {
                    var chat = await chatRepo.findOne({
                        _id: msg.chatId,
                        isClosed: false,
                        userSocket: socket.id
                    });
                    if (chat != null) {
                        var admin = await this.adminRepo.getProfile(chat === null || chat === void 0 ? void 0 : chat.admin);
                        let isAdminOnline = false;
                        for (const key in adminSockets) {
                            if ((admin === null || admin === void 0 ? void 0 : admin._id) == adminSockets[key]) {
                                isAdminOnline = true;
                                break;
                            }
                        }
                        admin['isAdminOnline'] = isAdminOnline;
                        socket.emit("adminInfo", admin);
                    }
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
            });
            socket.on("pageChanged", async (msg) => {
                try {
                    var result = await chatRepo.updateOne({
                        userSocket: socket.id,
                        isClosed: false
                    }, {
                        $set: {
                            "info.page": msg.page
                        }
                    });
                    socket.emit("changePage", result);
                }
                catch (error) {
                    logSystemError(error, socket);
                    return;
                }
            });
        });
    }
    serve(...args) {
        return [];
    }
}
exports.Socket = Socket;
async function logSystemError(error, socket, msg) {
    var log = {
        part: "socket",
        error: error.message,
        isCritical: false,
        otherInfo: {
            service: "socket",
            error: error
        }
    };
    try {
        // await systemErrorRepo.insert(log)
    }
    catch (err) {
        throw err;
    }
}
// app.use("/socket", (req, res, next) => {
//     fs.createReadStream("src/uploads/socket.html").pipe(res)
// })
async function getGeoInfo(ip) {
    return new Promise((resolve, reject) => {
        request_1.default.get(encodeURI(`http://ip-api.com/json/${ip}`), {
            headers: {}
        }, function (err, response) {
            if (err) {
                return reject(err);
            }
            else {
                resolve(JSON.parse(response.body));
            }
        });
    });
}
async function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(0);
        }, ms);
    });
}
