"use client";
/* eslint-disable react/no-unescaped-entities -- Brand and announcement copy use natural apostrophes. */
import Link from "next/link";
import {useEffect,useState} from "react";
import {subscribeToMenuItems,subscribeToBusinessSettings,DEFAULT_ANNOUNCEMENT,type MenuItem,type BusinessSettings} from "@/lib/firebase/data";
import OrderForm from "@/app/order/order-form";

const foodFallbacks=[
 "https://images.bolt.eu/store/2025/2025-09-05/f50f2745-e417-46ea-922e-edb49e5a72ee.jpeg",
 "https://ivebeen.cooking/_next/image?q=75&url=https%3A%2F%2Ffiles.ivebeen.cooking%2Fimages%2Fkansiye%2Ftmpkk5ghuno.jpeg&w=640"
];
function formatElapsed(milliseconds:number){const total=Math.max(0,Math.floor(milliseconds/1000));const days=Math.floor(total/86400);const hours=Math.floor((total%86400)/3600);const minutes=Math.floor((total%3600)/60);const seconds=total%60;const hh=String(hours).padStart(2,'0');const mm=String(minutes).padStart(2,'0');const ss=String(seconds).padStart(2,'0');return days>0?days+'d '+hh+'h '+mm+'m':hh+':'+mm+':'+ss;}

export default function FoodStorefront(){
 const [items,setItems]=useState<MenuItem[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[orderOpen,setOrderOpen]=useState(false),[settings,setSettings]=useState<BusinessSettings|null>(null);
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{const publishedAt=settings?.menuPublishedAt;if(!publishedAt)return;const start=new Date(publishedAt).getTime();if(!Number.isFinite(start))return;const tick=()=>setElapsed(Math.max(0,Date.now()-start));tick();const interval=window.setInterval(tick,1000);return()=>window.clearInterval(interval)},[settings?.menuPublishedAt]);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get("order")==="1")setOrderOpen(true)},[]);
 useEffect(()=>{
  const stopMenu=subscribeToMenuItems(next=>{setItems(next);setLoaded(true)},e=>{setError(e.message);setLoaded(true)});
  const stopSettings=subscribeToBusinessSettings(next=>setSettings(next),()=>{});
  return()=>{stopMenu();stopSettings()};
 },[]);
 const available=items.filter(item=>item.available).sort((a,b)=>a.sortOrder-b.sortOrder);
 const announcementEnabled=settings?.announcementEnabled!==false;
 const announcementText=(settings?.announcementText??DEFAULT_ANNOUNCEMENT.text).trim();
 const announcementImage=settings?.announcementImageUrl??DEFAULT_ANNOUNCEMENT.imageUrl;
 function closeOrder(){setOrderOpen(false);if(typeof window!=="undefined"&&window.location.search.includes("order=1"))window.history.replaceState(null,"",window.location.pathname)}
 const menuSignal=!loaded?"Today's menu is loading":available.length===0?"Menu updates from Lesedi · Check back soon":available.length+" meal"+(available.length===1?"":"s")+" available to order";
 return <main className="lf-store">
  <div className="lf-topline"><span>MADE WITH LOVE · GABORONE</span><span>GOOD FOOD, GOOD MOOD</span></div>
  <header className="lf-header">
   <Link href="/" className="lf-brand" aria-label="Luvie's Foods home"><span className="lf-mark">L<span>♥</span></span><span><strong>LUVIE'S FOODS</strong><small>GOOD FOOD, MADE WITH LOVE</small></span></Link>
   <nav><Link href="/account">My account</Link></nav>
  </header>
  <section className="lf-hero">
   <div className="lf-hero-copy"><span className="lf-eyebrow">FRESHLY MADE · FULL OF LOVE</span><h1>Good food.<br/><em>Made with love.</em></h1><p>Comforting meals, made to bring a little more joy to your day.</p><div className="lf-hero-actions"><button type="button" className="lf-primary" onClick={()=>setOrderOpen(true)}>Order your meal <span>↗</span></button><a href="#menu" className="lf-secondary">Explore the menu</a></div><div className="lf-hero-note"><span>●</span> {menuSignal}</div></div>
   <div className="lf-hero-photo" role="img" aria-label="A freshly prepared rice and grilled chicken meal"><div className="lf-photo-caption"><small>MADE FRESH</small><strong>A little love in every plate.</strong></div></div>
   <div className="lf-hero-stamp">GOOD<br/>FOOD<br/><span>♥</span></div>
  </section>
  {announcementEnabled&&announcementText&&<section className="lf-announcement" aria-label="Business update"><div className="lf-announcement-copy"><span className="lf-eyebrow">BUSINESS UPDATE</span><strong>{announcementText}</strong></div>{announcementImage&&<img src={announcementImage} alt="Luvie's Foods announcement" loading="lazy"/>}</section>}
  <section className="lf-menu-section" id="menu">
   <div className="lf-section-head"><div><span className="lf-eyebrow">THE GOOD STUFF</span><h2>Today's menu<span>.</span></h2></div><span className="lf-count">{loaded?available.length+" available":"Menu loading"}</span></div>
   {error?<p className="lf-state" role="alert">The menu could not be loaded right now. Please try again shortly.</p>:!loaded?<p className="lf-state">Loading today's menu…</p>:available.length===0?<div className="lf-empty-feature"><div className="lf-empty-copy"><span className="lf-eyebrow">A LITTLE SOMETHING MADE JUST FOR YOU</span><h3>Not seeing your meal today?</h3><p>Lesedi is getting the next menu ready. Have a dish in mind? Open your account and keep your details close while we prepare the custom-order experience.</p><Link className="lf-custom-cta" href="/account">Open your account <span>↗</span></Link><small>Custom-order requests will be handled through your account in the next update.</small></div><div className="lf-menu-clock"><span className="lf-clock-label">TIME SINCE THE LAST MENU</span>{settings?.menuPublishedAt?<><strong>{formatElapsed(elapsed)}</strong><small>Since Lesedi last published a menu</small></>:<><strong className="lf-clock-pending">First menu pending</strong><small>The count-up begins when Lesedi publishes her first menu.</small></>}<span className="lf-clock-mark" aria-hidden="true">♥</span></div></div>:<div className="lf-menu-grid">{available.map((item,index)=><article className="lf-meal" key={item.id}>
    <div className="lf-meal-image" style={{backgroundImage:"url('"+(item.imageUrl||foodFallbacks[index%foodFallbacks.length])+"')"}}><span>LUVIE'S FOODS</span></div>
    <div className="lf-meal-info"><div><small>{item.category||"MADE WITH LOVE"}</small><h3>{item.name}</h3>{item.description&&<p>{item.description}</p>}</div><div className="lf-meal-bottom"><strong>P{item.price.toFixed(2)}</strong><button type="button" onClick={()=>setOrderOpen(true)}>Order <span>↗</span></button></div></div>
   </article>)}</div>}
  </section>
  <section className="lf-promise"><span>♥</span><div><strong>Good food, made with love.</strong><small>Choose your favourite, place your order, and we'll take care of the rest.</small></div><button type="button" onClick={()=>setOrderOpen(true)}>Let's eat ↗</button></section>
  <footer className="lf-footer"><Link href="/">LUVIE'S FOODS <span>♥</span></Link><span>GOOD FOOD, MADE WITH LOVE</span><Link href="/admin" aria-label="Owner Briefcase">💼 Briefcase</Link></footer>
  {orderOpen&&<OrderForm embedded onClose={closeOrder}/>}
 </main>;
}
