"use client";
import Link from "next/link";
import {useEffect,useState,type FormEvent} from "react";
import {foodText,useFoodLanguage} from "@/lib/food-translations";

type Message={id:number;from:"guide"|"you";text:string};
const quickReplies=[
 {label:"Menu and prices",text:"Browse the available meals and prices on the Store. Lesedi updates availability there.",href:"/#menu"},
 {label:"Custom order",text:"Tell Lesedi what you'd like. Custom requests are sent for review; price and availability are confirmed by Lesedi.",href:"/?order=1&custom=1"},
 {label:"Collection or delivery",text:"Choose collection or delivery in the order form, then select a requested date and time. Your request is not confirmed until Lesedi reviews it.",href:"/?order=1"},
 {label:"Xmas Special",text:"The Store announcement says to ask about Xmas Special discounts. Ask Lesedi in Messages to confirm what is available.",href:"/account?tab=messages"},
 {label:"My order or a person",text:"Open My Luvie's Foods, then Messages to contact Lesedi about your saved request.",href:"/account?tab=messages"}
];
export default function FoodCustomerHelper(){
 const {language,t}=useFoodLanguage();
 const welcome=foodText(language,"Dumela! I can help you find the menu, start a custom request, understand collection and delivery, or reach Lesedi. I'm an automated guide, not a person.");
 const[open,setOpen]=useState(false);
 const[input,setInput]=useState("");
 const[messages,setMessages]=useState<Message[]>([]);
 useEffect(()=>{setMessages((current):Message[]=>current.length===0?[{id:1,from:"guide",text:welcome}]:current.map((message,index)=>index===0&&message.id===1?{...message,text:welcome}:message))},[welcome]);
 function answer(question:string,displayQuestion=question){
  const q=question.toLowerCase();
  const item=/xmas|christmas|special|discount|keresemose|theolelo/.test(q)?quickReplies[3]:
   /custom|special meal|not on menu|something else|kopo|kgethegileng/.test(q)?quickReplies[1]:
   /delivery|collect|pickup|pick up|time|when|go tlisiwa|go tsaya|nako|leng/.test(q)?quickReplies[2]:
   /message|lesedi|person|help|order status|my order|track|molaetsa|thuso|seemo/.test(q)?quickReplies[4]:
   /menu|price|meal|food|chicken|beef|rice|tlhwatlhwa|dijo|kgogo|raese/.test(q)?quickReplies[0]:null;
  const reply=item?t(item.text):t("I can help with the Store menu, custom requests, collection or delivery, the Xmas Special announcement, and contacting Lesedi. Choose a shortcut below or open Messages for a personal reply.");
  setMessages((current):Message[]=>[...current,{id:Date.now(),from:"you" as const,text:displayQuestion},{id:Date.now()+1,from:"guide" as const,text:reply}].slice(-8));
 }
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const value=input.trim();if(!value)return;setInput("");answer(value)}
 return <div className="lf-customer-helper">
  {open&&<section className="lf-customer-helper-panel" role="dialog" aria-modal="false" aria-labelledby="lf-customer-helper-title">
   <header><div><small>LUVIE&apos;S FOODS · {t("CUSTOMER HELP")}</small><strong id="lf-customer-helper-title">{t("Need a hand?")}</strong></div><button type="button" aria-label={t("Close help")} onClick={()=>setOpen(false)}>×</button></header>
   <div className="lf-customer-helper-thread" aria-live="polite">{messages.map(message=><p key={message.id} className={message.from}>{message.text}</p>)}</div>
   <div className="lf-customer-helper-shortcuts">{quickReplies.map(item=><Link key={item.label} href={item.href} onClick={()=>answer(item.label,t(item.label))}>{t(item.label)}</Link>)}</div>
   <form onSubmit={submit}><input value={input} onChange={event=>setInput(event.target.value)} placeholder={t("Ask about food or your order…")} aria-label={t("Ask Luvie's Foods customer help")} maxLength={240}/><button type="submit" disabled={!input.trim()}>{t("Send")}</button></form>
   <p className="lf-customer-helper-footnote">{t("Automated guidance · For a personal response,")} <Link href="/account?tab=messages">{t("message Lesedi")}</Link>.</p>
  </section>}
  <button type="button" className="lf-customer-helper-launcher" aria-expanded={open} aria-haspopup="dialog" onClick={()=>setOpen(value=>!value)}>{open?t("Close help"):t("Need a hand?")+" ♥"}</button>
 </div>;
}
