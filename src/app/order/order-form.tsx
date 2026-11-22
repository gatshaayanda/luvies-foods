"use client";
/* eslint-disable react/no-unescaped-entities -- Customer-facing copy uses natural apostrophes. */
/* eslint-disable react/no-unescaped-entities -- Brand name and customer-facing copy contain natural apostrophes. */
import Link from "next/link";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {signInAnonymously,onAuthStateChanged,type User} from "firebase/auth";
import {createFoodOrder,getCustomerProfile,getMenuItems,readCachedMenuItems,saveCustomerProfile,type MenuItem} from "@/lib/firebase/data";
import {auth} from "@/lib/firebase/client";
function gaboroneDateKey(date=new Date()){const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Africa/Gaborone",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);return `${parts.find(p=>p.type==="year")?.value}-${parts.find(p=>p.type==="month")?.value}-${parts.find(p=>p.type==="day")?.value}`}
function weekdayForDate(dateKey:string){return new Intl.DateTimeFormat("en-US",{weekday:"long",timeZone:"Africa/Gaborone"}).format(new Date(`${dateKey}T12:00:00`))}
function orderUnitPrice(item:MenuItem,quantity:number){return item.friendPrice!==undefined&&quantity>=2?item.friendPrice:item.price}
function gaboroneNowDate(){return gaboroneDateKey()}function gaboroneNowTime(){const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";return `${get("hour")}:${get("minute")}`}
function gaboroneScheduledIso(value:string){return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)?value+":00+02:00":value}
export default function OrderForm({embedded=false,onClose}:{embedded?:boolean;onClose?:()=>void}){
 const today=gaboroneDateKey();
 const[menu,setMenu]=useState<MenuItem[]>([]),[menuLoaded,setMenuLoaded]=useState(false),[menuUnavailable,setMenuUnavailable]=useState(false);
 const[quantities,setQuantities]=useState<Record<string,number>>({}),[scheduledDate,setScheduledDate]=useState(""),[scheduledTime,setScheduledTime]=useState(""),[selectedDate,setSelectedDate]=useState(today);
 const[submitted,setSubmitted]=useState(false),[reference,setReference]=useState(""),[pendingSync,setPendingSync]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[user,setUser]=useState<User|null>(null),[step,setStep]=useState(1),[mode,setMode]=useState<"pickup"|"delivery">("pickup"),[deliveryLocation,setDeliveryLocation]=useState(""),[showInstructions,setShowInstructions]=useState(false),[customerName,setCustomerName]=useState(""),[customerPhone,setCustomerPhone]=useState(""),[instructions,setInstructions]=useState("");
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("date");if(requested&&/^\d{4}-\d{2}-\d{2}$/.test(requested)&&requested>=today){setSelectedDate(requested);setScheduledDate(requested)}} , [today]);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const entries=(params.get("items")??"").split(",").map(part=>{const [id,quantity]=part.split(":");return{id,quantity:Number(quantity)}}).filter(item=>item.id&&Number.isInteger(item.quantity)&&item.quantity>0&&item.quantity<=50);if(entries.length)setQuantities(Object.fromEntries(entries.map(item=>[item.id,item.quantity])));},[]);
 useEffect(()=>{const unsub=onAuthStateChanged(auth,async next=>{setUser(next);if(next){try{const profile=await getCustomerProfile(next.uid);if(profile){setDeliveryLocation(profile.preferredDeliveryLocation);setCustomerName(profile.name);setCustomerPhone(profile.phone);setInstructions(profile.notes)}}catch(error){console.warn("Luvie's Foods customer profile unavailable",error)}}});void getMenuItems().then(setMenu).catch(()=>{const cached=readCachedMenuItems();if(cached.length){setMenu(cached);setMenuUnavailable(false)}else setMenuUnavailable(true)}).finally(()=>setMenuLoaded(true));return unsub},[]);
 const visibleMenu=useMemo(()=>{const legacyToday=menu.filter(item=>item.available&&item.section==="deal"&&item.category.trim().toLowerCase()==="deal"&&!item.id.startsWith("deal-"));const daily=menu.filter(item=>item.available&&item.section==="daily"&&(item.days??[]).includes(weekdayForDate(selectedDate)));const deals=menu.filter(item=>item.available&&(item.section==="deal"||(!item.section&&item.category.toLowerCase()==="deal"))&&!legacyToday.some(service=>service.id===item.id));return [...daily,...(selectedDate===today?legacyToday:[]),...deals].filter((item,index,array)=>array.findIndex(candidate=>candidate.id===item.id)===index)},[menu,selectedDate,today]);

 const selected=useMemo(()=>menu.filter(item=>(quantities[item.id]??0)>0).map(item=>({...item,quantity:quantities[item.id]??0})),[menu,quantities]);
 const unavailableSelected=useMemo(()=>selected.filter(item=>!visibleMenu.some(availableItem=>availableItem.id===item.id)),[selected,visibleMenu]);
 const total=selected.filter(item=>!unavailableSelected.some(unavailable=>unavailable.id===item.id)).reduce((sum,item)=>sum+orderUnitPrice(item,item.quantity)*item.quantity,0);
 function change(id:string,delta:number){setQuantities(current=>({...current,[id]:Math.max(0,(current[id]??0)+delta)}))}
 function onScheduledDateChange(value:string){setScheduledDate(value);setSelectedDate(value)}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;if(!selected.length){setError(menuUnavailable||!visibleMenu.length?"No menu items are currently published for this date. Choose another published date or contact Luvie's Foods.":"Choose at least one food item.");return}if(unavailableSelected.length){setError("One or more selected items are not published for "+weekdayForDate(selectedDate)+". Remove them or choose a date when they are available.");return}setBusy(true);setError("");
  const form=new FormData(event.currentTarget),name=String(form.get("customerName")??"").trim(),phone=String(form.get("phone")??"").trim(),mode=String(form.get("mode")??"pickup") as "pickup"|"delivery",formDate=String(form.get("scheduledDate")??scheduledDate),formTime=String(form.get("scheduledTime")??scheduledTime),scheduledFor=gaboroneScheduledIso(formDate&&formTime?`${formDate}T${formTime}`:""),deliveryLocation=String(form.get("deliveryLocation")??"").trim(),instructions=String(form.get("instructions")??"").trim();
  if(!name||!phone||!formDate||!formTime||!scheduledFor){setError("Please choose the date and time you need the order.");setBusy(false);return}
  const scheduledMs=new Date(scheduledFor).getTime();if(!Number.isFinite(scheduledMs)||scheduledMs<Date.now()){setError("Choose a future time for your order.");setBusy(false);return}
  if(mode==="delivery"&&!deliveryLocation){setError("Add your delivery location or landmark.");setBusy(false);return}
  try{
   let customer=user;
   if(!customer)customer=(await signInAnonymously(auth)).user
   const order={customerId:customer.uid,createdAt:new Date().toISOString(),customerName:name,phone,mode,scheduledFor,deliveryLocation,instructions,items:selected.map(({name,price,friendPrice,quantity})=>({name,price:orderUnitPrice({name,price,friendPrice} as MenuItem,quantity),quantity})),total,status:"New" as const};
   const offline=!navigator.onLine;const{id,writePromise}=createFoodOrder(order);setReference(id);try{window.localStorage.setItem(`love-is-foods-order-${id}`,JSON.stringify({...order,id}));window.localStorage.setItem(`love-is-foods-pending-order-notification-${id}`,"1")}catch{}
   // Customer profile persistence is a convenience, never a reason to reject an order.
   // Firestore may deny/read-fail an empty profile while the order write itself is valid.
   if(offline){void writePromise.catch(console.error);setPendingSync(true)}else{await writePromise;setPendingSync(false);try{const idToken=await customer.getIdToken();const notificationResponse=await fetch("/api/notifications/order-created",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+idToken},body:JSON.stringify({orderId:id})});if(notificationResponse.ok)window.localStorage.removeItem(`love-is-foods-pending-order-notification-${id}`)}catch(notificationError){console.warn("Luvie's Foods new-order notification request failed",notificationError)}}
   if(customer){
    const now=new Date().toISOString();
    void getCustomerProfile(customer.uid)
      .catch(profileError=>{console.warn("Luvie's Foods customer profile read unavailable",profileError);return null})
      .then(existing=>{
       const profile={uid:customer.uid,name,email:customer.email??existing?.email??"",phone,preferredDeliveryLocation:deliveryLocation||existing?.preferredDeliveryLocation||"",notes:instructions||existing?.notes||"",createdAt:existing?.createdAt??now,updatedAt:now};
       return saveCustomerProfile(profile);
      })
      .catch(profileError=>console.warn("Luvie's Foods customer profile save unavailable",profileError));
   }
   setSubmitted(true);event.currentTarget.reset();
  }catch(error){console.error("Luvie's Foods order submission failed",error);setError("The order could not be confirmed online. Please check the connection and try again, or contact Luvie's Foods.")}finally{setBusy(false)}
 }
 if(submitted)return (
  <main className={embedded?"orderPage lf-order-overlay":"orderPage"}>
   <div className="orderWrap">
    <div className="orderCard confirm">{embedded&&<button type="button" className="lf-order-close" onClick={onClose} aria-label="Close order">×</button>}
     <div className="confirmIcon">🍔</div>
     <span className="kicker">{pendingSync?"SAVED ON THIS DEVICE":"REQUEST RECEIVED"}</span>
     <h1>{pendingSync?"Your request is waiting to sync.":"Your food request is in."}</h1>
     <p>{pendingSync?"Your order is waiting to synchronize. Reconnect this device so it can reach Luvie's Foods. Until then, the kitchen has not received it.":"Lesedi has received your food request and can review the selected meals, requested time and fulfilment details. This is not a confirmed order and no payment has been taken."}</p>
     <strong>Reference #{reference.slice(0,8).toUpperCase()}</strong>
     
     <div className="actions centered">
      <div>
       <p className="orderTruth"><strong>Your request is saved with Luvie's Foods.</strong> You can follow it from <Link href="/account">My Luvie's Foods</Link> when this guest session is available.</p>
      </div>
      <div>
       <Link className="button buttonLight" href="/account">My Luvie's Foods →</Link>
       <p className="orderTruth">Opens your private order history and activity feed.</p>
      </div>
      <div>
       <Link className="button buttonLight" href="/">Back to Luvie's Foods →</Link>
       <p className="orderTruth">Returns to the menu and deals. Your submitted request stays in the kitchen queue.</p>
      </div>
     </div>
    </div>
   </div>
  </main>
 );
 return <main className={embedded?"orderPage lf-order-overlay":"orderPage"}>
  <div className="orderWrap lf-request-wrap">
   <div className="orderHeader"><Link href="/" className="logo"><span className="logoMark">L♥</span><span>Luvie's Foods</span></Link><div className="actions"><Link href="/account" className="button buttonLight">My account</Link>{embedded&&<button type="button" className="button buttonLight" onClick={onClose}>Close</button>}</div></div>
   <div className="lf-request-intro"><span className="kicker">YOUR FOOD REQUEST · GUEST FIRST</span><h1>Let's get your food started.</h1><p>Your selected meals are ready. Three quick steps, then Lesedi can review your request.</p><div className="lf-request-progress" aria-label="Request progress">{[{n:1,label:"Your food"},{n:2,label:"When & how"},{n:3,label:"Your details"}].map(item=><span key={item.n} className={step===item.n?"active":step>item.n?"complete":""}><b>{step>item.n?"✓":item.n}</b>{item.label}</span>)}</div></div>
   <form onSubmit={submit} className="lf-request-form">
    <section className="orderCard lf-request-stage" hidden={step!==1}>
     <div className="lf-request-stage-head"><div><span className="kicker">01 · YOUR FOOD</span><h2>What would you like?</h2><p>We carried your selection forward. Change quantities if you need to.</p></div><strong>{selected.length} {selected.length===1?"item":"items"}</strong></div>
     {!menuLoaded?<div className="emptyState">Loading the current menu…</div>:visibleMenu.length?<div className="orderItems">{visibleMenu.map(item=>{const quantity=quantities[item.id]??0;const unitPrice=orderUnitPrice(item,quantity);return <article className="orderItem" key={item.id}><div><strong>{item.name}</strong><small>P{item.price.toFixed(item.price%1?2:0)}{item.friendPrice!==undefined?" · Bring-a-friend P"+item.friendPrice.toFixed(2):""}</small>{item.friendPrice!==undefined&&quantity>=2&&<small className="friendPriceActive">P{unitPrice.toFixed(2)} each with this quantity</small>}</div><div className="qty"><button type="button" onClick={()=>change(item.id,-1)} aria-label={"Remove one "+item.name}>−</button><strong>{quantity}</strong><button type="button" onClick={()=>change(item.id,1)} aria-label={"Add one "+item.name}>+</button></div></article>})}</div>:<div className="emptyState">{menuUnavailable?"The menu could not be loaded.":"No meals are published for this date."}</div>}
     {selected.length>0&&<div className="orderSelectionSummary"><strong>Selected for your request</strong>{selected.map(item=><div className={unavailableSelected.some(candidate=>candidate.id===item.id)?"selectionUnavailable":"selectionLine"} key={item.id}><span>{item.quantity} × {item.name}</span><strong>{unavailableSelected.some(candidate=>candidate.id===item.id)?"Unavailable":"P"+(orderUnitPrice(item,item.quantity)*item.quantity).toFixed(2)}</strong></div>)}</div>}
     <div className="total"><span>Estimated total</span><strong>P{total.toFixed(2)}</strong></div>
     {error&&<p role="alert" className="notice">{error}</p>}
     <button type="button" className="button buttonPrimary lf-request-next" disabled={!selected.length||unavailableSelected.length>0||!menuLoaded} onClick={()=>{setError("");setStep(2)}}>Continue to date & fulfilment →</button>
    </section>
    <section className="orderCard lf-request-stage" hidden={step!==2}>
     <span className="kicker">02 · WHEN & HOW</span><h2>When would you like your food?</h2><p className="orderTruth">Your requested date and preferred time are reviewed by Lesedi before confirmation.</p>
     <div className="fieldGrid"><label>Requested date<input name="scheduledDate" type="date" min={gaboroneNowDate()} value={scheduledDate} onChange={event=>onScheduledDateChange(event.target.value)} required/></label><label>Preferred time<input name="scheduledTime" type="time" min={scheduledDate===today?gaboroneNowTime():undefined} value={scheduledTime} onChange={event=>setScheduledTime(event.target.value)} required/></label></div>
     <div className="lf-fulfilment-choice"><span>How would you like to receive it?</span><div><label><input type="radio" name="mode" value="pickup" checked={mode==="pickup"} onChange={()=>setMode("pickup")}/> Collection</label><label><input type="radio" name="mode" value="delivery" checked={mode==="delivery"} onChange={()=>setMode("delivery")}/> Delivery</label></div></div>
     {mode==="delivery"&&<label className="lf-request-field">Delivery location or landmark<input name="deliveryLocation" value={deliveryLocation} onChange={event=>setDeliveryLocation(event.target.value)} autoComplete="street-address" placeholder="Your area or a nearby landmark" required/></label>}
     {error&&<p role="alert" className="notice">{error}</p>}
     <div className="lf-request-actions"><button type="button" className="button buttonLight" onClick={()=>{setError("");setStep(1)}}>← Back to food</button><button type="button" className="button buttonPrimary" onClick={()=>{if(!scheduledDate||!scheduledTime){setError("Choose your requested date and preferred time.");return}if(new Date(gaboroneScheduledIso(scheduledDate+"T"+scheduledTime)).getTime()<Date.now()){setError("Choose a future date and time.");return}if(mode==="delivery"&&!deliveryLocation.trim()){setError("Add your delivery location or landmark.");return}setError("");setStep(3)}}>Continue to your details →</button></div>
    </section>
    <section className="orderCard lf-request-stage" hidden={step!==3}>
     <span className="kicker">03 · YOUR DETAILS</span><h2>How can Lesedi reach you?</h2><p className="orderTruth">Only your name and WhatsApp/contact number are needed for this request.</p>
     <div className="fieldGrid"><label className="fieldFull">Your name<input name="customerName" autoComplete="name" value={customerName} onChange={event=>setCustomerName(event.target.value)} required/></label><label className="fieldFull">WhatsApp number<input name="phone" type="tel" autoComplete="tel" inputMode="tel" value={customerPhone} onChange={event=>setCustomerPhone(event.target.value)} required/></label></div>
     <button type="button" className="lf-optional-toggle" aria-expanded={showInstructions} onClick={()=>setShowInstructions(value=>!value)}>{showInstructions?"− Hide":"＋ Add"} special instructions <span>Optional</span></button>
     {showInstructions&&<label className="lf-request-field">Anything Lesedi should know?<textarea name="instructions" value={instructions} onChange={event=>setInstructions(event.target.value)} rows={3} placeholder="Allergies, collection notes or other useful details…"/></label>}
     <div className="lf-request-review"><div><span>{selected.map(item=>item.quantity+" × "+item.name).join(" · ")}</span><strong>P{total.toFixed(2)}</strong></div><small>{scheduledDate} · {scheduledTime} · {mode==="delivery"?"Delivery":"Collection"}</small></div>
     {error&&<p role="alert" className="notice">{error}</p>}
     <div className="lf-request-actions"><button type="button" className="button buttonLight" onClick={()=>{setError("");setStep(2)}}>← Back</button><button className="button buttonPrimary" type="submit" disabled={busy||!selected.length}>{busy?"Sending request…":"Send food request · P"+total.toFixed(2)}</button></div>
     <p className="orderTruth">No payment is taken now. Your request is sent to Lesedi for review and confirmation.</p>
    </section>
   </form>
  </div>
 </main>
}