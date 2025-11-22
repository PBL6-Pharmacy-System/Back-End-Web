#!/bin/bash

# API Testing Script - Backend Web
# This script tests all API endpoints systematically

BASE_URL="http://localhost:3000/api"
OUTPUT_FILE="API_TEST_RESULTS.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize results file
echo "# API Test Results" > $OUTPUT_FILE
echo "Generated: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test API
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "## Test $TOTAL_TESTS: $description" >> $OUTPUT_FILE
    echo "- **Endpoint**: \`$method $endpoint\`" >> $OUTPUT_FILE
    
    if [ -n "$data" ]; then
        echo "- **Request Body**: \`$data\`" >> $OUTPUT_FILE
    fi
    
    # Build curl command
    if [ -n "$token" ]; then
        CURL_CMD="curl -s -X $method $BASE_URL$endpoint -H 'Content-Type: application/json' -H 'Authorization: Bearer $token'"
    else
        CURL_CMD="curl -s -X $method $BASE_URL$endpoint -H 'Content-Type: application/json'"
    fi
    
    if [ -n "$data" ]; then
        CURL_CMD="$CURL_CMD -d '$data'"
    fi
    
    # Execute request
    RESPONSE=$(eval $CURL_CMD)
    HTTP_CODE=$(eval "$CURL_CMD -w '%{http_code}'" | tail -n1)
    
    # Check if successful
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASSED${NC}"
        echo "- **Status**: ✅ PASSED" >> $OUTPUT_FILE
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "- **Status**: ❌ FAILED" >> $OUTPUT_FILE
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "- **Response**: \`\`\`json" >> $OUTPUT_FILE
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE" >> $OUTPUT_FILE
    echo "\`\`\`" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
}

echo "===== Starting API Tests ====="
echo ""

# 1. Auth Module
echo "Testing Auth Module..."
echo "# Auth Module" >> $OUTPUT_FILE

# Register new user
test_api "POST" "/auth/register" '{
  "username": "testuser",
  "password": "Test@123456",
  "email": "testuser@example.com",
  "phone": "0901234567",
  "full_name": "Test User",
  "role_name": "customer"
}' "" "User Registration"

# Login
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test@123456"}')

TOKEN=$(echo $RESPONSE | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful, token obtained${NC}"
    test_api "POST" "/auth/login" '{"username":"testuser","password":"Test@123456"}' "" "User Login"
else
    echo -e "${RED}✗ Login failed, using test without token${NC}"
    TOKEN=""
fi

# Get current user profile
test_api "GET" "/auth/me" "" "$TOKEN" "Get Current User Profile"

echo ""

# 2. Product Module
echo "Testing Product Module..."
echo "# Product Module" >> $OUTPUT_FILE

test_api "GET" "/products?page=1&limit=10" "" "" "Get All Products"
test_api "GET" "/products/1" "" "" "Get Product By ID"
test_api "GET" "/products/search?keyword=thuốc" "" "" "Search Products by Keyword"

echo ""

# 3. Category Module
echo "Testing Category Module..."
echo "# Category Module" >> $OUTPUT_FILE

test_api "GET" "/categories" "" "" "Get All Categories"
test_api "GET" "/categories/1" "" "" "Get Category By ID"

echo ""

# 4. Cart Module (Requires Auth)
if [ -n "$TOKEN" ]; then
    echo "Testing Cart Module..."
    echo "# Cart Module" >> $OUTPUT_FILE
    
    # Get customer ID from token
    CUSTOMER_ID=$(echo $RESPONSE | jq -r '.user.customer_id' 2>/dev/null)
    
    if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
        test_api "GET" "/cart/$CUSTOMER_ID" "" "$TOKEN" "Get Cart"
        test_api "GET" "/cart/$CUSTOMER_ID/summary" "" "$TOKEN" "Get Cart Summary"
        
        test_api "POST" "/cart/$CUSTOMER_ID/add" '{
          "productId": 1,
          "productUnitId": 1,
          "quantity": 2
        }' "$TOKEN" "Add to Cart"
        
        test_api "GET" "/cart/$CUSTOMER_ID" "" "$TOKEN" "Get Cart After Adding"
    fi
fi

echo ""

# 5. Order Module
if [ -n "$TOKEN" ]; then
    echo "Testing Order Module..."
    echo "# Order Module" >> $OUTPUT_FILE
    
    test_api "GET" "/orders" "" "$TOKEN" "Get All Orders"
fi

echo ""

# 6. Review Module
echo "Testing Review Module..."
echo "# Review Module" >> $OUTPUT_FILE

test_api "GET" "/reviews/product/1" "" "" "Get Product Reviews"

echo ""

# 7. Branch Module
echo "Testing Branch Module..."
echo "# Branch Module" >> $OUTPUT_FILE

test_api "GET" "/branches" "" "" "Get All Branches"
test_api "GET" "/branches/1" "" "" "Get Branch By ID"

echo ""

# 8. Cities Module
echo "Testing Cities Module..."
echo "# Cities Module" >> $OUTPUT_FILE

test_api "GET" "/cities" "" "" "Get All Cities"

echo ""

# Summary
echo "===== Test Summary =====" 
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

# Add summary to markdown
echo "---" >> $OUTPUT_FILE
echo "## Summary" >> $OUTPUT_FILE
echo "- **Total Tests**: $TOTAL_TESTS" >> $OUTPUT_FILE
echo "- **Passed**: ✅ $PASSED_TESTS" >> $OUTPUT_FILE
echo "- **Failed**: ❌ $FAILED_TESTS" >> $OUTPUT_FILE
echo "- **Success Rate**: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%" >> $OUTPUT_FILE

echo "Results saved to: $OUTPUT_FILE"
