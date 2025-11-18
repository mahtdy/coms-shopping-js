"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavbarModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../model");
const navbarSchema = new mongoose_1.Schema(model_1.blockSchema);
exports.NavbarModel = (0, mongoose_1.model)("navbar", navbarSchema);
