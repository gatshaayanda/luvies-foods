import {createHash,timingSafeEqual} from "node:crypto";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {NextResponse} from "next/server";

export const runtime="nodejs";

function getAdminApp(){
 const expectedProject=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
 if(!expectedProject)throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable.");
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("Missing FIREBASE_ADMIN_KEY environment variable.");
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY must contain valid service-account JSON.")}
 const credentialProject=typeof serviceAccount.project_id==="string"?serviceAccount.project_id:"";
 if(credentialProject!==expectedProject)throw new Error("Firebase Admin credentials and public Firebase configuration target different projects.");
 const name="luvies-foods-operations";
 const existing=getApps().find(app=>app.name===name);
 if(existing)return existing;
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0]),projectId:expectedProject},name);
}
function matchesWord(input:string,expected:string){
 const a=createHash("sha256").update(input).digest();
 const b=createHash("sha256").update(expected).digest();
 return timingSafeEqual(a,b)&&input.length>0;
}
export async function POST(request:Request){
 try{
  const expected=process.env.ADMIN_PASSWORD;
  if(!expected)return NextResponse.json({error:"Briefcase access is not configured yet. Set ADMIN_PASSWORD in Vercel."},{status:503});
  const body=await request.json().catch(()=>null) as {word?:unknown}|null;
  const word=typeof body?.word==="string"?body.word:"";
  if(!matchesWord(word,expected))return NextResponse.json({error:"Access denied. Check the access word and try again."},{status:401});
  const app=getAdminApp();
  const uid="luvies-foods-owner";
  const ownerRecord=getFirestore(app).collection("admins").doc(uid);
  await ownerRecord.set({role:"owner",temporaryAccess:true,createdAt:new Date().toISOString()},{merge:true});
  const verifiedRecord=await ownerRecord.get();
  const role=String(verifiedRecord.data()?.role??"").toLowerCase();
  if(!verifiedRecord.exists||!["owner","staff"].includes(role))throw new Error("Owner authorisation record could not be verified after provisioning.");
  const token=await getAuth(app).createCustomToken(uid);
  return NextResponse.json({token},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("Luvie's Foods Briefcase login failed:",error instanceof Error?error.message:"unknown error");
  return NextResponse.json({error:"Briefcase sign-in is temporarily unavailable. Check the server configuration."},{status:500});
 }
}