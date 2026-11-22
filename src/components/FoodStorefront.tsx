"use client";
/* eslint-disable react/no-unescaped-entities -- Brand and announcement copy use natural apostrophes. */
import Link from "next/link";
import {useEffect,useState} from "react";
import {subscribeToMenuItems,subscribeToBusinessSettings,DEFAULT_ANNOUNCEMENT,type MenuItem,type BusinessSettings} from "@/lib/firebase/data";
import OrderForm from "@/app/order/order-form";
import FoodCustomerHelper from "@/components/FoodCustomerHelper";
import FoodLanguageSwitcher from "@/components/FoodLanguageSwitcher";
import {useFoodLanguage} from "@/lib/food-translations";

const foodFallbacks=[
 "https://images.bolt.eu/store/2025/2025-09-05/f50f2745-e417-46ea-922e-edb49e5a72ee.jpeg",
 "https://ivebeen.cooking/_next/image?q=75&url=https%3A%2F%2Ffiles.ivebeen.cooking%2Fimages%2Fkansiye%2Ftmpkk5ghuno.jpeg&w=640"
];
export default function FoodStorefront(){
 const {t}=useFoodLanguage();
 const [items,setItems]=useState<MenuItem[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[orderOpen,setOrderOpen]=useState(false),[settings,setSettings]=useState<BusinessSettings|null>(null),[selection,setSelection]=useState<Record<string,number>>({});
 useEffect(()=>{if(new URLSearchParams(window.location.search).get("order")==="1")setOrderOpen(true)},[]);
 useEffect(()=>{
  const stopMenu=subscribeToMenuItems(next=>{setItems(next);setLoaded(true)},e=>{setError(e.message);setLoaded(true)});
  const stopSettings=subscribeToBusinessSettings(next=>setSettings(next),()=>{});
  return()=>{stopMenu();stopSettings()};
 },[]);
 const available=items.filter(item=>item.available).sort((a,b)=>a.sortOrder-b.sortOrder);
 const selectedItems=available.filter(item=>(selection[item.id]??0)>0);
 const selectedCount=selectedItems.reduce((sum,item)=>sum+(selection[item.id]??0),0);
 const selectedTotal=selectedItems.reduce((sum,item)=>sum+(item.friendPrice!==undefined&&(selection[item.id]??0)>=2?item.friendPrice:item.price)*(selection[item.id]??0),0);
 const selectedParam=selectedItems.map(item=>item.id+":"+(selection[item.id]??0)).join(",");
 function changeSelection(id:string,delta:number){setSelection(current=>({...current,[id]:Math.max(0,(current[id]??0)+delta)}))}
 const announcementEnabled=settings?.announcementEnabled!==false;
 const announcementText=(settings?.announcementText??DEFAULT_ANNOUNCEMENT.text).trim();
 const announcementImage=settings?.announcementImageUrl??DEFAULT_ANNOUNCEMENT.imageUrl;
 function closeOrder(){setOrderOpen(false);if(typeof window!=="undefined"&&window.location.search.includes("order=1"))window.history.replaceState(null,"",window.location.pathname)}
 const menuSignal=!loaded?t("Today's menu is loading"):available.length===0?t("Menu updates from Lesedi · Check back soon"):available.length+" "+t(available.length===1?"meal available to order":"meals available to order");
 return <main className="lf-store">
  <div className="lf-topline"><span>MADE WITH LOVE · GABORONE</span><span>{t("GOOD FOOD, GOOD MOOD")}</span></div>
  <header className="lf-header">
   <Link href="/" className="lf-brand" aria-label="Luvie's Foods home"><span className="lf-mark">L<span>♥</span></span><span><strong>LUVIE'S FOODS</strong><small>GOOD FOOD, MADE WITH LOVE</small></span></Link>
   <nav><Link href="/account">{t("My account")}</Link><FoodLanguageSwitcher/></nav>
  </header>
  <section className="lf-hero">
   <div className="lf-hero-copy"><span className="lf-eyebrow">{t("FRESHLY MADE · FULL OF LOVE")}</span><h1>{t("Good food.")}<br/><em>{t("Made with love.")}</em></h1><p>{t("Comforting meals, made to bring a little more joy to your day.")}</p><div className="lf-hero-actions"><a className="lf-primary" href="#menu">{t("Choose your food")} <span>↓</span></a><a href="#menu" className="lf-secondary">{t("Explore the menu")}</a></div><div className="lf-hero-note"><span>●</span> {menuSignal}</div></div>
   <div className="lf-hero-photo" role="img" aria-label="A freshly prepared rice and grilled chicken meal"><div className="lf-photo-caption"><small>{t("MADE FRESH")}</small><strong>{t("A little love in every plate.")}</strong></div></div>
   <div className="lf-hero-stamp">GOOD<br/>FOOD<br/><span>♥</span></div>
  </section>
  {announcementEnabled&&announcementText&&<section className="lf-announcement" aria-label="Business update"><div className="lf-announcement-copy"><span className="lf-eyebrow">{t("BUSINESS UPDATE")}</span><strong>{announcementText}</strong></div>{announcementImage&&<img src={announcementImage} alt="Luvie's Foods announcement" loading="lazy"/>}</section>}
  <section className="lf-menu-section" id="menu">
   <div className="lf-section-head"><div><span className="lf-eyebrow">{t("THE GOOD STUFF")}</span><h2>{t("Today's menu")}<span>.</span></h2></div><span className="lf-count">{loaded?available.length+" "+t("available"):"Menu loading"}</span></div>
   {error?<p className="lf-state" role="alert">{t("The menu could not be loaded right now. Please try again shortly.")}</p>:!loaded?<p className="lf-state">{t("Loading today's menu…")}</p>:available.length===0?<div className="lf-empty-feature"><div className="lf-empty-copy"><span className="lf-eyebrow">{t("A LITTLE SOMETHING MADE JUST FOR YOU")}</span><h3>{t("Not seeing your meal today?")}</h3><p>{t("There isn't a published menu to choose from right now. You can still tell Lesedi what you'd like, and she'll get back to you about availability, timing and price.")}</p><button type="button" className="lf-custom-cta" onClick={()=>{window.history.pushState(null,"","/?order=1&custom=1");setOrderOpen(true)}}>{t("Request a custom order")} <span>↗</span></button><small>{t("No account needed to send your request. No price is assumed until Lesedi confirms it.")}</small></div></div>:<div className="lf-menu-grid">{available.map((item,index)=><article className="lf-meal" key={item.id}>
    <div className="lf-meal-image" style={{backgroundImage:"url('"+(item.imageUrl||foodFallbacks[index%foodFallbacks.length])+"')"}}><span>LUVIE'S FOODS</span></div>
    <div className="lf-meal-info"><div><small>{item.category||"MADE WITH LOVE"}</small><h3>{item.name}</h3>{item.description&&<p>{item.description}</p>}</div><div className="lf-meal-bottom"><strong>P{item.price.toFixed(2)}</strong><div className="lf-meal-select">{(selection[item.id]??0)>0&&<button type="button" onClick={()=>changeSelection(item.id,-1)} aria-label={"Remove one "+item.name}>−</button>}<strong>{selection[item.id]??0}</strong><button type="button" onClick={()=>changeSelection(item.id,1)} aria-label={"Add one "+item.name}>{(selection[item.id]??0)>0?"+":t("Add")}</button></div></div></div>
   </article>)}</div>}
  </section>
  {selectedCount>0&&<div className="lf-selection-bar"><div><strong>{selectedCount} {t(selectedCount===1?"item":"items")} {t("selected")}</strong><small>{t("Estimated total")} · P{selectedTotal.toFixed(2)}</small></div><Link href={"/account?request=1&items="+encodeURIComponent(selectedParam)}>{t("Continue with selected food")} <span>↗</span></Link></div>}
  <section className="lf-promise"><span>♥</span><div><strong>{t("Good food, made with love.")}</strong><small>{t("Choose your favourite, place your order, and we'll take care of the rest.")}</small></div><a href="#menu" aria-label="Browse the menu and choose your food">{t("Let's eat")} ↗</a></section>
  <footer className="lf-footer"><Link href="/">LUVIE'S FOODS <span>♥</span></Link><span>GOOD FOOD, MADE WITH LOVE</span><a href="/admin" aria-label="Open the owner Briefcase">💼 Briefcase</a></footer>
  <FoodCustomerHelper/>
  {orderOpen&&<OrderForm embedded onClose={closeOrder}/>}
 </main>;
}
