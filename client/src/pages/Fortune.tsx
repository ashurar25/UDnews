import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MetaHead from "@/components/MetaHead";

const Fortune = () => {
  return (
    <div className="min-h-screen bg-background">
      <MetaHead
        title="ดูดวง โหราศาสตร์ | UD News Update"
        description="ดูดวงรายวัน โหราศาสตร์ไทย ทำนายดวงชะตา"
        image="/og-fortune.svg"
        url="/fortune"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-kanit text-center mb-8">
            🔮 ดูดวง โหราศาสตร์
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-semibold mb-4">กำลังพัฒนา</h2>
            <p className="text-gray-600 mb-6">
              หน้าดูดวงและโหราศาสตร์กำลังอยู่ระหว่างการพัฒนา
            </p>
            <p className="text-sm text-gray-500">
              เร็วๆ นี้จะมีการทำนายดวงชะตา ดูดวงรายวัน และโหราศาสตร์ไทย
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Fortune;
