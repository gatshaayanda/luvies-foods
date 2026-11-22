"use client";
/* eslint-disable react/no-unescaped-entities -- Brand name and customer-facing copy contain natural apostrophes. */
import Link from "next/link";
import {useEffect,useState} from "react";
import {subscribeToMenuItems,type MenuItem} from "@/lib/firebase/data";
import OrderForm from "@/app/order/order-form";

const foodFallbacks=[
 "https://images.bolt.eu/store/2025/2025-09-05/f50f2745-e417-46ea-922e-edb49e5a72ee.jpeg",
 "https://ivebeen.cooking/_next/image?q=75&url=https%3A%2F%2Ffiles.ivebeen.cooking%2Fimages%2Fkansiye%2Ftmpkk5ghuno.jpeg&w=640"
];
export default function FoodStorefront(){
 const [items,setItems]=useState<MenuItem[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[orderOpen,setOrderOpen]=useState(false);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get("order")==="1")setOrderOpen(true)},[]);
 useEffect(()=>subscribeToMenuItems(next=>{setItems(next);setLoaded(true)},e=>{setError(e.message);setLoaded(true)}),[]);
 const available=items.filter(item=>item.available).sort((a,b)=>a.sortOrder-b.sortOrder);
 function closeOrder(){setOrderOpen(false);if(typeof window!=="undefined"&&window.location.search.includes("order=1"))window.history.replaceState(null,"",window.location.pathname)}
 return <main className="lf-store">
  <div className="lf-topline"><span>MADE WITH LOVE · GABORONE</span><span>GOOD FOOD, GOOD MOOD</span></div>
  <header className="lf-header">
   <Link href="/" className="lf-brand" aria-label="Luvie's Foods home"><span className="lf-mark">L<span>♥</span></span><span><strong>LUVIE'S FOODS</strong><small>GOOD FOOD, MADE WITH LOVE</small></span></Link>
   <nav><Link href="/account">My account</Link></nav>
  </header>
  <section className="lf-hero">
   <div className="lf-hero-copy"><span className="lf-eyebrow">FRESHLY MADE · FULL OF LOVE</span><h1>Good food.<br/><em>Made with love.</em></h1><p>Comforting meals, made to bring a little more joy to your day.</p><div className="lf-hero-actions"><button type="button" className="lf-primary" onClick={()=>setOrderOpen(true)}>Order your meal <span>↗</span></button><a href="#menu" className="lf-secondary">Explore the menu</a></div><div className="lf-hero-note"><span>●</span> Two favourites on the menu · P40 each</div></div>
   <div className="lf-hero-photo" role="img" aria-label="A freshly prepared rice and grilled chicken meal"><div className="lf-photo-caption"><small>MADE FRESH</small><strong>A little love in every plate.</strong></div></div>
   <div className="lf-hero-stamp">GOOD<br/>FOOD<br/><span>♥</span></div>
  </section>
  <section className="lf-menu-section" id="menu">
   <div className="lf-section-head"><div><span className="lf-eyebrow">THE GOOD STUFF</span><h2>Today&apos;s menu<span>.</span></h2></div><span className="lf-count">{loaded?available.length+" available":"Menu loading"}</span></div>
   {error?<p className="lf-state" role="alert">The menu could not be loaded right now. Please try again shortly.</p>:!loaded?<p className="lf-state">Loading today&apos;s menu…</p>:available.length===0?<div className="lf-empty"><strong>We’re preparing the menu.</strong><span>There are no published meals just yet. You can still create your account and be ready for the next menu.</span><Link href="/account">Open your account ↗</Link></div>:<div className="lf-menu-grid">{available.map((item,index)=><article className="lf-meal" key={item.id}>
    <div className="lf-meal-image" style={{backgroundImage:"url('"+(item.imageUrl||foodFallbacks[index%foodFallbacks.length])+"')"}}><span>LUVIE'S FOODS</span></div>
    <div className="lf-meal-info"><div><small>{item.category||"MADE WITH LOVE"}</small><h3>{item.name}</h3>{item.description&&<p>{item.description}</p>}</div><div className="lf-meal-bottom"><strong>P{item.price.toFixed(2)}</strong><button type="button" onClick={()=>setOrderOpen(true)}>Order <span>↗</span></button></div></div>
   </article>)}</div>}
  </section>
  <section className="lf-promise"><span>♥</span><div><strong>Good food, made with love.</strong><small>Choose your favourite, place your order, and we&apos;ll take care of the rest.</small></div><button type="button" onClick={()=>setOrderOpen(true)}>Let&apos;s eat ↗</button></section>
  <footer className="lf-footer"><Link href="/">LUVIE'S FOODS <span>♥</span></Link><span>GOOD FOOD, MADE WITH LOVE</span><Link href="/admin">💼 Briefcase</Link></footer>
 {orderOpen&&<OrderForm embedded onClose={closeOrder}/>}
 </main>;
}
