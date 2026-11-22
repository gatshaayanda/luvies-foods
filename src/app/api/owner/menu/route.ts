import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {NextResponse} from "next/server";

export const runtime="nodejs";

function getAdminApp(){
 const expectedProject=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!expectedProject||!raw)throw new Error("Owner menu service is not configured with Firebase Admin credentials.");
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY must contain valid service-account JSON.")}
 if(serviceAccount.project_id!==expectedProject)throw new Error("Firebase Admin credentials and public Firebase configuration target different projects.");
 const name="luvies-foods-operations";
 const existing=getApps().find(app=>app.name===name);
 return existing??initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0]),projectId:expectedProject},name);
}

const starterMeals=[
 {id:"rice-and-chicken",name:"Rice and chicken",price:40,category:"Meals",description:"",available:true,preparationMinutes:20,sortOrder:1,imageUrl:"https://9hqs4mvyjb.ufs.sh/f/4b6x094yqDzNr2Ycpkziq1PRh9nKcZ6A3UgIYaVJCrpDTeO0",section:"deal",days:[]},
 {id:"rice-and-beef",name:"Rice and beef",price:40,category:"Meals",description:"",available:true,preparationMinutes:20,sortOrder:2,imageUrl:"https://9hqs4mvyjb.ufs.sh/f/4b6x094yqDzN4cSgJSyqDzNSR9iuQ7HtY2bdagyBOnkUPMrX",section:"deal",days:[]}
] as const;
const menuFields=["id","name","price","friendPrice","category","description","available","preparationMinutes","sortOrder","imageUrl","section","days","brand","productType","sizes","colors","sourceUrl"] as const;

async function getOwnerDatabase(request:Request){
 const header=request.headers.get("authorization")??"";
 const token=header.startsWith("Bearer ")?header.slice(7):"";
 if(!token)throw Object.assign(new Error("Your Briefcase session has expired. Sign in again."),{status:401,code:"unauthenticated"});
 const app=getAdminApp();
 const decoded=await getAuth(app).verifyIdToken(token);
 const db=getFirestore(app);
 const owner=await db.collection("admins").doc(decoded.uid).get();
 const role=String(owner.data()?.role??"").toLowerCase();
 if(!owner.exists||!["owner","staff"].includes(role))throw Object.assign(new Error("This signed-in account is not authorised to manage the menu."),{status:403,code:"permission-denied"});
 return db;
}
async function listMenu(db:ReturnType<typeof getFirestore>){
 const snapshot=await db.collection("menu").get();
 return snapshot.docs.map(item=>({id:item.id,...item.data()})).sort((a,b)=>Number(a.sortOrder??0)-Number(b.sortOrder??0)||String(a.name??"").localeCompare(String(b.name??"")));
}

export async function POST(request:Request){
 try{
  const db=await getOwnerDatabase(request);
  const body=await request.json().catch(()=>null) as {action?:unknown;item?:Record<string,unknown>;id?:unknown}|null;
  const action=body?.action;
  if(action==="seed"){
   for(const meal of starterMeals){
    const ref=db.collection("menu").doc(meal.id);
    const existing=await ref.get();
    if(!existing.exists)await ref.create(meal);
   }
  }else if(action==="save"){
   const item=body?.item;
   if(!item||typeof item!=="object"||typeof item.id!=="string"||!item.id.trim()||typeof item.name!=="string"||!item.name.trim()||typeof item.price!=="number"||!Number.isFinite(item.price)||item.price<0||typeof item.available!=="boolean"){
    return NextResponse.json({error:"Enter a meal name, valid price and availability before saving.",code:"invalid-argument"},{status:400});
   }
   const clean=Object.fromEntries(menuFields.filter(key=>item[key]!==undefined).map(key=>[key,item[key]]));
   await db.collection("menu").doc(item.id).set(clean);
  }else if(action==="delete"){
   if(typeof body?.id!=="string"||!body.id.trim())return NextResponse.json({error:"A menu item ID is required.",code:"invalid-argument"},{status:400});
   await db.collection("menu").doc(body.id).delete();
  }else{
   return NextResponse.json({error:"Unsupported menu action.",code:"invalid-argument"},{status:400});
  }
  return NextResponse.json({items:await listMenu(db)},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const failure=error as {message?:string;code?:string;status?:number};
  const status=typeof failure.status==="number"?failure.status:failure.code==="auth/argument-error"||failure.code==="auth/id-token-expired"?401:500;
  const code=typeof failure.code==="string"?failure.code:"internal";
  console.error("Luvie's Foods owner menu action failed:",failure.message??"unknown error");
  return NextResponse.json({error:failure.message??"The owner menu service could not complete this change.",code},{status,headers:{"Cache-Control":"no-store"}});
 }
}
