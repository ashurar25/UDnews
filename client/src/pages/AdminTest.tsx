export default function AdminTest() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold text-gray-800">Admin Test Page</h1>
      <p className="mt-4 text-gray-600">
        หากหน้านี้โหลดได้ปกติ แสดงว่าปัญหาไม่ได้อยู่ที่ React core
      </p>
      <div className="mt-8 p-4 bg-green-100 rounded">
        <p className="text-green-800">✓ หน้าทดสอบโหลดสำเร็จ</p>
      </div>
    </div>
  )
}