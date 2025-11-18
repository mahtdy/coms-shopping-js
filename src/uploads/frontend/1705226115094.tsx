"use client"
import "./mega2.css";
import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';

export default function Mega2(data: any) {
    const [activeTab, setActiveTab] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = (tabNumber: any) => {
        setActiveTab(tabNumber);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };


   




    return (

        <li className="std mega tab">
            <Link href={data.layer0.link}>

                {data.layer0.title}


                {data.layer0.label && (

                    <>
                        {data.layer0.label.src !== '' && data.layer0.label.type === "image" && (
                            <span className="lab t2 a">
                                <Image width={35} height={20} src={`${data.layer0.label.src}`} alt={`${data.layer0.label.alt}`} />
                            </span>
                        )}
                        {data.layer0.label.type === "text" && data.layer0.label.text !== "" && (
                            <span className="lab t1 a">{data.layer0.label.text}</span>
                        )}
                        {data.layer0.label.type === "font_icon" && data.layer0.label.font_icon !== "" && (
                            <span className="lab t3 a"><i className={`fa ${data.layer0.label.font_icon}`}></i></span>
                        )}
                    </>
                )}


            </Link>
            <div className="C std_w">
                <div className="on_tab">
                   { data.layer.map((tab:any, i:any) => (

                        <div className={`it ${activeTab === i ? 'a' : ''}`} key={i} onMouseEnter={() => handleMouseEnter(i)} onMouseLeave={handleMouseLeave}>
                            
                            {tab[`tab${i}`] && tab[`tab${i}`].type &&(
                               <>
                              
                                   <div className="pic">
                                     
                                       {tab[`tab${i}`].type === "image" && tab[`tab${i}`].src !== "" && (
                                           <Image
                                               width={28} height={28}
                                               src={tab[`tab${i}`].src}
                                               alt={tab[`tab${i}`].alt}
                                           />
                                       )}
                                       {tab[`tab${i}`].type === "font_icon" && tab[`tab${i}`].font_icon !== "" && (
                                           <i className={`fa ${tab[`tab${i}`].font_icon}`}></i>
                                       )}

                                   </div>


                                   <Link href={tab[`tab${i}`].link}>{tab[`tab${i}`].title}</Link>
                                   <i className="fa fa-angle-left"></i>
                               </>
                                )
                            }
                        </div>
                    ))}

                </div>
                <div className="bod_tab" style={{ backgroundColor: data.background?.color }}>
                    
                    {data.layer.map((con_tab: any, i2: any) => (
                        <div className={`it ${activeTab === i2 ? 'a' : ''}`} key={i2}>
                            <div className="h">
                                {con_tab[`tab${i2}`] && con_tab[`tab${i2}`].tab_content && (
                                    <>
                                        <Link href={con_tab[`tab${i2}`].tab_content.link2}>
                                            {con_tab[`tab${i2}`].tab_content.title2}
                                        </Link>
                                        <i className="fa fa-angle-left"></i>
                                    </>
                                )}
                            </div>
                            <div className="lin">
                                {con_tab[`tab${i2}`]?.tab_content?.items.map(
                                    (con_tab_links: any, i3: any) => (
                                        <Link href={con_tab_links.link3} key={i3}>
                                            {con_tab_links.title3}
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </li>
    )
}