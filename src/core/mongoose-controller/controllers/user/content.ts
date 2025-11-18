import { Model } from "mongoose";
import { UserInfo } from "../../auth/user/user-login";
import BaseController, { ControllerOptions } from "../../controller";
import CategoryRepository from "../../repositories/category/repository";
import Content from "../../repositories/content/model";
import ContentRepository from "../../repositories/content/repository";
import LanguageRepository from "../../repositories/language/repository";
import BaseUser from "../../repositories/user/model";
import UserRepository from "../../repositories/user/repository";
import RedirectRepository from "../../repositories/redirect/repository";
import NotFoundLogRepository from "../../repositories/notFoundLog/repository";
import SystemConfigRepository from "../../repositories/system/repository";
import { Body, FromReq, Header, Query, User } from "../../../decorators/parameters";
import { Response } from "../../../controller";
import { z } from "zod"
import ContentMaduleRegistry from "../../contentRegistry";
import { Response as ExpressResponse } from "express";
import DomainRepository from "../../repositories/domain/repository";
import ContentGroupRepository from "../../repositories/contentGroup/repository";
import LinkTagRepository from "../../repositories/linkTag/repository";
import ConfigService from "../../../services/config";

interface ContentQueryResult {
    code: 200 | 404 | 403 | 301 | 302 | 303 | 304 | 307 | 308,
    url?: string,
    data?: any,
    external?: boolean
}

export default class ContentController extends BaseController<Content> {
    private languageRepo: LanguageRepository
    private categoryRepo: CategoryRepository
    private userRepo: UserRepository<BaseUser>
    // private adminRepo: AdminRepository<BaseAdmin>
    private contentRepo: ContentRepository
    private redirectRepo: RedirectRepository
    private notFoundLog: NotFoundLogRepository
    private systemConfigRepo: SystemConfigRepository
    domainRepo: DomainRepository
    contentGroupRepo: ContentGroupRepository
    linkTagRepo: LinkTagRepository

    constructor(baseRoute: string, repo: ContentRepository, userModel: Model<BaseUser>, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.languageRepo = new LanguageRepository();
        this.categoryRepo = new CategoryRepository();
        this.userRepo = new UserRepository({
            model: userModel
        })
        this.domainRepo = new DomainRepository()
        // this.adminRepo = new AdminRepository({
        //     model: adminModel
        // })

        this.contentRepo = new ContentRepository()
        this.redirectRepo = new RedirectRepository()
        this.notFoundLog = new NotFoundLogRepository()
        this.systemConfigRepo = new SystemConfigRepository()
        this.contentGroupRepo = new ContentGroupRepository()
        this.linkTagRepo = new LinkTagRepository({
            population: [
                {
                    path: "link",
                    select: ["url"]
                }]
        })
    }



    async getHeaderScripts(
        @Header("host") host: string
    ) {
        try {
            let domain = await this.domainRepo.findOne({
                domain: host
            })

            let scripts = domain?.scripts || []
            return {
                data: scripts
            }
        } catch (error) {
            throw error
        }
    }

