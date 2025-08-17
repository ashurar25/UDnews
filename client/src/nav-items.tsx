
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ThaiCalendar from "./pages/ThaiCalendar";

export const navItems = [
  {
    title: "หน้าแรก",
    to: "/",
    page: Index,
  },
  {
    title: "ปฏิทินไทย",
    to: "/thai-calendar",
    page: ThaiCalendar,
  },
  {
    title: "แอดมิน",
    to: "/admin",
    page: Admin,
  },
];
