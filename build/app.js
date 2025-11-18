"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("./apps/admin/admin");
const expressApplication_1 = __importDefault(require("./core/expressApplication"));
const body_parser_1 = __importDefault(require("body-parser"));
const swagger_1 = __importDefault(require("./core/swagger/swagger"));
const mongoose_1 = __importDefault(require("./core/mongoose/mongoose"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./core/services/config"));
const ioredis_1 = __importDefault(require("ioredis"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const user_1 = require("./apps/user/user");
const googleApi_1 = __importDefault(require("./core/googleApi/googleApi"));
const exporter_1 = __importDefault(require("./core/mongoose-controller/exporter"));
const cache_1 = __importDefault(require("./core/cache"));
const seoInterface_1 = __importDefault(require("./core/mongoose-controller/seoInterface"));
const messaging_1 = require("./core/plugins/messaging");
const express_1 = __importDefault(require("express"));
const content_1 = require("./core/part/content");
var ReactEngine = require("express-react-views");
var RedisStore = (0, connect_redis_1.default)(express_session_1.default);
//Configure redis client
const redisClient = ioredis_1.default.createClient();
var bodyLimit = "10mb";
var expressApp = expressApplication_1.default.getInstance();
expressApp.preServeExtra = async () => {
    expressApp.app.use(body_parser_1.default.json({ limit: bodyLimit }));
    expressApp.app.use(body_parser_1.default.urlencoded({ extended: true, limit: bodyLimit }));
    expressApp.app.use("/uploads", express_1.default.static("src/uploads", {
        fallthrough: false,
    }));
    expressApp.app.use((0, cors_1.default)({
        credentials: true,
        origin: [
            "http://localhost",
            "http://localhost:5000",
            "http://localhost:3000",
            "http://192.168.1.18:5000",
            "http://192.168.100.11:5000",
            "http://2.187.100.179",
            "http://2.187.100.179:8080",
            "http://2.187.100.179:5000",
            "http://192.168.1.29:4402",
            "http://192.168.1.29:55317",
            "http://192.168.1.30:3200",
            "http://192.168.1.30:5000",
            "http://2.187.100.179:7000",
            "http://lensiha.ir",
            "http://192.168.1.26:5000",
            "http://192.168.1.26:49787",
            "http://192.168.1.26:51666",
            "http://192.168.1.19:3000",
        ],
    }));
    expressApp.app.use((0, express_session_1.default)({
        store: new RedisStore({ client: redisClient }),
        secret: "secret$%^134",
        name: "_redisPractice",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            httpOnly: true,
            path: "/",
        },
    }));
};
var swagger = swagger_1.default.getInstance();
swagger.setConfig({
    info: {
        contact: {
            name: "Swagger",
            url: "https://swagger.io",
            email: "Info@SmartBear.com",
        },
        title: "majical",
        description: "best freamwork",
        version: "1",
    },
    servers: [
        {
            url: "",
        },
    ],
    openapi: "3.0.0",
    paths: [],
    components: {
        securitySchemes: {
            BasicAuth: {
                type: "apiKey",
                in: "header",
                name: "auth-token",
            },
        },
    },
});
expressApp.addPlugin(swagger);
expressApp.addPlugin(new mongoose_1.default({
    uri: config_1.default.getConfig("DB_URL"),
    autoIndex: true,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    authSource: "admin",
    auth: {
        username: config_1.default.getConfig("DB_USER"),
        password: config_1.default.getConfig("DB_PASSWORD"),
    },
}));
// var rabbitMQ = RabbitMQ.getInstance(
//     {
//         protocol: 'amqp',
//         hostname: ConfigService.getConfig("RABBITMQ_SERVER"),
//         port: 5672,
//         username: ConfigService.getConfig("RABBITMQ_USER"),
//         password: ConfigService.getConfig("RABBITMQ_PASSWORD"),
//         locale: 'fa_IR',
//         frameMax: 0,
//         heartbeat: 0,
//         vhost: "vhost",
//     }
// )
// expressApp.addPlugin(rabbitMQ)
// rabbitMQ.assertQueue("seoData")
// rabbitMQ.consume("seoData")
var googleApis = new googleApi_1.default();
expressApp.addPlugin(googleApis);
var exporter = new exporter_1.default(new cache_1.default(""));
expressApp.addPlugin(exporter);
var seoInterface = new seoInterface_1.default();
expressApp.addPlugin(seoInterface);
var smsMessaging = new messaging_1.SMSMessagingExternal();
expressApp.addPlugin(smsMessaging);
var emailMessaging = new messaging_1.EmailMessagingExternal();
expressApp.addPlugin(emailMessaging);
var notifMessaging = new messaging_1.NotifMessagingExternal();
expressApp.addPlugin(notifMessaging);
// expressApp.addPlugin(new Session({
//     secret: 'keyboard cat',
//     cookie: {
//         maxAge : 60000
//     }
// }))
// console.log("lll")
expressApp.addPart(admin_1.adminPart);
expressApp.addPart(new content_1.ContentPart(expressApp));
expressApp.app.set("views", __dirname + "/components");
expressApp.app.engine("jsx", ReactEngine.createEngine());
// expressApp.addPlugin(new ContentPart())
expressApp.addPart(user_1.userPart);
expressApp.bootstarp(7000);
// expressApp.addPlugin(new Content())
exports.default = expressApp;
