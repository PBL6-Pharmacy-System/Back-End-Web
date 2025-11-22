#!/bin/bash

# Test checkout with shipping address ID
# This script tests if the shipping_address_id is correctly saved in the order

BASE_URL="http://localhost:3000/api"

echo "======================================"
echo "Testing Checkout with Shipping Address"
echo "======================================"

# Step 1: Login as customer
echo -e "\n1. Login as customer..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
CUSTOMER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['customers']['id'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo "   Customer ID: $CUSTOMER_ID"
echo "   Token: ${TOKEN:0:20}..."

# Step 2: Get customer's shipping addresses
echo -e "\n2. Get customer's shipping addresses..."
ADDRESSES_RESPONSE=$(curl -s -X GET "$BASE_URL/customers/$CUSTOMER_ID/shipping-addresses" \
  -H "Authorization: Bearer $TOKEN")

echo "Addresses: $ADDRESSES_RESPONSE"
FIRST_ADDRESS_ID=$(echo $ADDRESSES_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data'][0]['id'] if 'data' in data and len(data['data']) > 0 else '')" 2>/dev/null)

if [ -z "$FIRST_ADDRESS_ID" ]; then
  echo "❌ No addresses found for customer"
  exit 1
fi

echo "✅ Found address ID: $FIRST_ADDRESS_ID"

# Step 3: Clear cart first
echo -e "\n3. Clear existing cart..."
curl -s -X DELETE "$BASE_URL/cart/$CUSTOMER_ID/clear" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅ Cart cleared"

# Step 4: Add item to cart
echo -e "\n4. Add item to cart..."
ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/$CUSTOMER_ID/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "productUnitId": 1,
    "quantity": 2
  }')

echo "Add to cart response: $ADD_RESPONSE"

if echo "$ADD_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Item added to cart"
else
  echo "❌ Failed to add item to cart"
  exit 1
fi

# Step 5: Checkout with specific shipping address
echo -e "\n5. Checkout with shipping address ID: $FIRST_ADDRESS_ID..."
CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingAddressId\": $FIRST_ADDRESS_ID,
    \"paymentMethod\": \"cash\"
  }")

echo -e "\nCheckout Response:"
echo "$CHECKOUT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CHECKOUT_RESPONSE"

# Extract order details
ORDER_ID=$(echo $CHECKOUT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
SHIPPING_ADDRESS_ID_IN_ORDER=$(echo $CHECKOUT_RESPONSE | grep -o '"shipping_address_id":[0-9]*' | cut -d':' -f2)

echo -e "\n======================================"
echo "Test Result:"
echo "======================================"
echo "Expected shipping_address_id: $FIRST_ADDRESS_ID"
echo "Actual shipping_address_id in order: $SHIPPING_ADDRESS_ID_IN_ORDER"

if [ "$FIRST_ADDRESS_ID" = "$SHIPPING_ADDRESS_ID_IN_ORDER" ]; then
  echo -e "\n✅ TEST PASSED: Shipping address ID is correct!"
else
  echo -e "\n❌ TEST FAILED: Shipping address ID mismatch!"
  echo "   Expected: $FIRST_ADDRESS_ID"
  echo "   Got: $SHIPPING_ADDRESS_ID_IN_ORDER"
  exit 1
fi
