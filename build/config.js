"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configs = {
    DB_URL: "mongodb://127.0.0.1:27017/mahdyar",
    // DB_USER: "bot-father",
    // DB_PASSWORD: "V,c2yT84phYA#AkN",
    sessionSecret: "ThisIsHowYouUseRedisSessionStorage",
    userSalt: "",
    jwtSecret: "secret",
    redisPassword: "mypasswordforaloteb",
    defaultLanguage: "fa",
    videoServer: "http://192.168.1.33:8000/",
    staticRoute: "src/uploads/",
    RABBITMQ_SERVER: "5.61.26.22",
    RABBITMQ_USER: "admin",
    RABBITMQ_PASSWORD: "admin",
    RABBITMQ_KEY: "",
    serverurl: "http://127.0.0.1:7000",
    seoConfig: {
        shoping: {
            functions: {
                "1": async function (url, category, language) {
                    return "/shoping/" + url;
                },
            },
            config_key: "shoping_url_format",
        },
    },
};
exports.default = configs;
