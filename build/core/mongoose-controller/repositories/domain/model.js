"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainModel = void 0;
const mongoose_1 = require("mongoose");
const domainSchema = new mongoose_1.Schema({
    domain: {
        type: String,
        required: true
    },
    sslType: {
        type: String,
        enum: [
            "none",
            "certificate",
            "interim"
        ],
        required: true
    },
    certificate: {
        type: new mongoose_1.Schema({
            public: {
                type: String,
                required: true
            },
            private: {
                type: String,
                required: true
            },
            "options-ssl": {
                type: String,
                required: false
            },
            "ssl-dhparams": {
                type: String,
                required: false
            }
        }, {
            _id: false
        }),
        required: false
    },
    isDefault: {
        type: Boolean,
        required: true,
        default: false
    },
    config: {
        type: Object,
        required: false
    },
    adminDomain: {
        type: Boolean,
        required: true,
        default: false
    },
    cdns: {
        type: [mongoose_1.Types.ObjectId],
        ref: "cdn",
        required: false
    },
    localCDN: {
        type: mongoose_1.Types.ObjectId,
        ref: "cdn",
        required: false
    },
    bucketName: {
        type: String,
        required: false
    },
    cptchaInfo: {
        type: new mongoose_1.Schema({
            site_key: {
                type: String
            },
            secret_key: {
                type: String
            }
        }, { _id: false }),
        required: false
    },
    notificationConfig: {
        type: new mongoose_1.Schema({
            privateKey: {
                type: String,
                required: true,
            },
            publicKey: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
        }, {
            _id: false
        }),
        required: false
    },
    scripts: {
        type: [
            new mongoose_1.Schema({
                key: String,
                content: String
            }, {
                _id: false
            })
        ],
        required: true,
        default: []
    }
});
exports.DomainModel = (0, mongoose_1.model)("domain", domainSchema);
