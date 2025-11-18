import "./mega1.css";
import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Mega1(data : any) {

    // console.log(data

    return (

        <li className="std mega mega1">



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
            <div className={`C std_w ${data.background?.color?'bg_lr': ''} ${data.border_item?.class_name?'bor_lr': ''}`}>
                {data.background?.src && (
                    <div className="bg" style={{ backgroundImage: `url(${data.background?.src})` }}></div>
                )}

            {
            data.layer.map((column:any, i:any) => (
                
                <div className="it" key={i}>

                    <div className={`h ${column[`column${i}`].isBorderBottom ? 'bor_b' : ''}`}>{column[`column${i}`].title}</div>

                    {column[`column${i}`].items.map((item:any, itemIndex:any) => (
                        
                        <Link key={itemIndex} className={`${item[`tem${itemIndex + 1}`].name_tem}`} href={item[`tem${itemIndex + 1}`].link}>
                    
                           
                                <div className="pic">
                                {item[`tem${itemIndex + 1}`].type === "image" && item[`tem${itemIndex + 1}`].src !== "" && (
                                    <Image
                                        className=""
                                        width={item[`tem${itemIndex + 1}`].size_img.width}
                                        height={item[`tem${itemIndex + 1}`].size_img.height}
                                        src={item[`tem${itemIndex + 1}`].src}
                                        alt={item[`tem${itemIndex + 1}`].alt}
                                    />
                                )}
                                {item[`tem${itemIndex + 1}`].type === "font_icon" && item[`tem${itemIndex + 1}`].font_icon !== "" && (
                                    <i className={`fa ${item[`tem${itemIndex + 1}`].font_icon}`}></i>
                                )}
                           
                                </div>
                           






                            <div className="tex">
                                {item[`tem${itemIndex + 1}`].title && (
                                    <div className="tit">{item[`tem${itemIndex + 1}`].title}</div>
                                )}
                                {item[`tem${itemIndex + 1}`].abstract && (
                                    <span>{item[`tem${itemIndex + 1}`].abstract}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ))}
        
            </div>
        </li>
    )
}