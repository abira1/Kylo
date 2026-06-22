#!/bin/bash

# First message
echo "=== FIRST MESSAGE ==="
RESP1=$(curl -s -X POST https://kylo-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "pk_live_demo_d4f2k9xq1m4r7",
    "conversationId": "test-consecutive",
    "message": "Hello",
    "messages": [{"role": "user", "content": "Hello"}]
  }' -w "\nSTATUS:%{http_code}")

STATUS1=$(echo "$RESP1" | grep "STATUS:" | cut -d: -f2)
echo "Status: $STATUS1"

# Extract reply from first response
REPLY1=$(echo "$RESP1" | grep -v "STATUS:" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('reply', '')[:100])")
echo "Reply preview: $REPLY1"

# Second message with history
echo ""
echo "=== SECOND MESSAGE ==="
RESP2=$(curl -s -X POST https://kylo-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "pk_live_demo_d4f2k9xq1m4r7",
    "conversationId": "test-consecutive",
    "message": "Follow up",
    "messages": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there!"},
      {"role": "user", "content": "Follow up"}
    ]
  }' -w "\nSTATUS:%{http_code}")

STATUS2=$(echo "$RESP2" | grep "STATUS:" | cut -d: -f2)
echo "Status: $STATUS2"

echo ""
echo "Result: First=$STATUS1, Second=$STATUS2"
