import type {Metadata,Viewport} from "next";
import {headers} from "next/headers";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import Script from "next/script";
import "./globals.css"; import "./pwa.css"; import "./install-card.css";
const siteUrl=process.env.NEXT_PUBLIC_BASE_URL||"https://luvies-foods.vercel.app";
const EMBEDDED_BROWSER_PATTERN=/WhatsApp|Instagram|FBAN|FBAV|Messenger|Line[/]|Twitter|TikTok|Snapchat/i;
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:"Love is Foods | Good food, made with love",template:"%s | Love is Foods"},description:"The Love is Foods ordering and business workspace. Browse the menu, place orders and follow their progress.",applicationName:"Love is Foods",keywords:["Love is Foods","food ordering","Botswana","menu","orders"],alternates:{canonical:"/"},openGraph:{type:"website",url:siteUrl,siteName:"Love is Foods",title:"Love is Foods | Good food, made with love",description:"Browse the menu, order your meal and follow its progress."},twitter:{card:"summary",title:"Love is Foods",description:"Browse the menu and order your meal."},icons:{icon:[{url:"/love-is-foods-icon-192.png",sizes:"192x192",type:"image/png"},{url:"/love-is-foods-icon-512.png",sizes:"512x512",type:"image/png"},{url:"/love-is-foods-icon.svg",type:"image/svg+xml"}],apple:{url:"/love-is-foods-icon-192.png",sizes:"192x192",type:"image/png"}},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"Love is Foods",statusBarStyle:"default"}};
export const viewport:Viewport={themeColor:"#db0b0b",colorScheme:"light"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers();
 const userAgent=requestHeaders.get("user-agent")||"";
 const requestedWith=requestHeaders.get("x-requested-with")||"";
 // A social referrer does not prove this browser is embedded: Chrome opened from WhatsApp
 // must not be trapped in the in-app-browser install gate.
 const embedded=EMBEDDED_BROWSER_PATTERN.test(userAgent)
   || (/Android/i.test(userAgent)&&/\bwv\b/i.test(userAgent))
   || /^(com\.whatsapp|com\.instagram\.android|com\.facebook\.katana|com\.facebook\.lite|com\.facebook\.orca)$/i.test(requestedWith);
 const android=/Android/i.test(userAgent);
 return <html lang="en"><body style={embedded?{overflow:"hidden"}:undefined}><Script id="love-is-foods-early-install-capture" strategy="beforeInteractive">{`
(function () {
  window.addEventListener("beforeinstallprompt", function (event) {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone || window.__loveIsFoodsPwaListenerReady === true) return;
    event.preventDefault();
    window.__loveIsFoodsInstallPrompt = event;
  });
})();
`}</Script><PwaRegister initialEmbedded={embedded} initialAndroid={android}/>{children}<Analytics/><SpeedInsights/></body></html>
}
