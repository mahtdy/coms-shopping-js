"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = __importDefault(require("../../controller"));
const repository_1 = __importDefault(require("../../repositories/category/repository"));
const repository_2 = __importDefault(require("../../repositories/content/repository"));
const repository_3 = __importDefault(require("../../repositories/language/repository"));
const repository_4 = __importDefault(require("../../repositories/user/repository"));
const repository_5 = __importDefault(require("../../repositories/redirect/repository"));
const repository_6 = __importDefault(require("../../repositories/notFoundLog/repository"));
const repository_7 = __importDefault(require("../../repositories/system/repository"));
const parameters_1 = require("../../../decorators/parameters");
const zod_1 = require("zod");
const contentRegistry_1 = __importDefault(require("../../contentRegistry"));
const repository_8 = __importDefault(require("../../repositories/domain/repository"));
const repository_9 = __importDefault(require("../../repositories/contentGroup/repository"));
const repository_10 = __importDefault(require("../../repositories/linkTag/repository"));
class ContentController extends controller_1.default {
    constructor(baseRoute, repo, userModel, options) {
        super(baseRoute, repo, options);
        this.languageRepo = new repository_3.default();
        this.categoryRepo = new repository_1.default();
        this.userRepo = new repository_4.default({
            model: userModel
        });
        this.domainRepo = new repository_8.default();
        // this.adminRepo = new AdminRepository({
        //     model: adminModel
        // })
        this.contentRepo = new repository_2.default();
        this.redirectRepo = new repository_5.default();
        this.notFoundLog = new repository_6.default();
        this.systemConfigRepo = new repository_7.default();
        this.contentGroupRepo = new repository_9.default();
        this.linkTagRepo = new repository_10.default({
            population: [
                {
                    path: "link",
                    select: ["url"]
                }
            ]
        });
    }
    async getHeaderScripts(host) {
        try {
            let domain = await this.domainRepo.findOne({
                domain: host
            });
            let scripts = (domain === null || domain === void 0 ? void 0 : domain.scripts) || [];
            return {
                data: scripts
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getContent(url, host, user) {
        var _a, _b, _c, _d, _e;
        try {
            url = decodeURI(url);
            url = url.replace("/api", "");
            // var contentInfo = await this.findContentUrl(url, host)
            var contentInfo = await this.findContentUrl(url, "jarahan.arvita.ir");
            if (contentInfo.code == 404) {
                return {
                    next: true
                };
            }
            if ((_a = contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.code) === null || _a === void 0 ? void 0 : _a.toString().startsWith("3")) {
                return {
                    status: contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.code,
                    data: contentInfo,
                    redirect: contentInfo.url
                };
            }
            if (contentInfo.external == true) {
                return {
                    status: 200,
                    data: contentInfo
                };
            }
            var seoContent = contentInfo.data;
            var rep = contentRegistry_1.default.getInstance().getRegistry(seoContent.type);
            if (seoContent.type == "category") {
                var content = await ((_b = rep === null || rep === void 0 ? void 0 : rep.repo) === null || _b === void 0 ? void 0 : _b.findOne({
                    catID: seoContent.id,
                    language: seoContent.language,
                    lable: seoContent.categoryLable
                }));
                let articleRep = contentRegistry_1.default.getInstance().getRegistry(seoContent.categoryLable == "content" ? "article" : "author");
                let paginate = await ((_c = articleRep === null || articleRep === void 0 ? void 0 : articleRep.repo) === null || _c === void 0 ? void 0 : _c.paginate({
                    language: seoContent.language,
                    $or: [{
                            category: seoContent.id
                        }, {
                            categories: seoContent.id
                        }]
                }, 12, 1, {}));
                content.paginate = paginate;
            }
            else {
                var content = await ((_d = rep === null || rep === void 0 ? void 0 : rep.repo) === null || _d === void 0 ? void 0 : _d.findById(seoContent.id, {
                    population: [
                        {
                            path: "category"
                        },
                        {
                            path: "language"
                        },
                        {
                            path: "video"
                        },
                        {
                            path: "videos"
                        }
                    ]
                }));
                let catContent = await this.contentRepo.findOne({
                    id: content.category._id || content.category,
                    language: content.language._id || content.language,
                    "categoryLable": "content",
                });
                content.catContent = catContent;
                content = await ((_e = rep === null || rep === void 0 ? void 0 : rep.repo) === null || _e === void 0 ? void 0 : _e.getExtra(content));
                // console.log("content")
            }
            if (content.tags) {
                content.tagMap = await this.getLinksByTags(content.tags);
            }
            let domain = await this.domainRepo.findOne({
                domain: host
            });
            content['scripts'] = domain === null || domain === void 0 ? void 0 : domain.scripts;
            content['header'] = {
                logo: {
                    src: 'https://files.heyseo.ir/content/assets/img/logo-white.png',
                    size_img: {
                        width: 150,
                        height: 28
                    },
                    alt: 'موبایل1',
                },
                nav: {
                    name: "Nav",
                    data: {
                        list: [
                            {
                                title: "خانه",
                                link: '/',
                                component: null,
                            },
                            {
                                title: '',
                                link: '',
                                component: {
                                    name: 'Abshari',
                                    data: {
                                        layer0: [
                                            {
                                                title: "منو آبشاری",
                                                link: '/',
                                                label: [
                                                    {
                                                        type: 'icon', //image,icon,font(fa-angle-left)
                                                        text: 'جدید',
                                                        src: '',
                                                        alt: ''
                                                    }
                                                ],
                                            }
                                        ],
                                        layer1: [
                                            {
                                                title: "تعویض مفصل زانو",
                                                link: "/",
                                                label: [
                                                    {
                                                        type: 'icon',
                                                        text: 'جدید',
                                                        src: '',
                                                        alt: ''
                                                    }
                                                ],
                                                isBorderBottom: true,
                                                isChild: false
                                            },
                                            {
                                                title: "تعویض مفصل لگن",
                                                link: "/",
                                                label: [
                                                    {
                                                        type: 'image',
                                                        text: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/hot.svg',
                                                        alt: 'hot'
                                                    }
                                                ],
                                                isChild: true,
                                                isBorderBottom: true,
                                                layer2: [
                                                    {
                                                        title: "آرتروسکوپی لگن",
                                                        link: "/ff",
                                                        label: [
                                                            {
                                                                type: '',
                                                                text: '',
                                                                src: '',
                                                                alt: ''
                                                            }
                                                        ],
                                                        isBorderBottom: true,
                                                        isChild: false,
                                                    },
                                                    {
                                                        title: "تعویض مفصل لگن",
                                                        link: "/f",
                                                        label: [
                                                            {
                                                                type: 'icon',
                                                                text: 'جدید',
                                                                src: '',
                                                                alt: ''
                                                            }
                                                        ],
                                                        isBorderBottom: false,
                                                        isChild: true,
                                                        layer3: [
                                                            {
                                                                title: "آرتروسکوپی لگن",
                                                                link: "/g",
                                                                label: [
                                                                    {
                                                                        type: '',
                                                                        text: '',
                                                                        src: '',
                                                                        alt: ''
                                                                    }
                                                                ],
                                                                isChild: false,
                                                                isBorderBottom: true,
                                                            },
                                                            {
                                                                title: "تعویض مفصل لگن",
                                                                link: "/",
                                                                label: [
                                                                    {
                                                                        type: 'icon',
                                                                        text: 'جدید',
                                                                        src: '',
                                                                        alt: ''
                                                                    }
                                                                ],
                                                                isChild: false,
                                                                isBorderBottom: false,
                                                            }
                                                        ],
                                                    }
                                                ],
                                            },
                                            {
                                                title: "  دیسک کمر",
                                                link: "/disk",
                                                label: [
                                                    {
                                                        type: 'image',
                                                        text: '',
                                                        src: '/img/hot.svg',
                                                        alt: 'hot'
                                                    }
                                                ],
                                                isBorderBottom: true,
                                                isChild: false
                                            },
                                        ],
                                    }
                                },
                            },
                            {
                                title: "فیلم ها",
                                link: '/video',
                                component: null,
                            },
                            {
                                title: "",
                                link: '',
                                component: {
                                    name: 'Mega2',
                                    data: {
                                        type: 'Mega2',
                                        background: {
                                            color: "#f8f9fa"
                                        },
                                        layer0: {
                                            title: " مگا منو2",
                                            link: '/',
                                            label: {
                                                type: 'font_icon', //image,text,font_icon(fa-angle-left)
                                                font_icon: 'fa-fire',
                                                text: '',
                                                src: '',
                                                alt: ''
                                            }
                                        },
                                        layer: [
                                            {
                                                tab0: {
                                                    title: "عنوان تب اول",
                                                    link: '/d',
                                                    type: 'image', //image,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                    size_img: {
                                                        width: 28,
                                                        height: 28
                                                    },
                                                    alt: 'موبایل1',
                                                    tab_content: {
                                                        title2: "قیمت همه موبایل ها",
                                                        link2: '/s',
                                                        items: [
                                                            {
                                                                title3: " گوشی اپل0",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی جی پلاس ",
                                                                link3: '/dd',
                                                            },
                                                            {
                                                                title3: " گوشی ویوو ",
                                                                link3: '/ddddd',
                                                            },
                                                            {
                                                                title3: " گوشی ناتینگ فون ",
                                                                link3: '/ddd',
                                                            },
                                                            {
                                                                title3: " گوشی اپل",
                                                                link3: '/dd',
                                                            },
                                                            {
                                                                title3: "  گوشی سامسونگ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی شیائومی",
                                                                link3: '/',
                                                            },
                                                        ]
                                                    },
                                                }
                                            },
                                            {
                                                tab1: {
                                                    title: "عنوان تب دوم",
                                                    link: '/',
                                                    type: 'image', //image,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                    size_img: {
                                                        width: 28,
                                                        height: 28
                                                    },
                                                    alt: 'موبایل1',
                                                    tab_content: {
                                                        title2: "قیمت همه موبایل ها",
                                                        link2: '/',
                                                        items: [
                                                            {
                                                                title3: " گوشی اپل1",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی جی پلاس ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ویوو ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ناتینگ فون ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی اپل",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: "  گوشی سامسونگ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی شیائومی",
                                                                link3: '/',
                                                            },
                                                        ]
                                                    },
                                                }
                                            },
                                            {
                                                tab2: {
                                                    title: "عنوان تب سوم",
                                                    link: '/sdsd',
                                                    type: 'image', //image,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                    size_img: {
                                                        width: 28,
                                                        height: 28
                                                    },
                                                    alt: 'موبایل1',
                                                    tab_content: {
                                                        title2: "قیمت همه موبایل ها",
                                                        link2: '/sd',
                                                        items: [
                                                            {
                                                                title3: " گوشی اپل3",
                                                                link3: '/fff',
                                                            },
                                                            {
                                                                title3: " گوشی جی پلاس ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ویوو ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ناتینگ فون ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی اپل",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: "  گوشی سامسونگ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی شیائومی",
                                                                link3: '/',
                                                            },
                                                        ]
                                                    },
                                                }
                                            },
                                            {
                                                tab3: {
                                                    title: "عنوان تب چهار",
                                                    link: '/',
                                                    type: 'image', //image,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                    size_img: {
                                                        width: 28,
                                                        height: 28
                                                    },
                                                    alt: 'موبایل1',
                                                    tab_content: {
                                                        title2: "قیمت همه موبایل ها",
                                                        link2: '/',
                                                        items: [
                                                            {
                                                                title3: " گوشی اپل4",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی جی پلاس ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ویوو ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ناتینگ فون ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی اپل",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: "  گوشی سامسونگ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی شیائومی",
                                                                link3: '/',
                                                            },
                                                        ]
                                                    },
                                                }
                                            },
                                            {
                                                tab4: {
                                                    title: "عنوان تب پنجم",
                                                    link: '/',
                                                    type: 'image', //image,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                    size_img: {
                                                        width: 28,
                                                        height: 28
                                                    },
                                                    alt: 'موبایل1',
                                                    tab_content: {
                                                        title2: "قیمت همه موبایل ها",
                                                        link2: '/',
                                                        items: [
                                                            {
                                                                title3: " گوشی اپل5",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی جی پلاس ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ویوو ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ناتینگ فون ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی اپل",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: "  گوشی سامسونگ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی شیائومی",
                                                                link3: '/',
                                                            },
                                                        ]
                                                    },
                                                }
                                            },
                                            {
                                                tab5: {
                                                    title: "عنوان تب شش",
                                                    link: '/',
                                                    type: 'image', //image,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                    size_img: {
                                                        width: 28,
                                                        height: 28
                                                    },
                                                    alt: 'موبایل1',
                                                    tab_content: {
                                                        title2: "قیمت همه موبایل ها",
                                                        link2: '/',
                                                        items: [
                                                            {
                                                                title3: " گوشی اپل6",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی جی پلاس ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ویوو ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی ناتینگ فون ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی اپل",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: "  گوشی سامسونگ",
                                                                link3: '/',
                                                            },
                                                            {
                                                                title3: " گوشی شیائومی",
                                                                link3: '/',
                                                            },
                                                        ]
                                                    },
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                title: "تماس با ما",
                                link: '/contact-us',
                                component: null,
                            },
                            {
                                title: "",
                                link: '',
                                component: {
                                    name: 'Mega1',
                                    data: {
                                        background: {
                                            src: ``,
                                            color: `background:'linear-gradient(to right, #e3f4f8 2%, #aabbc3 82%)'`
                                        },
                                        border_item: {
                                            class_name: 'bor_lr',
                                        },
                                        layer0: {
                                            title: " مگا منو1",
                                            link: '/',
                                            label: {
                                                type: 'image', //image,text,font_icon(fa-angle-left)
                                                font_icon: '',
                                                text: '',
                                                src: 'https://files.heyseo.ir/content/assets/img/badges.svg',
                                                alt: 'hot'
                                            }
                                        },
                                        layer: [
                                            {
                                                column0: {
                                                    title: "عنوان ستون اول",
                                                    link: '/',
                                                    isBorderBottom: true,
                                                    items: [
                                                        {
                                                            tem1: {
                                                                name_tem: 'mega_it1',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/35x35/img1.svg',
                                                                size_img: {
                                                                    width: 35,
                                                                    height: 35
                                                                },
                                                                alt: 'آرتروسکوپی لگ',
                                                                title: 'آرتروسکوپی لگن',
                                                                link: '/',
                                                                abstract: 'نوع دقیق هر آیتم را چک کنید و سپس بر اساس نوع',
                                                            }
                                                        },
                                                        {
                                                            tem2: {
                                                                name_tem: 'mega_it1',
                                                                type: 'font_icon', //image,font_icon(fa-angle-left)
                                                                font_icon: 'fa-fire',
                                                                src: '',
                                                                size_img: {
                                                                    width: 0,
                                                                    height: 0
                                                                },
                                                                alt: '',
                                                                title: 'آرتروسکوپی لگن',
                                                                link: '/',
                                                                abstract: 'نوع دقیق هر آیتم را چک کنید و سپس بر اساس نوع',
                                                            }
                                                        },
                                                        {
                                                            tem3: {
                                                                name_tem: 'mega_it1',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/35x35/img1.svg',
                                                                size_img: {
                                                                    width: 35,
                                                                    height: 35
                                                                },
                                                                alt: 'آرتروسکوپی لگ',
                                                                title: 'آرتروسکوپی لگن',
                                                                link: '/',
                                                                abstract: 'نوع دقیق هر آیتم را چک کنید و سپس بر اساس نوع',
                                                            }
                                                        },
                                                        {
                                                            tem4: {
                                                                name_tem: 'mega_it1',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/35x35/img1.svg',
                                                                size_img: {
                                                                    width: 35,
                                                                    height: 35
                                                                },
                                                                alt: 'آرتروسکوپی لگ',
                                                                title: 'آرتروسکوپی لگن',
                                                                link: '/',
                                                                abstract: 'نوع دقیق هر آیتم را چک کنید و سپس بر اساس نوع',
                                                            }
                                                        },
                                                    ],
                                                }
                                            },
                                            {
                                                column1: {
                                                    title: "عنوان ستون دوم",
                                                    link: '/',
                                                    isBorderBottom: false,
                                                    items: [
                                                        {
                                                            tem1: {
                                                                name_tem: 'mega_it4',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/Girl.jpg',
                                                                size_img: {
                                                                    width: 228,
                                                                    height: 171
                                                                },
                                                                alt: 'آرتروسکوپی لگن',
                                                                title: '',
                                                                link: '/',
                                                                abstract: 'ایرلاین به سطح خوبی از ترافیک نیاز دارد. Maecenas غمگین، پاک و بدنی placerat، همیشه یک tortor massa بزرگ، اجازه دهید آن را ترسناک ترین زمین ترس و یا felis.',
                                                            },
                                                        }
                                                    ],
                                                }
                                            },
                                            {
                                                column2: {
                                                    title: "عنوان ستون سوم",
                                                    link: '/',
                                                    isBorderBottom: false,
                                                    items: [
                                                        {
                                                            tem1: {
                                                                name_tem: 'mega_it3',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/50x50/img2.png',
                                                                size_img: {
                                                                    width: 50,
                                                                    height: 50
                                                                },
                                                                alt: 'آرتروسکوپی لگن',
                                                                title: 'آنالیز سئو سایت',
                                                                link: '/',
                                                                abstract: '',
                                                            },
                                                            tem2: {
                                                                name_tem: 'mega_it3',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/50x50/img2.png',
                                                                size_img: {
                                                                    width: 50,
                                                                    height: 50
                                                                },
                                                                alt: 'آرتروسکوپی لگن',
                                                                title: 'آنالیز سئو سایت',
                                                                link: '/',
                                                                abstract: '',
                                                            },
                                                            tem3: {
                                                                name_tem: 'mega_it3',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/50x50/img2.png',
                                                                size_img: {
                                                                    width: 50,
                                                                    height: 50
                                                                },
                                                                alt: 'آرتروسکوپی لگن',
                                                                title: 'آنالیز سئو سایت',
                                                                link: '/',
                                                                abstract: '',
                                                            },
                                                        }
                                                    ],
                                                }
                                            },
                                            {
                                                column3: {
                                                    title: "عنوان ستون چهارم",
                                                    link: '/',
                                                    isBorderBottom: true,
                                                    items: [
                                                        {
                                                            tem1: {
                                                                name_tem: 'mega_it2',
                                                                type: 'image', //image,font_icon(fa-angle-left)
                                                                font_icon: '',
                                                                src: 'https://files.heyseo.ir/content/assets/img/70x70/img1.png',
                                                                size_img: {
                                                                    width: 70,
                                                                    height: 70
                                                                },
                                                                alt: 'آرتروسکوپی لگن',
                                                                title: 'آرتروسکوپی لگن',
                                                                link: '/',
                                                                abstract: 'نوع دقیق هر آیتم را چک کنید و سپس بر اساس نوع',
                                                            },
                                                        }
                                                    ],
                                                }
                                            }
                                        ]
                                    }
                                },
                            }
                        ]
                    }
                },
                btn_text: "ثبت درخواست",
                link: '',
                ham: {
                    name: 'Ham1',
                    data: {
                        list: [
                            {
                                title: "خانه",
                                link: "/home",
                            },
                            {
                                title: "محصولات",
                                link: null,
                                label: {
                                    type: 'image',
                                    font_icon: '',
                                    text: '',
                                    src: 'https://files.heyseo.ir/content/assets/img/hot.svg',
                                    alt: 'hot',
                                    size_img: {
                                        width: 29,
                                        height: 18
                                    },
                                },
                                layer2: [
                                    {
                                        title: "موبایل",
                                        link: "/ff",
                                    },
                                    {
                                        title: "تعویض مفصل لگن",
                                        link: "",
                                        label: {
                                            type: 'text',
                                            text: 'جدید',
                                        },
                                        isChild: true,
                                        layer3: [
                                            {
                                                title: "اپل",
                                                link: "/g",
                                            },
                                            {
                                                title: "1اپل",
                                                link: "/g",
                                            },
                                            {
                                                title: "2اپل",
                                                link: "/g",
                                            },
                                        ],
                                    }
                                ],
                            },
                            {
                                title: "تلویزیون",
                                link: "/tv",
                            },
                            {
                                title: "لپ تاپ",
                                link: "/tv",
                            },
                            {
                                title: "یخچال",
                                link: "/tv",
                            },
                        ]
                    }
                }
            };
            var resData;
            switch (content === null || content === void 0 ? void 0 : content.viewMode) {
                case "public":
                    content.seo = seoContent;
                    return {
                        status: 200,
                        data: content
                    };
                case "forUsers":
                    if (user === null || user === void 0 ? void 0 : user.id) {
                        content.seo = seoContent;
                        return {
                            status: 200,
                            data: content
                        };
                    }
                    else {
                        contentInfo.code = 403;
                        delete contentInfo.data;
                        return {
                            status: 403,
                            data: contentInfo
                        };
                    }
                case "private":
                    if (user === null || user === void 0 ? void 0 : user.id) {
                        var userInfo = await this.userRepo.findById(user.id);
                        if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.userCategory) == content.viewCategory) {
                            content.seo = seoContent;
                            return {
                                status: 200,
                                data: content
                            };
                        }
                        else {
                            contentInfo.code = 403;
                            delete contentInfo.data;
                            return {
                                status: 403,
                                data: contentInfo
                            };
                        }
                    }
                    else {
                        contentInfo.code = 403;
                        delete contentInfo.data;
                        return {
                            status: 403,
                            data: contentInfo
                        };
                    }
                default:
                    return {
                        status: 200,
                        data: resData
                    };
            }
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getTagContent(url, host) {
        try {
            url = url.replace("/api", "");
            let urlPams = url.split("?");
            let query = "";
            url = urlPams[0];
            if (urlPams.length > 1) {
                query = "?" + urlPams[1];
            }
            var link = await this.linkTagRepo.findOne({
                tag: url
            });
            return {
                status: 301,
                redirect: (link === null || link === void 0 ? void 0 : link.link.url) + query
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getBlock(name, response, user) {
        // React.
        response.render("header.jsx", {
            sample: {
                h3: "لیست محتوا",
                data: [
                    {
                        title: "پست 1",
                        name: "افلاطونی",
                        date: new Date(),
                        count: 5,
                        src: "https://files.heyseo.ir/retete.png"
                    },
                    {
                        title: "پست 1",
                        name: "افلاطونی",
                        date: new Date(Date.now()),
                        count: 5,
                        src: "https://files.heyseo.ir/retete.png"
                    },
                    {
                        title: "پست 1",
                        name: "افلاطونی",
                        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                        count: 5,
                        src: "https://files.heyseo.ir/retete.png"
                    }
                ]
            }
        });
        return {
            sent: true
        };
        // console.log(name)
        // ReactEngine
        // return {
        //     status : 200,
        //     data : {
        //         ok : true
        //     }
        // }
    }
    async getSimilarContent(id) {
        try {
            let contentGroup = await this.contentGroupRepo.findOne({
                ids: id
            });
            if (contentGroup == null) {
                return {
                    data: []
                };
            }
            let contentIds = contentGroup.ids.map((val) => {
                if (typeof val == "string") {
                    return val;
                }
                return val.toHexString();
            });
            contentIds = contentIds.filter(e => e !== id);
            let contents = await this.contentRepo.findMany({
                id: {
                    $in: contentIds
                }
            });
            return {
                data: contents
            };
        }
        catch (error) {
            console.log("err");
            throw error;
        }
    }
    // async
    // async getContentUrl(url : string){
    // }
    async getCategoryContent(catId, language, type, host) {
        var _a;
        try {
            var rep = contentRegistry_1.default.getInstance().getRegistry(type);
            // console.log(seoContent.type, rep, seoContent.id)
            var content = await ((_a = rep === null || rep === void 0 ? void 0 : rep.repo) === null || _a === void 0 ? void 0 : _a.findOne({
                catID: catId,
                language: language,
                // lable: 
            }));
            // var contentInfo = await this.findContentByID(catId, host)
            // if (contentInfo.code == 404) {
            //     return {
            //         next: true
            //     }
            // }
            // if (contentInfo?.code?.toString().startsWith("3")) {
            //     return {
            //         status: contentInfo?.code,
            //         data: contentInfo,
            //         redirect: contentInfo.url
            //     }
            // }
            // if (contentInfo.external == true) {
            //     return {
            //         status: 200,
            //         data: contentInfo
            //     }
            // }
            // content.seo = contentInfo.data
            // console.log(content)
            let catContent = await this.contentRepo.findOne({
                id: catId,
                language: language,
                categoryLable: "content"
            });
            let category = await this.categoryRepo.findById(catId);
            return {
                data: {
                    category,
                    catContent
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getCategoriesContent(catIds, language, type, host) {
        try {
            let data = {};
            for (let i = 0; i < catIds.length; i++) {
                let catContent = await this.contentRepo.findOne({
                    id: catIds[i],
                    language: language,
                    categoryLable: "content"
                });
                let category = await this.categoryRepo.findById(catIds[i]);
                data[catIds[i]] = {
                    category,
                    catContent
                };
            }
            return {
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getContentURL(url, user) {
        console.log(url, user);
        return {
            status: 200,
            data: {}
        };
    }
    async findContentUrl(url, host) {
        try {
            const domain = await this.domainRepo.findOne({
                domain: host
            });
            if (!(domain === null || domain === void 0 ? void 0 : domain.isDefault)) {
                url = (domain === null || domain === void 0 ? void 0 : domain.domain) + url;
            }
            var seoContent = await this.contentRepo.getContentByUrl(url);
            var redirect = await this.redirectRepo.getRedirectBySource(url, seoContent === null || seoContent === void 0 ? void 0 : seoContent._id);
            if (redirect != null) {
                if (redirect.external) {
                    return {
                        code: redirect.code,
                        url: redirect.to,
                        external: true
                    };
                }
                let redirectURL = "";
                if (redirect.toStatic) {
                    // var r = await this.contentRepo.getContentByUrl(redirect.to)
                    redirectURL = redirect.to;
                }
                else {
                    var r = await this.contentRepo.getContentByUrl(redirect.to);
                    redirectURL = (r === null || r === void 0 ? void 0 : r.url) || "";
                }
                if (seoContent != null) {
                    return {
                        code: redirect.code,
                        data: seoContent,
                        url: redirectURL
                    };
                }
            }
            var seoContent = await this.contentRepo.getContentByUrl(url);
            if (seoContent != undefined) {
                // console.log("seoContent" , seoContent)
                // (seoContent as any)['header'] = {
                //     hello : "word"
                // }
                return {
                    code: 200,
                    data: seoContent
                };
            }
            else {
                var config404Enable = await this.systemConfigRepo.getConfigValue("404_redirect_enable");
                var config404 = await this.systemConfigRepo.getConfigValue("404_redirect");
                if (config404Enable) {
                    if (config404.url.startsWith("/") || config404.url == "") {
                        return {
                            code: config404.code,
                            url: config404.url,
                            external: false
                        };
                    }
                    var seoContent = await this.contentRepo.getContentByUrl(config404);
                    if (seoContent != null) {
                        return {
                            code: config404.code,
                            data: seoContent,
                            url: config404.url
                        };
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        return {
            code: 404
        };
    }
    async findContentByID(id, host) {
        try {
            const domain = await this.domainRepo.findOne({
                domain: host
            });
            var seoContent = await this.contentRepo.findById(id);
            if (seoContent == null) {
                return {
                    code: 404,
                };
            }
            let url = seoContent.url;
            var redirect = await this.redirectRepo.getRedirectBySource(url, seoContent === null || seoContent === void 0 ? void 0 : seoContent._id);
            if (redirect != null) {
                if (redirect.external) {
                    return {
                        code: redirect.code,
                        url: redirect.to,
                        external: true
                    };
                }
                let redirectURL = "";
                if (redirect.toStatic) {
                    // var r = await this.contentRepo.getContentByUrl(redirect.to)
                    redirectURL = redirect.to;
                }
                else {
                    var r = await this.contentRepo.getContentByUrl(redirect.to);
                    redirectURL = (r === null || r === void 0 ? void 0 : r.url) || "";
                }
                if (seoContent != null) {
                    return {
                        code: redirect.code,
                        data: seoContent,
                        url: redirectURL
                    };
                }
            }
            var seoContent = await this.contentRepo.getContentByUrl(url);
            if (seoContent != undefined) {
                // console.log("seoContent" , seoContent)
                // (seoContent as any)['header'] = {
                //     hello : "word"
                // }
                return {
                    code: 200,
                    data: seoContent
                };
            }
            else {
                var config404Enable = await this.systemConfigRepo.getConfigValue("404_redirect_enable");
                var config404 = await this.systemConfigRepo.getConfigValue("404_redirect");
                if (config404Enable) {
                    if (config404.url.startsWith("/") || config404.url == "") {
                        return {
                            code: config404.code,
                            url: config404.url,
                            external: false
                        };
                    }
                    var seoContent = await this.contentRepo.getContentByUrl(config404);
                    if (seoContent != null) {
                        return {
                            code: config404.code,
                            data: seoContent,
                            url: config404.url
                        };
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        return {
            code: 404
        };
    }
    async findContentById(id, url) {
        try {
            var seoContent = await this.contentRepo.findById(id);
            if (seoContent != null)
                var redirect = await this.redirectRepo.getRedirectBySource(seoContent === null || seoContent === void 0 ? void 0 : seoContent.url, seoContent === null || seoContent === void 0 ? void 0 : seoContent._id);
            else
                var redirect = await this.redirectRepo.getRedirectBySource(url, undefined);
            if (redirect != null) {
                if (redirect.external) {
                    return {
                        code: redirect.code,
                        url: redirect.to,
                        external: true
                    };
                }
                var seoContent = await this.contentRepo.getContentByUrl(url);
                if (seoContent != null) {
                    return {
                        code: redirect.code,
                        data: seoContent,
                        url: redirect.to
                    };
                }
            }
            if (seoContent != undefined) {
                return {
                    code: 200,
                    data: seoContent
                };
            }
            else {
                var config404Enable = await this.systemConfigRepo.getConfigValue("404_redirect_enable");
                var config404 = await this.systemConfigRepo.getConfigValue("404_redirect");
                if (config404Enable) {
                    if (config404.url.startsWith("/") || config404.url == "") {
                        return {
                            code: config404.code,
                            url: config404.url,
                            external: false
                        };
                    }
                    var seoContent = await this.contentRepo.getContentByUrl(config404);
                    if (seoContent != null) {
                        return {
                            code: config404.code,
                            data: seoContent,
                            url: config404.url
                        };
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        return {
            code: 404
        };
    }
    async getLinksByTags(tags) {
        try {
            let result = {};
            // console.log(new Date())
            let data = await this.linkTagRepo.getLinksByTags(tags);
            for (let i = 0; i < data.length; i++) {
                try {
                    result[data[i].tag] = data[i].link.url;
                }
                catch (error) {
                }
            }
            return result;
        }
        catch (error) {
        }
        return {};
    }
    initApis() {
        this.addRoute("/", "get", this.getContent.bind(this));
    }
}
exports.default = ContentController;
__decorate([
    __param(0, (0, parameters_1.Header)("host"))
], ContentController.prototype, "getHeaderScripts", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "url",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Header)("host")),
    __param(2, (0, parameters_1.User)({
        required: false
    }))
], ContentController.prototype, "getContent", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    }))
], ContentController.prototype, "getSimilarContent", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "catId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "type",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Header)("host"))
], ContentController.prototype, "getCategoryContent", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "catId",
        schema: zod_1.z.array(controller_1.default.id)
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "type",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Header)("host"))
], ContentController.prototype, "getCategoriesContent", null);
__decorate([
    __param(0, (0, parameters_1.FromReq)("url")),
    __param(1, (0, parameters_1.User)({
        required: false
    }))
], ContentController.prototype, "getContentURL", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "tags",
        schema: zod_1.z.array(zod_1.z.string())
    }))
], ContentController.prototype, "getLinksByTags", null);
