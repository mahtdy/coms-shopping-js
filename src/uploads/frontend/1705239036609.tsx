import Link from "next/link";
import "./nav.css";
// import Mega1 from "./Mega1";

// type ComponentType = "Mega1" | "Mega2" | "Abshari";

var components: Record<string, JSX.Element> = {
};

interface NavItem {
    title: string;
    link: string;
    component: {
        name : string
    } | null;
}



export default function Nav(data : any) {
    // const data: { list: NavItem[] } =
    // {
    //     list:
    //         [
    //             {
    //                 title: "خانه",
    //                 link: '/',
    //                 component: null,
    //             },
    //             {
    //                 title: '',
    //                 link: '',
    //                 component: 'Abshari',
    //             },
    //             {
    //                 title: "فیلم ها",
    //                 link: '/video',
    //                 component: null,
    //             },
    //             {
    //                 title: "",
    //                 link: '',
    //                 component: 'Mega2',
    //             },
    //             {
    //                 title: "تماس با ما",
    //                 link: '/contact-us',
    //                 component: null,
    //             },
    //             {
    //                 title: "",
    //                 link: '',
    //                 component: "ham1",
    //             }
    //         ]

    // }

    data = data.data
    return (

        <ul className="h_nav fl2 g20 SJD">
            {data.list.map((nav: NavItem, i: number) => (
                <React.Fragment key={i}>

                    {nav.component ? <React.Fragment key={i}>{components[nav.component.name]}</React.Fragment> : <li className="std"><Link href={nav.link}>{nav.title}</Link></li>}

                </React.Fragment>
            ))}
        </ul>
    )
}


components[""]