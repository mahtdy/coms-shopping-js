import "./Abshari.css";
import Link from "next/link";
import Image from "next/image";

export default function Abshari(data : any) {

  


    return (
        <li className="std abshari">
            {data.layer0.map((m0 : any, i0 :any) => (
                <Link href={m0.link} key={i0}>

                    {m0.title}

                    {m0.label.length > 0 && (
                       
                        <>
                            {m0.label[0].src !== '' && m0.label[0].type === "image"  && (
                                <span className="lab t2 a">
                                    <Image width={35} height={20} src={m0.label[0].src} alt={m0.label[0].alt} />
                                </span>
                            )}
                            {m0.label[0].type === "icon" && m0.label[0].text !== "" && (
                                <span className="lab t1 a">{m0.label[0].text}</span>
                            )}
                            {m0.label[0].type === "font" && m0.label[0].text !== "" && (
                                <span className="lab t3 a"><i className={`fa ${m0.label[0].text}`}></i></span>
                            )}
                        </>
                    )}
                </Link>
            ))
            }
            <div className="std_w">
                {data.layer1.map((m1 :any, i1 : any) => (
                    <div className="it" key={i1}>
                        <Link className={m1.isBorderBottom ? 'bor_b' : ''} href={m1.link}>
                            {m1.title}
                            {m1.label.length > 0 && (
                                <>
                                    {m1.label[0].type === "image" && m1.label[0].src !== "" && (
                                        <span className="lab t2">
                                            <Image width={29} height={18} src={m1.label[0].src} alt={m1.label[0].alt} />
                                        </span>
                                    )}
                                    {m1.label[0].type === "icon" && m1.label[0].text !== "" && (
                                        <span className="lab t1">{m1.label[0].text}</span>
                                    )}
                                </>
                            )}
                        </Link>
                        {m1.isChild && (
                            <>
                                <i className="fa fa-angle-left"></i>
                                <div className="std_w">
                                    {m1.layer2 && m1.layer2.map((m2 : any, i2:any) => (
                                        <div className="it" key={i2}>
                                            <Link className={m2.isBorderBottom ? 'bor_b' : ''} href={m2.link}>
                                                {m2.title}
                                                {m2.label.length > 0 && (
                                                    <>
                                                        {m2.label[0].type === "image" && m2.label[0].src !== "" && (
                                                            <span className="lab t2">
                                                                <Image width={29} height={18} src={m2.label[0].src} alt={m2.label[0].alt} />
                                                            </span>
                                                        )}
                                                        {m2.label[0].type === "icon" && m2.label[0].text !== "" && (
                                                            <span className="lab t1">{m2.label[0].text}</span>
                                                        )}
                                                    </>
                                                )}
                                            </Link>
                                            {m2.isChild && (
                                                <>
                                                    <i className="fa fa-angle-left"></i>
                                                    <div className="std_w">
                                                        {m2.layer3 && m2.layer3.map((m3 :any, i3 :any) => (
                                                            <div className="it" key={i3}>
                                                                <Link className={m3.isBorderBottom ? 'bor_b' : ''} href={m3.link}>
                                                                    {m3.title}
                                                                    {m3.label.length > 0 && (
                                                                        <>
                                                                            {m3.label[0].type === "image" && m3.label[0].src !== "" && (
                                                                                <span className="lab t2">
                                                                                    <Image width={29} height={18} src={m3.label[0].src} alt={m3.label[0].alt} />
                                                                                </span>
                                                                            )}
                                                                            {m3.label[0].type === "icon" && m3.label[0].text !== "" && (
                                                                                <span className="lab t1">{m3.label[0].text}</span>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Link>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </li>
    )
}