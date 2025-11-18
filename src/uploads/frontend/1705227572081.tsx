"use client"

import './ham1.css';
import Link from 'next/link';
import Image from 'next/image';
// import fs from "fs"

import React, { useState } from 'react';
// import { DataMap } from '@/app/layout';




export default function Ham1(data: any) {

    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };




    const [isOpenSub, setIsOpenSub] = useState<{ [key: string]: boolean }>({});
    const toggleSubMenu = (itemId: any) => {
        setIsOpenSub((prevSub) => ({
            ...prevSub,
            [itemId]: !prevSub[itemId],
        }));
    };

   



    return (
        <>
            <button type="button" className={`btn_ham t1 SJM ${isOpen ? 'a' : ''}`} aria-label="hamberger" onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
            </button>

            <div className={`ham t1 SJM ${isOpen ? 'a' : ''}`}>
                <ul className="mai">
                    {data.list.map((item: any, i: any) => (

                        <li className={`it ${item.layer2 && item.layer2.length > 0 ? 'is_s' : ''}`} key={i}>

                            {item.link === null ? (
                                <button type="button" onClick={() => toggleSubMenu(`item${i}`)}>

                                    {item.title}

                                    {item.label && (

                                        <>
                                            {item.label.src !== '' && item.label.type === "image" && (
                                                <span className="lab t2">
                                                    <Image width={29} height={18} src={item.label.src} alt={item.label.alt} />
                                                </span>
                                            )}
                                            {item.label.type === "text" && item.label.text !== "" && (
                                                <span className="lab t1 a">{item.label.text}</span>
                                            )}
                                            {item.label.type === "font_icon" && item.label.font_icon !== "" && (
                                                <span className="lab t3 a"><i className={`fa ${item.label.font_icon}`}></i></span>
                                            )}
                                        </>

                                    )}
                                </button>
                            ) : (

                                <a href={item.link}>

                                    {item.title}

                                    {item.label && (
                                        <>
                                            {item.label.src !== '' && item.label.type === "image" && (
                                                <span className="lab t2">
                                                    <Image width={29} height={18} src={item.label.src} alt={item.label.alt} />
                                                </span>
                                            )}
                                            {item.label.type === "text" && item.label.text !== "" && (
                                                <span className="lab t1 a">{item.label.text}</span>
                                            )}
                                            {item.label.type === "font_icon" && item.label.font_icon !== "" && (
                                                <span className="lab t3 a"><i className={`fa ${item.label.font_icon}`}></i></span>
                                            )}
                                        </>
                                    )}
                                </a>

                            )}



                            {item.isChild && (
                                <>

                                    <i className="fa fa-angle-down"></i>
                                    <ul className={`item${i}${isOpenSub[`item${i}`] ? ' a' : ''}`}>


                                        {item.layer2.map((item1: any, ii: number) => (

                                            <li className={`it ${item1.isChild ? 'is_s' : ''}`} key={ii}>



                                                {item1.link === "" ? (
                                                    <button type="button" onClick={() => toggleSubMenu(`item${ii + 1}`)}>

                                                        {item1.title}

                                                        {item1.label && (
                                                            <>
                                                                {item1.label.src !== '' && item1.label.type === "image" && (
                                                                    <span className="lab t2">
                                                                        <Image width={29} height={18} src={item1.label.src} alt={item1.label.alt} />
                                                                    </span>
                                                                )}
                                                                {item1.label.type === "text" && item1.label.text !== "" && (
                                                                    <span className="lab t1 a">{item1.label.text}</span>
                                                                )}
                                                                {item1.label.type === "font_icon" && item1.label.font_icon !== "" && (
                                                                    <span className="lab t3 a"><i className={`fa ${item1.label.font_icon}`}></i></span>
                                                                )}
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (

                                                    <a href={item1.link}>

                                                        {item1.title}

                                                        {item1.label && (
                                                            <>
                                                                {item1.label.src !== '' && item1.label.type === "image" && (
                                                                    <span className="lab t2">
                                                                        <Image width={29} height={18} src={item1.label.src} alt={item1.label.alt} />
                                                                    </span>
                                                                )}
                                                                {item1.label.type === "text" && item1.label.text !== "" && (
                                                                    <span className="lab t1 a">{item1.label.text}</span>
                                                                )}
                                                                {item1.label.type === "font_icon" && item1.label.font_icon !== "" && (
                                                                    <span className="lab t3 a"><i className={`fa ${item1.label.font_icon}`}></i></span>
                                                                )}
                                                            </>
                                                        )}
                                                    </a>

                                                )}



                                                {item1.isChild && (
                                                    <>
                                                        <i className="fa fa-angle-down"></i>


                                                        <ul className={`item${ii + 1}${isOpenSub[`item${ii + 1}`] ? ' a' : ''}`}>

                                                            {item1.layer3 && item1.layer3.map((item2: any, iii: number) => (
                                                                <li className="it " key={iii}>
                                                                    <Link className="" href={item2.link}>{item2.title}</Link>
                                                                </li>
                                                            ))}

                                                        </ul>
                                                    </>
                                                )}
                                            </li>
                                        ))}

                                    </ul>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

        </>
    )

}