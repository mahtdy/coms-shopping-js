import { adminPart } from "./apps/admin/admin";
import ExpressApplication from "./core/expressApplication";
import bodyParser from "body-parser";
import Swageer from "./core/swagger/swagger";
import Mongoose from "./core/mongoose/mongoose";
import session from "express-session";
import cors from "cors";
import ConfigService from "./core/services/config";

import redis from "ioredis";
import redisStore from "connect-redis";
import { userPart } from "./apps/user/user";
import RabbitMQ from "./core/rabbitmq/rabbitmq";
import GoogleApi from "./core/googleApi/googleApi";
import DataExporter from "./core/mongoose-controller/exporter";
import CacheService from "./core/cache";
import SeoInterface from "./core/mongoose-controller/seoInterface";
import {
  EmailMessagingExternal,
  NotifMessagingExternal,
  SMSMessagingExternal,
} from "./core/plugins/messaging";
import express from "express";
import { ContentPart } from "./core/part/content";
var ReactEngine = require("express-react-views");

var RedisStore = redisStore(session);
//Configure redis client
const redisClient = redis.createClient();

var bodyLimit = "10mb";

var expressApp = ExpressApplication.getInstance();

expressApp.preServeExtra = async () => {
  expressApp.app.use(bodyParser.json({ limit: bodyLimit }));
  expressApp.app.use(
    bodyParser.urlencoded({ extended: true, limit: bodyLimit })
  );

  expressApp.app.use(
    "/uploads",
    express.static("src/uploads", {
      fallthrough: false,
    })
  );

  expressApp.app.use(
    cors({
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
    })
  );
  expressApp.app.use(
    session({
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
    })
  );
};

var swagger = Swageer.getInstance();
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

expressApp.addPlugin(
  new Mongoose({
    uri: ConfigService.getConfig("DB_URL"),
    autoIndex: true,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    authSource: "admin",
    auth: {
      username: ConfigService.getConfig("DB_USER"),
      password: ConfigService.getConfig("DB_PASSWORD"),
    },
  })
);

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

var googleApis = new GoogleApi();
expressApp.addPlugin(googleApis);

var exporter = new DataExporter(new CacheService(""));
expressApp.addPlugin(exporter);

var seoInterface = new SeoInterface();
expressApp.addPlugin(seoInterface);

var smsMessaging = new SMSMessagingExternal();
expressApp.addPlugin(smsMessaging);

var emailMessaging = new EmailMessagingExternal();
expressApp.addPlugin(emailMessaging);

var notifMessaging = new NotifMessagingExternal();
expressApp.addPlugin(notifMessaging);

// expressApp.addPlugin(new Session({
//     secret: 'keyboard cat',
//     cookie: {
//         maxAge : 60000
//     }
// }))
// console.log("lll")

expressApp.addPart(adminPart);
expressApp.addPart(new ContentPart(expressApp));

expressApp.app.set("views", __dirname + "/components");
expressApp.app.engine("jsx", ReactEngine.createEngine());

// expressApp.addPlugin(new ContentPart())
expressApp.addPart(userPart);

expressApp.bootstarp(7000);
// expressApp.addPlugin(new Content())

export default expressApp;
