"use client";
/* eslint-disable react/no-unescaped-entities -- Luvie's Foods brand copy uses natural apostrophes. */
import Link from "next/link";
import {useEffect,useState,type FormEvent} from "react";
import {GoogleAuthProvider,linkWithPopup,onAuthStateChanged,signInAnonymously,signInWithPopup,type User} from "firebase/auth";
import {auth} from "@/lib/firebase/client";
import FoodCustomerMessages from "@/components/FoodCustomerMessages";
import FoodLanguageSwitcher from "@/components/FoodLanguageSwitcher";
import {useFoodLanguage} from "@/lib/food-translations";
import {getCustomerProfile,saveCustomerProfile,subscribeToCustomerOrders,getMenuItems,type CustomerProfile,type FoodOrder,type MenuItem} from "@/lib/firebase/data";

const money=(amount:number)=>"P"+amount.toFixed(2);
const isCustomOrder=(order:FoodOrder)=>order.items.some(item=>item.name.startsWith("Custom order request:"))||order.instructions.startsWith("CUSTOM ORDER ·");
const itemUnitPrice=(item:MenuItem,quantity:number)=>item.friendPrice!==undefined&&quantity>=2?item.friendPrice:item.price;
const dateTime=(value:string)=>{try{return new Intl.DateTimeFormat("en-BW",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}catch{return value}};
const statusCopy:Record<string,string>={New:"Received · waiting for Lesedi to review",Accepted:"Accepted · your order is being arranged",Preparing:"Being prepared",Ready:"Ready for collection",Delivering:"On the way",Collected:"Collected",Delivered:"Delivered",Cancelled:"Cancelled"};

export default function AccountPage(){
 const[user,setUser]=useState<User|null>(null);
 const[profile,setProfile]=useState<CustomerProfile|null>(null);
 const[orders,setOrders]=useState<FoodOrder[]>([]);
 const[ready,setReady]=useState(false);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState("");
 const[tab,setTab]=useState<"requests"|"messages"|"receipts"|"rewards"|"details">("requests");
 const[selectedRequest,setSelectedRequest]=useState<{id:string;quantity:number}[]>([]);
 const[selectedMenu,setSelectedMenu]=useState<MenuItem[]>([]);
 const[customDraft,setCustomDraft]=useState("");

 useEffect(()=>{try{const draft=window.localStorage.getItem("luvies-foods-custom-request-draft");if(draft){const parsed=JSON.parse(draft) as {description?:string};setCustomDraft(parsed.description??"")}}catch(error){console.warn("Luvie’s Foods request draft unavailable",error)}},[]);

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  if(params.get("tab")==="messages")setTab("messages");
  if(params.get("request")!=="1")return;
  const parsed=(params.get("items")??"").split(",").map(part=>{const [id,quantity]=part.split(":");return{id,quantity:Number(quantity)}}).filter(item=>item.id&&Number.isInteger(item.quantity)&&item.quantity>0&&item.quantity<=50);
  setSelectedRequest(parsed);
  void getMenuItems().then(setSelectedMenu).catch(()=>setSelectedMenu([]));
 },[]);

 useEffect(()=>{
  let disposed=false;
  let stopOrders=()=>{};
  const stopAuth=onAuthStateChanged(auth,async current=>{
   if(!current){
    try{await signInAnonymously(auth)}catch{
     if(!disposed){setMessage("We couldn't restore your customer space. Check your connection and try again.");setReady(true)}
    }
    return;
   }
   if(disposed)return;
   setUser(current);
   try{
    const saved=await getCustomerProfile(current.uid);
    if(disposed)return;
    setProfile(saved??{uid:current.uid,name:current.displayName??"",email:current.email??"",phone:"",preferredDeliveryLocation:"",notes:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    stopOrders=subscribeToCustomerOrders(current.uid,setOrders,error=>setMessage(error.message));
   }catch{
    if(!disposed)setMessage("Your saved details are temporarily unavailable. Your order history will retry when the connection returns.");
   }finally{if(!disposed)setReady(true)}
  });
  return()=>{disposed=true;stopAuth();stopOrders()};
 },[]);

 async function connectGoogle(){
  if(!user||!user.isAnonymous||busy)return;
  setBusy(true);setMessage("");
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  try{
   const credential=await linkWithPopup(user,provider);
   const linked=credential.user;
   const next={...(profile??{uid:linked.uid,name:"",email:"",phone:"",preferredDeliveryLocation:"",notes:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}),uid:linked.uid,email:linked.email??"",name:profile?.name||linked.displayName||"",updatedAt:new Date().toISOString()};
   await saveCustomerProfile(next);
   setUser(linked);setProfile(next);
   setMessage("Google sign-in is connected. Use this same Google account to return to your Luvie's Foods history on another device.");
  }catch(error){
   const code=typeof error==="object"&&error!==null&&"code" in error?String((error as {code?:unknown}).code):"";
   if(code==="auth/credential-already-in-use"||code==="auth/email-already-in-use")setMessage("That Google account is already connected to another Firebase account. We haven't switched accounts or moved your orders, so your current order history stays safe.");
   else if(code==="auth/popup-closed-by-user")setMessage("Google sign-in was cancelled. Your current customer space is unchanged.");
   else setMessage("Google sign-in could not be connected. Check that Google is enabled in Firebase Authentication and try again.");
  }finally{setBusy(false)}
 }

 async function signInGoogle(){
  if(busy)return;
  setBusy(true);setMessage("");
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  try{
   const credential=await signInWithPopup(auth,provider);
   setUser(credential.user);
   setMessage("You're signed in with Google. Your saved Luvie's Foods account is loading.");
  }catch(error){
   const code=typeof error==="object"&&error!==null&&"code" in error?String((error as {code?:unknown}).code):"";
   if(code==="auth/popup-closed-by-user")setMessage("Google sign-in was cancelled. Your current customer space is unchanged.");
   else setMessage("Google sign-in could not be completed. Check that Google is enabled in Firebase Authentication and try again.");
  }finally{setBusy(false)}
 }

 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!profile||busy)return;
  if(!profile.name.trim()||!profile.phone.trim()){setMessage("Add your name and phone number so Lesedi can follow up about your order.");return}
  setBusy(true);setMessage("");
  const next={...profile,name:profile.name.trim(),phone:profile.phone.trim(),preferredDeliveryLocation:profile.preferredDeliveryLocation.trim(),updatedAt:new Date().toISOString()};
  try{await saveCustomerProfile(next);setProfile(next);setMessage("Your details are saved with Luvie's Foods.")}
  catch{setMessage("We couldn't save your details. Check your connection and try again.")}
  finally{setBusy(false)}
 }

 const active=orders.filter(order=>!["Collected","Delivered","Cancelled"].includes(order.status));
 const greeting=profile?.name.trim().split(/\s+/)[0]||user?.displayName?.split(/\s+/)[0]||"there";
 const requestMeals=selectedRequest.map(entry=>({...entry,item:selectedMenu.find(item=>item.id===entry.id)})).filter(entry=>entry.item?.available);
 const requestTotal=requestMeals.reduce((sum,entry)=>sum+(entry.item?itemUnitPrice(entry.item,entry.quantity):0)*entry.quantity,0);
 const requestParam=requestMeals.map(entry=>entry.id+":"+entry.quantity).join(",");

 return <main className="lf-account-page">
  <div className="lf-account-topline"><span>MADE WITH LOVE · GABORONE</span><span>{t("YOUR CUSTOMER SPACE")}</span></div>
  <header className="lf-account-header">
   <Link href="/" className="lf-brand" aria-label="Luvie's Foods home"><span className="lf-mark">L<span>♥</span></span><span><strong>LUVIE'S FOODS</strong><small>GOOD FOOD, MADE WITH LOVE</small></span></Link>
   <nav><Link href="/#menu">{t("Explore menu")}</Link><Link className="lf-account-header-cta" href="/?order=1">{t("Order food")} <span>↗</span></Link><FoodLanguageSwitcher/></nav>
  </header>

  <div className="lf-account-wrap">
   <section className="lf-account-intro">
    <div><span className="lf-eyebrow">{t("YOUR ACCOUNT")}</span><h1>Dumela, {greeting}.</h1><p>{t("Your food requests, messages, receipts and rewards, together in one place.")}</p><button type="button" className="lf-account-view-details" onClick={()=>setTab("details")}>{t("View details")} ↗</button></div>
    <span className="lf-account-session"><i/> {user?.isAnonymous?"Customer space":"Signed in"}</span>
   </section>

   {customDraft.trim()&&<section className="lf-account-current-request" aria-label="Unfinished custom food request"><div><span className="lf-eyebrow">{t("YOUR UNFINISHED INQUIRY")}</span><h2>{t("Pick up where you left off.")}</h2><p>{t("Your custom food request is saved on this device. Your description will be waiting when you return to it.")}</p></div><div className="lf-account-request-items"><div><span>{customDraft}</span><strong>{t("Price on request")}</strong></div></div><div className="lf-account-request-bottom"><strong>{t("Not sent yet · Lesedi has not received this inquiry")}</strong><Link className="lf-account-primary" href="/?order=1&custom=1">{t("Continue your custom request")} <span>→</span></Link></div></section>}

   {selectedRequest.length>0&&<section className="lf-account-current-request" aria-labelledby="lf-current-request-title"><div><span className="lf-eyebrow">{t("YOUR SELECTION")}</span><h2 id="lf-current-request-title">Your food is ready.</h2><p>{t("We brought your selected meals here. Review them, then continue to the short request.")}</p></div><div className="lf-account-request-items">{requestMeals.map(entry=><div key={entry.id}><span>{entry.quantity} × {entry.item?.name}</span><strong>{money((entry.item?itemUnitPrice(entry.item,entry.quantity):0)*entry.quantity)}</strong></div>)}</div><div className="lf-account-request-bottom"><strong>{t("Estimated total ·")} {money(requestTotal)}</strong><Link className="lf-account-primary" href={"/?order=1&items="+encodeURIComponent(requestParam)}>Continue with {requestMeals.length} selected {requestMeals.length===1?"item":"items"} <span>→</span></Link></div>{requestMeals.length===0&&<p role="status">{t("Those meals are no longer available. Return to the Store to choose from the current menu.")}</p>}</section>}

   <section className="lf-account-summary" aria-label="Order summary">
    <div><span>{t("ACTIVE ORDERS")}</span><strong>{active.length}</strong><small>{t(active.length===1?"Order being handled":"Orders being handled")}</small></div>
    <div><span>{t("ALL ORDERS")}</span><strong>{orders.length}</strong><small>{t("Saved order history")}</small></div>
    <Link href="/?order=1">＋ {t("Start an order")} <span>↗</span></Link>
   </section>

   <nav className="lf-account-tabs" aria-label={t("Your account")}>
    <button type="button" aria-current={tab==="requests"?"page":undefined} className={tab==="requests"?"active":""} onClick={()=>setTab("requests")}>{t("Requests")} <span>{orders.length}</span></button>
    <button type="button" aria-current={tab==="messages"?"page":undefined} className={tab==="messages"?"active":""} onClick={()=>setTab("messages")}>{t("Messages")}</button>
    <button type="button" aria-current={tab==="receipts"?"page":undefined} className={tab==="receipts"?"active":""} onClick={()=>setTab("receipts")}>{t("Receipts")}</button>
    <button type="button" aria-current={tab==="rewards"?"page":undefined} className={tab==="rewards"?"active":""} onClick={()=>setTab("rewards")}>{t("Rewards")}</button>
   </nav>

   {!ready?<section className="lf-account-panel lf-account-loading" role="status"><span className="lf-account-spinner"/>{t("Restoring your customer space…")}</section>:tab==="requests"?<section className="lf-account-panel" role="tabpanel">
    <div className="lf-account-panel-head"><div><span className="lf-eyebrow">{t("YOUR FOOD JOURNEY")}</span><h2>{t("Order activity")}</h2></div><span>{orders.length} {t(orders.length===1?"order":"orders")}</span></div>
    {orders.length===0?<div className="lf-account-empty"><span className="lf-account-empty-mark">♥</span><h3>{t("Your next good meal starts here.")}</h3><p>{t("Once you place an order from the Store, its reference, items and latest status will appear here.")}</p><Link className="lf-account-primary" href="/#menu">{t("Browse today's menu")} <span>↗</span></Link></div>:<div className="lf-account-orders">{orders.map(order=><article className="lf-account-order" key={order.id}>
     <div className="lf-account-order-top"><div><span className="lf-account-order-ref">ORDER · {order.id.slice(0,8).toUpperCase()}</span><small>{dateTime(order.createdAt)}</small></div><strong className={"lf-order-status lf-order-status-"+order.status.toLowerCase()}>{order.status}</strong></div>
     <div className="lf-account-order-items">{order.items.map((item,index)=><div key={order.id+"-"+index}><span>{item.quantity} × {item.name}</span><strong>{isCustomOrder(order)?"Price on request":money(item.price*item.quantity)}</strong></div>)}</div>
     <div className="lf-account-order-bottom"><div><span>{order.mode==="delivery"?"Delivery":"Collection"} · {dateTime(order.scheduledFor)}</span><small>{statusCopy[order.status]??"Order status updated by Luvie's Foods"}</small>{order.mode==="delivery"&&order.deliveryLocation&&<small>{order.deliveryLocation}</small>}</div><strong>{isCustomOrder(order)?"Price on request":money(order.total)}</strong></div>
     {order.instructions&&<p className="lf-account-order-note">Your note: {order.instructions}</p>}
    </article>)}</div>}
   </section>:tab==="messages"?<FoodCustomerMessages uid={user?.uid??""}/>:tab==="receipts"?<section className="lf-account-panel" role="tabpanel"><div className="lf-account-panel-head"><div><span className="lf-eyebrow">{t("PAYMENT HISTORY")}</span><h2>{t("Receipts")}</h2></div><span>{t("Recorded payments")}</span></div>{orders.filter(order=>(order.paymentStatus==="paid"||order.paymentStatus==="partial")&&(order.amountPaid??0)>0).length===0?<div className="lf-account-empty"><span className="lf-account-empty-mark">♥</span><h3>{t("No receipts yet.")}</h3><p>{t("When Lesedi records a payment against one of your food requests, its payment record will appear here.")}</p></div>:<div className="lf-account-orders">{orders.filter(order=>(order.paymentStatus==="paid"||order.paymentStatus==="partial")&&(order.amountPaid??0)>0).map(order=><article className="lf-account-order" key={order.id}><div className="lf-account-order-top"><div><span className="lf-account-order-ref">PAYMENT RECORD · ORDER {order.id.slice(0,8).toUpperCase()}</span><small>{dateTime(order.createdAt)}</small></div><strong className="lf-order-status">{t(order.paymentStatus==="paid"?"Paid":"Part-paid")}</strong></div><div className="lf-account-order-bottom"><div><span>{t(order.paymentMethod==="etransfer"?"Electronic transfer":order.paymentMethod==="cash"?"Cash":order.paymentMethod==="other"?"Other":"Payment method not recorded")}</span><small>Food request · {order.items.map(item=>item.name).join(", ")}</small></div><strong>{money(order.amountPaid??0)}</strong></div><p className="lf-account-order-note">{t("Payment record for your reference. This is not a tax invoice.")}</p></article>)}</div>}</section>:tab==="rewards"?<section className="lf-account-panel" role="tabpanel"><div className="lf-account-panel-head"><div><span className="lf-eyebrow">{t("A LITTLE THANK-YOU")}</span><h2>{t("Rewards")}</h2></div><span>Luvie's Foods</span></div><div className="lf-account-empty"><span className="lf-account-empty-mark">♥</span><h3>{t("Your rewards live here.")}</h3><p>{t("Complete the eight-second race challenge to earn a 5% discount. Your reward will appear here once Lesedi has verified and recorded it against your account.")}</p><Link className="lf-account-primary" href="/#menu">{t("Back to Luvie's Foods")} <span>↗</span></Link></div></section>:<section className="lf-account-panel" role="tabpanel"><div className="lf-account-panel-head"><div><span className="lf-eyebrow">{t("READY FOR NEXT TIME")}</span><h2>{t("Your details")}</h2></div><span>{t("Private customer profile")}</span></div>
    {user?.isAnonymous?<div className="lf-account-google-link"><div><strong>{t("Keep your food journey with you.")}</strong><small>{t("Connect Google to this customer account to keep its existing orders and details together. Already linked on another device? Sign in with that Google account below; any separate guest session on this device will remain separate.")}</small></div><button className="lf-account-primary" type="button" onClick={()=>void connectGoogle()} disabled={busy}>{busy?t("Connecting…"):t("Connect Google account")}</button><button className="lf-account-google-secondary" type="button" onClick={()=>void signInGoogle()} disabled={busy}>{t("Already connected? Sign in with Google")}</button></div>:user?.providerData.some(provider=>provider.providerId==="google.com")?<p className="lf-account-message">Google sign-in connected · {user.email}</p>:null}
    {profile&&<form className="lf-account-form" onSubmit={save}>
     <label>{t("Your name")}<input value={profile.name} onChange={event=>setProfile({...profile,name:event.target.value})} autoComplete="name" required/></label>
     <label>{t("Phone number")}<input type="tel" value={profile.phone} onChange={event=>setProfile({...profile,phone:event.target.value})} autoComplete="tel" required/></label>
     <label className="lf-account-field-wide">{t("Delivery location or landmark")}<input value={profile.preferredDeliveryLocation} onChange={event=>setProfile({...profile,preferredDeliveryLocation:event.target.value})} autoComplete="street-address" placeholder={t("Add your area or a nearby landmark")}/></label>
     <button className="lf-account-primary" type="submit" disabled={busy}>{busy?t("Saving your details…"):t("Save my details")} <span>↗</span></button>
    </form>}
   </section>}

   {message&&<p className="lf-account-message" role="status">{message}</p>}
   <p className="lf-account-footnote">Your orders and customer details are saved to your Luvie's Foods account. An order is only confirmed as received when the order submission says it has been saved; a pending offline save has not reached the kitchen yet.</p>
  </div>

  <footer className="lf-account-footer"><Link href="/">LUVIE'S FOODS <span>♥</span></Link><span>{t("Good food, made with love.")}</span><Link href="/">{t("Back to Store")} ↗</Link></footer>
 </main>;
}
