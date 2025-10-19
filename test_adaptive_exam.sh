#!/bin/bash

# Adaptive Exam System Test Script
# This script tests the main API endpoints

echo "🧪 Testing Adaptive Exam API Endpoints"
echo "========================================"
echo ""

# Configuration
API_BASE="https://learningsphere-1fgj.onrender.com/api"
TOKEN="YOUR_JWT_TOKEN_HERE"

echo "📝 Note: Replace TOKEN variable with a valid JWT token"
echo ""

# Test 1: Check for active session
echo "1️⃣ Testing: GET /adaptive-exam/active-session"
curl -X GET "${API_BASE}/adaptive-exam/active-session" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""

# Test 2: Get user stats
echo "2️⃣ Testing: GET /adaptive-exam/stats"
curl -X GET "${API_BASE}/adaptive-exam/stats" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""

# Test 3: Start new exam
echo "3️⃣ Testing: POST /adaptive-exam/start"
RESPONSE=$(curl -s -X POST "${API_BASE}/adaptive-exam/start" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo $RESPONSE | jq '.'
SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')
echo ""
echo "📌 Session ID: ${SESSION_ID}"
echo ""

# Test 4: Submit an answer
if [ ! -z "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
    echo "4️⃣ Testing: POST /adaptive-exam/submit"
    QUESTION_ID=$(echo $RESPONSE | jq -r '.question.id')
    
    curl -X POST "${API_BASE}/adaptive-exam/submit" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"sessionId\": \"${SESSION_ID}\",
        \"questionId\": \"${QUESTION_ID}\",
        \"answer\": \"a\",
        \"timeSpent\": 10.5,
        \"questionText\": \"Test Question\",
        \"questionOptions\": {\"a\": \"A\", \"b\": \"B\", \"c\": \"C\", \"d\": \"D\"},
        \"difficulty\": \"Easy\",
        \"difficultyNumeric\": 1
      }" \
      | jq '.'
    echo ""
    
    # Test 5: Get analytics
    echo "5️⃣ Testing: GET /adaptive-exam/analytics/:sessionId"
    curl -X GET "${API_BASE}/adaptive-exam/analytics/${SESSION_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      | jq '.'
    echo ""
    
    # Test 6: Abandon session
    echo "6️⃣ Testing: PUT /adaptive-exam/abandon/:sessionId"
    curl -X PUT "${API_BASE}/adaptive-exam/abandon/${SESSION_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      | jq '.'
    echo ""
fi

echo "✅ Tests completed!"
echo ""
echo "Next steps:"
echo "1. Replace TOKEN variable with a real JWT token"
echo "2. Run: chmod +x test_adaptive_exam.sh"
echo "3. Run: ./test_adaptive_exam.sh"