    async getContent(
        @Query({
            destination: "url",
            schema: z.string()
        }) url: string,
        @Header("host") host: string,
        @User({
            required: false
        }) user?: UserInfo
    ): Promise<Response> {
        try {
            url = decodeURI(url)
            url = url.replace("/api", "")

            var contentInfo = await this.findContentUrl(url, host)

            if (contentInfo.code == 404) {
                return {
                    next: true
                }
            }
            if (contentInfo?.code?.toString().startsWith("3")) {
                return {
                    status: contentInfo?.code,
                    data: contentInfo,
                    redirect: contentInfo.url
                }
            }

            if (contentInfo.external == true) {
                return {
                    status: 200,
                    data: contentInfo
                }
            }

            var seoContent = contentInfo.data
            var rep = ContentMaduleRegistry.getInstance().getRegistry(seoContent.type)


            if (seoContent.type == "category") {
                var content: any = await rep?.repo?.findOne({
                    catID: seoContent.id,
                    language: seoContent.language,
                    lable: seoContent.categoryLable
                })
                let articleRep = ContentMaduleRegistry.getInstance().getRegistry(seoContent.categoryLable == "content" ? "article" : "author")
                let paginate = await articleRep?.repo?.paginate({
                    isPublished: true,
                    language: seoContent.language,
                    $or: [{
                        category: seoContent.id
                    }, {
                        categories: seoContent.id
                    }]
                }, 12, 1, {

                })
                content.paginate = paginate

            }

            else {
                var content: any = await rep?.repo?.findById(seoContent.id, {
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
                })

                let catContent = await this.contentRepo.findOne({
                    id: content.category._id || content.category,
                    language: content.language._id || content.language,
                    "categoryLable": "content",
                })
                content.catContent = catContent

                content = await rep?.repo?.getExtra(content)
                // console.log("content")
            }

            if (content.tags) {
                content.tagMap = await this.getLinksByTags(content.tags)
            }

            let domain = await this.domainRepo.findOne({
                domain: host
            })

            content['scripts'] = domain?.scripts

            content['header'] = {
                logo: {
                    src: 'https://files.heyseo.ir/content/assets/img/logo-white.png',
                    size_img: {
                        width: 150,
                        height: 28
                    },
                    alt: 'موبایل1',
                },
                nav:
                {
                    name: "Nav",
                    data: {
                        list:
                            [
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
                                                            type: 'icon',//image,icon,font(fa-angle-left)
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

                                            layer0:
                                            {
                                                title: " مگا منو2",
                                                link: '/',
                                                label:
                                                {
                                                    type: 'font_icon',//image,text,font_icon(fa-angle-left)
                                                    font_icon: 'fa-fire',
                                                    text: '',
                                                    src: '',
                                                    alt: ''
                                                }
                                            }
                                            ,

                                            layer: [
                                                {
                                                    tab0:
                                                    {
                                                        title: "عنوان تب اول",
                                                        link: '/d',

                                                        type: 'image',//image,font_icon(fa-angle-left)
                                                        font_icon: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                        size_img: {
                                                            width: 28,
                                                            height: 28
                                                        },
                                                        alt: 'موبایل1',

                                                        tab_content:
                                                        {
                                                            title2: "قیمت همه موبایل ها",
                                                            link2: '/s',
                                                            items:
                                                                [
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
                                                    tab1:
                                                    {
                                                        title: "عنوان تب دوم",
                                                        link: '/',

                                                        type: 'image',//image,font_icon(fa-angle-left)
                                                        font_icon: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                        size_img: {
                                                            width: 28,
                                                            height: 28
                                                        },
                                                        alt: 'موبایل1',

                                                        tab_content:
                                                        {
                                                            title2: "قیمت همه موبایل ها",
                                                            link2: '/',
                                                            items:
                                                                [
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
                                                    tab2:
                                                    {
                                                        title: "عنوان تب سوم",
                                                        link: '/sdsd',

                                                        type: 'image',//image,font_icon(fa-angle-left)
                                                        font_icon: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                        size_img: {
                                                            width: 28,
                                                            height: 28
                                                        },
                                                        alt: 'موبایل1',

                                                        tab_content:
                                                        {
                                                            title2: "قیمت همه موبایل ها",
                                                            link2: '/sd',
                                                            items:
                                                                [
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
                                                    tab3:
                                                    {
                                                        title: "عنوان تب چهار",
                                                        link: '/',

                                                        type: 'image',//image,font_icon(fa-angle-left)
                                                        font_icon: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                        size_img: {
                                                            width: 28,
                                                            height: 28
                                                        },
                                                        alt: 'موبایل1',

                                                        tab_content:
                                                        {
                                                            title2: "قیمت همه موبایل ها",
                                                            link2: '/',
                                                            items:
                                                                [
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
                                                    tab4:
                                                    {
                                                        title: "عنوان تب پنجم",
                                                        link: '/',

                                                        type: 'image',//image,font_icon(fa-angle-left)
                                                        font_icon: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                        size_img: {
                                                            width: 28,
                                                            height: 28
                                                        },
                                                        alt: 'موبایل1',

                                                        tab_content:
                                                        {
                                                            title2: "قیمت همه موبایل ها",
                                                            link2: '/',
                                                            items:
                                                                [
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
                                                    tab5:
                                                    {
                                                        title: "عنوان تب شش",
                                                        link: '/',

                                                        type: 'image',//image,font_icon(fa-angle-left)
                                                        font_icon: '',
                                                        src: 'https://files.heyseo.ir/content/assets/img/28x28/phone.svg',
                                                        size_img: {
                                                            width: 28,
                                                            height: 28
                                                        },
                                                        alt: 'موبایل1',

                                                        tab_content:
                                                        {
                                                            title2: "قیمت همه موبایل ها",
                                                            link2: '/',
                                                            items:
                                                                [
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

                                            layer0:
                                            {
                                                title: " مگا منو1",
                                                link: '/',
                                                label:
                                                {
                                                    type: 'image',//image,text,font_icon(fa-angle-left)
                                                    font_icon: '',
                                                    text: '',
                                                    src: 'https://files.heyseo.ir/content/assets/img/badges.svg',
                                                    alt: 'hot'
                                                }
                                            }
                                            ,

                                            layer: [
                                                {
                                                    column0:
                                                    {
                                                        title: "عنوان ستون اول",
                                                        link: '/',
                                                        isBorderBottom: true,
                                                        items: [
                                                            {
                                                                tem1: {
                                                                    name_tem: 'mega_it1',
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                                                    type: 'font_icon',//image,font_icon(fa-angle-left)
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
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                                    column1:
                                                    {
                                                        title: "عنوان ستون دوم",
                                                        link: '/',
                                                        isBorderBottom: false,
                                                        items: [
                                                            {
                                                                tem1: {
                                                                    name_tem: 'mega_it4',
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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

                                                    column2:
                                                    {
                                                        title: "عنوان ستون سوم",
                                                        link: '/',
                                                        isBorderBottom: false,
                                                        items: [
                                                            {
                                                                tem1: {
                                                                    name_tem: 'mega_it3',
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                                    column3:
                                                    {
                                                        title: "عنوان ستون چهارم",
                                                        link: '/',
                                                        isBorderBottom: true,
                                                        items: [
                                                            {
                                                                tem1: {
                                                                    name_tem: 'mega_it2',
                                                                    type: 'image',//image,font_icon(fa-angle-left)
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
                                label:
                                {
                                    type: 'image',
                                    font_icon: '',
                                    text: '',
                                    src: 'https://files.heyseo.ir/content/assets/img/hot.svg',
                                    alt: 'hot',
                                    size_img: {
                                        width: 29,
                                        height: 18
                                    },
                                }
                                ,


                                layer2: [
                                    {
                                        title: "موبایل",
                                        link: "/ff",
                                    },
                                    {
                                        title: "تعویض مفصل لگن",
                                        link: "",
                                        label:
                                        {
                                            type: 'text',
                                            text: 'جدید',
                                        }
                                        ,

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
            }
            var resData
            switch (content?.viewMode) {
                case "public":
                    content.seo = seoContent

                    return {
                        status: 200,
                        data: content

                    }

                case "forUsers":
                    if (user?.id) {
                        content.seo = seoContent
                        return {
                            status: 200,
                            data: content
                        }
                    }
                    else {
                        contentInfo.code = 403
                        delete contentInfo.data
                        return {
                            status: 403,
                            data: contentInfo
                        }
                    }

                case "private":
                    if (user?.id) {
                        var userInfo = await this.userRepo.findById(user.id)
                        if (userInfo?.userCategory == content.viewCategory) {
                            content.seo = seoContent
                            return {
                                status: 200,
                                data: content
                            }
                        }
                        else {
                            contentInfo.code = 403
                            delete contentInfo.data
                            return {
                                status: 403,
                                data: contentInfo
                            }
                        }
                    }
                    else {
                        contentInfo.code = 403
                        delete contentInfo.data
                        return {
                            status: 403,
                            data: contentInfo
                        }
                    }
                default:
                    return {
                        status: 200,
                        data: resData
                    }
            }
        }
        catch (error) {
            console.log(error)
            throw error
        }
    }


    async getContents(
        category: string,
        type: string,
        language: string,
        sortKey: string,
        sortOrder: string,
        id: string,
        page: number,
        limit: number,

    ): Promise<Response> {
        const contentMap: any = ConfigService.getConfig("contentMap")

        type = contentMap[type]
        var rep = ContentMaduleRegistry.getInstance().getRegistry(type)?.repo
        let sort = sortKey != undefined && sortOrder != undefined ? {
            sortKey: sortOrder
        } : {
            _id: -1
        }
        if (rep == undefined) {
            return {
                status: 200,
                data: []
            }
        }

        let query: any = {
            category,
            language,
            type,
        }
        if(id != undefined){
            query["id"]= {
                $ne : id
            }
        }

        let contents :any[]= JSON.parse(JSON.stringify(await this.contentRepo.findMany(query, {
            sort
        })))

        for (let i = 0; i < contents.length; i++) {
            contents[i]["page"] = await rep.findById(contents[i].id, {
                projection: {
                    imageConfig: 1,
                    title: 1
                }
            })
        }


        return {
            data: contents,
            status : 200
        }
    }


    async getTagContent(
        url: string,
        host: string
    ): Promise<Response> {
        try {
            url = url.replace("/api", "")
            let urlPams = url.split("?")
            let query = ""
            url = urlPams[0]
            if (urlPams.length > 1) {
                query = "?" + urlPams[1]
            }
            var link: any = await this.linkTagRepo.findOne({
                tag: url
            })
            return {
                status: 301,
                redirect: link?.link.url + query
            }
        }
        catch (error) {
            console.log(error)
            throw error
        }
    }

    async getBlock(
        name: string,
        response: ExpressResponse,
        user?: UserInfo
    ): Promise<Response> {
        // React.
        response.render("header.jsx",
            {
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
            })
        return {
            sent: true
        }
        // console.log(name)
        // ReactEngine
        // return {
        //     status : 200,
        //     data : {
        //         ok : true
        //     }
        // }
    }

    async getSimilarContent(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        try {
            let contentGroup = await this.contentGroupRepo.findOne({
                ids: id
            })

            if (contentGroup == null) {
                return {
                    data: []
                }
            }

            let contentIds = contentGroup.ids.map((val) => {
                if (typeof val == "string") {
                    return val
                }
                return val.toHexString()
            })

            contentIds = contentIds.filter(e => e !== id)

            let contents = await this.contentRepo.findMany({
                id: {
                    $in: contentIds
                }
            })


            return {
                data: contents
            }
        } catch (error) {
            console.log("err")
            throw error
        }

    }


    // async

    // async getContentUrl(url : string){

    // }

    async getCategoryContent(
        @Query({
            destination: "catId",
            schema: BaseController.id
        }) catId: string,
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string,
        @Query({
            destination: "type",
            schema: z.string()
        }) type: string,
        @Header("host") host: string,
    ): Promise<Response> {
        try {
            var rep = ContentMaduleRegistry.getInstance().getRegistry(type)

            var content: any = await rep?.repo?.findOne({
                catID: catId,
                language: language,
            })

            let catContent = await this.contentRepo.findOne({
                id: catId,
                language: language,
                categoryLable: "content"
            })
            let category = await this.categoryRepo.findById(catId)
            return {
                data: {
                    category,
                    catContent
                }
            }

        } catch (error) {
            throw error
        }


    }


    async getCategoriesContent(
        @Query({
            destination: "catId",
            schema: z.array(BaseController.id)
        }) catIds: string[],
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string,
        @Query({
            destination: "type",
            schema: z.string()
        }) type: string,
        @Header("host") host: string,
    ): Promise<Response> {
        try {
            let data: any = {}
            for (let i = 0; i < catIds.length; i++) {
                let catContent = await this.contentRepo.findOne({
                    id: catIds[i],
                    language: language,
                    categoryLable: "content"
                })
                let category = await this.categoryRepo.findById(catIds[i])
                data[catIds[i]] = {
                    category,
                    catContent
                }
            }


            return {
                data
            }

        } catch (error) {
            throw error
        }


    }


    async getContentURL(
        @FromReq("url") url: string,
        @User({
            required: false
        }) user?: UserInfo
    ): Promise<Response> {
        console.log(url, user)
        return {
            status: 200,
            data: {}
        }
    }

    async findContentUrl(url: string, host: string): Promise<ContentQueryResult> {
        try {
            const domain = await this.domainRepo.findOne({
                domain: host
            })

            if (!domain?.isDefault) {
                url = domain?.domain + url
            }


            var seoContent = await this.contentRepo.getContentByUrl(url)

            var redirect = await this.redirectRepo.getRedirectBySource(url, seoContent?._id)

            if (redirect != null) {
                if (redirect.external) {
                    return {
                        code: redirect.code,
                        url: redirect.to,
                        external: true
                    }
                }
                let redirectURL = ""
                if (redirect.toStatic) {
                    // var r = await this.contentRepo.getContentByUrl(redirect.to)
                    redirectURL = redirect.to
                }
                else {
                    var r = await this.contentRepo.getContentByUrl(redirect.to)
                    redirectURL = r?.url || ""
                }
                if (seoContent != null) {
                    return {
                        code: redirect.code,
                        data: seoContent,
                        url: redirectURL
                    }
                }
            }

            var seoContent = await this.contentRepo.getContentByUrl(url)

            if (seoContent != undefined) {
                // console.log("seoContent" , seoContent)
                // (seoContent as any)['header'] = {
                //     hello : "word"
                // }
                return {
                    code: 200,
                    data: seoContent
                }
            }


            else {
                var config404Enable = await this.systemConfigRepo.getConfigValue("404_redirect_enable")
                var config404 = await this.systemConfigRepo.getConfigValue("404_redirect")
                if (config404Enable) {
                    if ((config404.url as string).startsWith("/") || (config404.url as string) == "") {
                        return {
                            code: config404.code,
                            url: config404.url,
                            external: false
                        }
                    }
                    var seoContent = await this.contentRepo.getContentByUrl(config404)
                    if (seoContent != null) {
                        return {
                            code: config404.code,
                            data: seoContent,
                            url: config404.url
                        }
                    }
                }
            }
        }
        catch (error) {
            throw error
        }
        return {
            code: 404
        }
    }

    async findContentByID(id: string, host: string): Promise<ContentQueryResult> {
        try {
            const domain = await this.domainRepo.findOne({
                domain: host
            })




            var seoContent = await this.contentRepo.findById(id)
            if (seoContent == null) {
                return {
                    code: 404,

                }
            }

            let url = seoContent.url
            var redirect = await this.redirectRepo.getRedirectBySource(url, seoContent?._id)

            if (redirect != null) {
                if (redirect.external) {
                    return {
                        code: redirect.code,
                        url: redirect.to,
                        external: true
                    }
                }
                let redirectURL = ""
                if (redirect.toStatic) {
                    // var r = await this.contentRepo.getContentByUrl(redirect.to)
                    redirectURL = redirect.to
                }
                else {
                    var r = await this.contentRepo.getContentByUrl(redirect.to)
                    redirectURL = r?.url || ""
                }
                if (seoContent != null) {
                    return {
                        code: redirect.code,
                        data: seoContent,
                        url: redirectURL
                    }
                }
            }

            var seoContent = await this.contentRepo.getContentByUrl(url)

            if (seoContent != undefined) {
                // console.log("seoContent" , seoContent)
                // (seoContent as any)['header'] = {
                //     hello : "word"
                // }
                return {
                    code: 200,
                    data: seoContent
                }
            }


            else {
                var config404Enable = await this.systemConfigRepo.getConfigValue("404_redirect_enable")
                var config404 = await this.systemConfigRepo.getConfigValue("404_redirect")
                if (config404Enable) {
                    if ((config404.url as string).startsWith("/") || (config404.url as string) == "") {
                        return {
                            code: config404.code,
                            url: config404.url,
                            external: false
                        }
                    }
                    var seoContent = await this.contentRepo.getContentByUrl(config404)
                    if (seoContent != null) {
                        return {
                            code: config404.code,
                            data: seoContent,
                            url: config404.url
                        }
                    }
                }
            }
        }
        catch (error) {
            throw error
        }
        return {
            code: 404
        }
    }

    async findContentById(id: string, url: string) {
        try {
            var seoContent = await this.contentRepo.findById(id)
            if (seoContent != null)
                var redirect = await this.redirectRepo.getRedirectBySource(seoContent?.url, seoContent?._id)
            else
                var redirect = await this.redirectRepo.getRedirectBySource(url, undefined)

            if (redirect != null) {
                if (redirect.external) {
                    return {
                        code: redirect.code,
                        url: redirect.to,
                        external: true
                    }
                }
                var seoContent = await this.contentRepo.getContentByUrl(url)
                if (seoContent != null) {
                    return {
                        code: redirect.code,
                        data: seoContent,
                        url: redirect.to
                    }
                }
            }

            if (seoContent != undefined) {
                return {
                    code: 200,
                    data: seoContent
                }
            }


            else {
                var config404Enable = await this.systemConfigRepo.getConfigValue("404_redirect_enable")
                var config404 = await this.systemConfigRepo.getConfigValue("404_redirect")
                if (config404Enable) {
                    if ((config404.url as string).startsWith("/") || (config404.url as string) == "") {
                        return {
                            code: config404.code,
                            url: config404.url,
                            external: false
                        }
                    }
                    var seoContent = await this.contentRepo.getContentByUrl(config404)
                    if (seoContent != null) {
                        return {
                            code: config404.code,
                            data: seoContent,
                            url: config404.url
                        }
                    }
                }
            }
        }
        catch (error) {
            throw error
        }
        return {
            code: 404
        }
    }

    async getLinksByTags(
        @Body({
            destination: "tags",
            schema: z.array(z.string())
        }) tags: string[]
    ) {
        try {
            let result: any = {}
            // console.log(new Date())
            let data: any = await this.linkTagRepo.getLinksByTags(tags)
            for (let i = 0; i < data.length; i++) {
                try {
                    result[data[i].tag] = data[i].link.url
                } catch (error) {

                }

            }
            return result
        } catch (error) {

        }
        return {}
    }

    initApis(): void {
        this.addRoute("/", "get", this.getContent.bind(this))
    }
}
