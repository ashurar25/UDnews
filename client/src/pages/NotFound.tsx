import { useLocation } from "wouter";
import { useEffect } from "react";
import MetaHead from "@/components/MetaHead";

const NotFound = () => {
  const [location] = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location
    );
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <MetaHead
        title="404 ไม่พบหน้า | UD News Update"
        description="ไม่พบหน้าที่คุณต้องการเข้าชม"
        url={location}
        canonical={`https://udnewsupdate.sbs${location}`}
        noindex
        siteName="UD News Update"
        type="website"
        locale="th_TH"
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
