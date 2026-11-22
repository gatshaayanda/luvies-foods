"use client";
import {Languages} from "lucide-react";
import {useFoodLanguage, type FoodLanguage} from "@/lib/food-translations";

export default function FoodLanguageSwitcher(){
 const {language,setLanguage}=useFoodLanguage();
 return <label className="lf-language-switcher" title="Display language">
  <Languages size={15} aria-hidden="true"/>
  <span className="lf-language-label">Language</span>
  <select aria-label="Display language" value={language} onChange={event=>setLanguage(event.target.value as FoodLanguage)}>
   <option value="en">English</option>
   <option value="tn">Setswana</option>
  </select>
 </label>;
}
