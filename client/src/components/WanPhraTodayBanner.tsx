import React from 'react';

const WanPhraTodayBanner = () => {
  return (
    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-l-4 border-yellow-500 p-4 mb-4 rounded-lg shadow-sm">
      <div className="flex items-center">
        <div className="text-2xl mr-3">🙏</div>
        <div>
          <h3 className="text-lg font-semibold font-kanit text-yellow-800">
            วันพระ
          </h3>
          <p className="text-sm text-yellow-700 font-sarabun">
            วันนี้เป็นวันพระ ควรทำบุญ รักษาศีล และปฏิบัติธรรม
          </p>
        </div>
      </div>
    </div>
  );
};

export default WanPhraTodayBanner;
