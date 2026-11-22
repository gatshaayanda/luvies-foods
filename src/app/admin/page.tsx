import FoodAdminGate from "@/app/admin/food-admin-gate";
import FoodAdminDashboard from "@/components/FoodAdminDashboard";
export const metadata={title:"Owner Briefcase",description:"Luvie’s Foods owner operations for menu, orders and payments."};
export default function AdminPage(){return <FoodAdminGate><FoodAdminDashboard/></FoodAdminGate>}
