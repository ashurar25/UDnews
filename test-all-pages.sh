#!/bin/bash

# Test all pages and buttons in UD News
echo "🔍 เริ่มทดสอบทุกหน้าและปุ่มใน UD News..."

BASE_URL="http://localhost:5000"
RESULTS_FILE="test-results.md"

# Create results file
echo "# รายงานการทดสอบระบบ UD News" > $RESULTS_FILE
echo "วันที่: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_content="$3"
    
    echo "Testing: $name"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq 200 ]; then
        echo "✅ $name - OK (200)" >> $RESULTS_FILE
        
        # Check for content if provided
        if [ ! -z "$expected_content" ]; then
            content=$(curl -s "$url" | grep -i "$expected_content" > /dev/null && echo "found" || echo "not found")
            echo "   - Content check: $content" >> $RESULTS_FILE
        fi
    else
        echo "❌ $name - FAILED ($response)" >> $RESULTS_FILE
    fi
}

# Test API endpoints
echo "" >> $RESULTS_FILE
echo "## API Endpoints" >> $RESULTS_FILE

test_endpoint "Health Check" "$BASE_URL/api/health" "healthy"
test_endpoint "News API" "$BASE_URL/api/news" "title"
test_endpoint "RSS Feeds API" "$BASE_URL/api/rss-feeds" "url"
test_endpoint "Sponsor Banners API" "$BASE_URL/api/sponsor-banners" "title"
test_endpoint "Disaster Alerts API" "$BASE_URL/api/disaster-alerts/active" ""

# Test pages
echo "" >> $RESULTS_FILE
echo "## Frontend Pages" >> $RESULTS_FILE

test_endpoint "หน้าแรก" "$BASE_URL/" "root"
test_endpoint "ข่าวทั้งหมด" "$BASE_URL/news" "root"
test_endpoint "ข่าวท้องถิ่น" "$BASE_URL/category/local" "root"
test_endpoint "การเมือง" "$BASE_URL/category/politics" "root"
test_endpoint "กีฬา" "$BASE_URL/category/sports" "root"
test_endpoint "บันเทิง" "$BASE_URL/category/entertainment" "root"
test_endpoint "ติดต่อเรา" "$BASE_URL/contact" "root"
test_endpoint "บริจาค" "$BASE_URL/donate" "root"
test_endpoint "ค้นหา" "$BASE_URL/search" "root"
test_endpoint "Login" "$BASE_URL/login" "root"
test_endpoint "Admin" "$BASE_URL/admin" "root"
test_endpoint "System Status" "$BASE_URL/system-status" "root"
test_endpoint "Test Systems" "$BASE_URL/test-systems" "root"
test_endpoint "Disaster Alert" "$BASE_URL/disaster-alert" "root"

echo "" >> $RESULTS_FILE
echo "## Summary" >> $RESULTS_FILE
echo "ทดสอบเสร็จสิ้น - ดูรายละเอียดข้างต้น" >> $RESULTS_FILE

echo "✅ ทดสอบเสร็จสิ้น - ดูผลลัพธ์ใน test-results.md"