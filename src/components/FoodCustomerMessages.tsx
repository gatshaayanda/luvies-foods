"use client";

import {useEffect,useState} from "react";
import {addDoc,collection} from "firebase/firestore";
import {auth,db} from "@/lib/firebase/client";
import {createCustomerConversation,subscribeToCustomerConversations,subscribeToConversation,updateConversationRead,recordConversationMessage,type Conversation,type ConversationMessage} from "@/lib/firebase/data";

const stamp=(value:string)=>{try{return new Intl.DateTimeFormat("en-BW",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}catch{return value}};

export default function FoodCustomerMessages({uid}:{uid:string}){
 const[threads,setThreads]=useState<Conversation[]>([]);
 const[active,setActive]=useState<string|null>(null);
 const[messages,setMessages]=useState<ConversationMessage[]>([]);
 const[draft,setDraft]=useState("");
 const[busy,setBusy]=useState(false);
 const[notice,setNotice]=useState("");
 useEffect(()=>subscribeToCustomerConversations(uid,setThreads,error=>setNotice(error.message)),[uid]);
 useEffect(()=>{if(!active){setMessages([]);return}const stop=subscribeToConversation(active,()=>{},setMessages,error=>setNotice(error.message));void updateConversationRead(active,"customer").catch(error=>setNotice(error instanceof Error?error.message:"Messages could not be marked as read."));return stop},[active]);
 async function send(){
  const text=draft.trim();if(!text||busy||!auth.currentUser)return;
  setBusy(true);setNotice("");
  try{
   const id=active||await createCustomerConversation(uid,"Message to Lesedi");
   if(!active)setActive(id);
   const now=new Date().toISOString();
   await addDoc(collection(db,"conversations",id,"messages"),{senderId:uid,senderRole:"customer",text,attachment:null,createdAt:now});
   await recordConversationMessage(id,"customer",text);
   setDraft("");
  }catch(error){setNotice(error instanceof Error?error.message:"Your message could not be sent. Please try again.")}
  finally{setBusy(false)}
 }
 return <section className="lf-account-panel" role="tabpanel">
  <div className="lf-account-panel-head"><div><span className="lf-eyebrow">A DIRECT LINE TO LESEDI</span><h2>Messages</h2></div><span>{threads.length} conversations</span></div>
  {active?<div className="lf-food-messages-thread"><button type="button" className="lf-food-message-back" onClick={()=>setActive(null)}>← All messages</button><div className="lf-food-message-list" aria-live="polite">{messages.length===0?<p className="lf-account-muted">Start the conversation. Ask Lesedi about your request, availability, collection or delivery.</p>:messages.map(message=><article className={"lf-food-message "+(message.senderRole==="customer"?"mine":"theirs")} key={message.id}><small>{message.senderRole==="customer"?"You":"Lesedi"} · {stamp(message.createdAt)}</small><p>{message.text}</p></article>)}</div><form className="lf-food-message-compose" onSubmit={event=>{event.preventDefault();void send()}}><textarea value={draft} onChange={event=>setDraft(event.target.value)} rows={3} maxLength={2000} placeholder="Write a message to Lesedi…" required/><button className="lf-account-primary" type="submit" disabled={busy||!draft.trim()}>{busy?"Sending…":"Send message"} <span>↗</span></button></form></div>:<><div className="lf-food-message-threads">{threads.map(thread=><button type="button" key={thread.id} onClick={()=>setActive(thread.id)}><span><strong>{thread.title}</strong><small>{thread.lastMessagePreview||"No messages yet."}</small></span><span>{thread.unreadForCustomer?"New · ":""}{stamp(thread.updatedAt)}</span></button>)}</div>{threads.length===0&&<div className="lf-account-empty"><span className="lf-account-empty-mark">♥</span><h3>Talk to Lesedi.</h3><p>Ask about a food request, menu availability, collection, delivery or payment. Your messages will stay here.</p><button className="lf-account-primary" type="button" onClick={async()=>{setBusy(true);try{const id=await createCustomerConversation(uid,"Message to Lesedi");setActive(id)}catch(error){setNotice(error instanceof Error?error.message:"A conversation could not be started.")}finally{setBusy(false)}}} disabled={busy}>{busy?"Opening…":"Start a conversation"} <span>↗</span></button></div>}</>}
  {notice&&<p className="lf-account-message" role="status">{notice}</p>}
 </section>;
}
