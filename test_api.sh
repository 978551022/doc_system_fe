#!/bin/bash

# 测试后端API脚本

echo "=========================================="
echo "测试文档上传和查询API"
echo "=========================================="
echo ""

# 1. 测试上传接口
echo "1. 测试文档上传接口..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/documents/upload \
  -F "file=@/tmp/test_upload.txt")

echo "上传响应: $UPLOAD_RESPONSE"

# 提取文档ID
DOC_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DOC_ID" ]; then
  echo "❌ 未能提取到文档ID"
  exit 1
fi

echo "✅ 文档上传成功，ID: $DOC_ID"
echo ""

# 2. 等待文档处理完成
echo "2. 等待文档处理（3秒）..."
sleep 3
echo ""

# 3. 测试流式查询接口
echo "3. 测试流式查询接口..."
echo "查询问题: 'test'"
echo "------------------------------------------"

curl -N "http://localhost:8001/api/v1/documents/${DOC_ID}/query-stream?query=test" \
  -H "Accept: text/event-stream" \
  --max-time 10 2>&1 | grep -v "^%" | head -20

echo ""
echo "------------------------------------------"
echo "✅ 测试完成！"
echo ""
echo "前端访问地址: http://localhost:5173/"
echo "请尝试在上传文件后输入查询进行测试"
