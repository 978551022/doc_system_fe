# 联网搜索功能实现报告

## 实现时间
2026-01-23 24:20

---

## 功能需求

用户希望开启"联网搜索"按钮时，前端新增 `online_search=true` 字段与后端交互，并能够正常获取后端返回结果。

---

## 实现方案

### 架构设计

```
用户操作 → 前端开关状态 → API参数传递 → 后端处理 → 流式返回
```

### 实现步骤

#### 1. ChatInput组件 - 传递联网搜索状态

**文件**: `src/components/ChatInput.vue`

**修改**: 在 `sendMessage` 函数中添加 `onlineSearch` 参数

```javascript
const sendMessage = () => {
  if (!inputMessage.value.trim() && uploadedFiles.value.length === 0) return

  emit('sendMessage', {
    content: inputMessage.value.trim(),
    files: uploadedFiles.value,
    onlineSearch: isInternetSearchEnabled.value  // ✅ 添加联网搜索参数
  })

  // 清空输入
  inputMessage.value = ''
  uploadedFiles.value = []
}
```

**说明**:
- `isInternetSearchEnabled` 是开关状态
- 当开关打开时，`onlineSearch = true`
- 当开关关闭时，`onlineSearch = false`

---

#### 2. ChatPage组件 - 接收并处理参数

**文件**: `src/views/ChatPage.vue`

**修改1**: 在 `sendMessage` 函数中解构获取 `onlineSearch` 参数

```javascript
const sendMessage = async (data) => {
  console.log('ChatPage收到消息:', data)
  const { content, files, onlineSearch } = data  // ✅ 解构获取onlineSearch参数

  // 允许只有文件上传而没有文本内容
  if (!content.trim() && (!files || files.length === 0)) return
```

**修改2**: 在用户消息中显示联网搜索状态

```javascript
// 如果开启了联网搜索，在消息中提示
if (onlineSearch) {
  messageContent += ' [联网搜索]'
  console.log('联网搜索已开启')
}
```

**修改3**: 调用API时传递 `onlineSearch` 参数

```javascript
// 调用流式查询API，传递联网搜索参数
await queryDocumentStream(docId, query, (extractedText) => {
  // 处理流式数据
  assistantMessage.content += extractedText
  scrollToBottom(false)
}, onlineSearch)  // ✅ 传递联网搜索参数
```

---

#### 3. API模块 - 添加URL参数

**文件**: `src/api/document.js`

**修改**: 在 `queryDocumentStream` 函数中添加 `onlineSearch` 参数支持

```javascript
/**
 * 流式查询文档
 * @param {string} docId 文档ID
 * @param {string} query 查询问题
 * @param {Function} onChunk 接收流式数据的回调函数
 * @param {boolean} onlineSearch 是否启用联网搜索 ✅ 新增参数
 */
export const queryDocumentStream = async (docId, query, onChunk, onlineSearch = false) => {
  // 构建URL参数
  const params = new URLSearchParams({
    query: query,
    online_search: onlineSearch.toString()  // ✅ 添加联网搜索参数
  })

  const url = `/api/v1/documents/${docId}/query-stream?${params.toString()}`

  console.log('开始流式查询:', {
    url,
    docId,
    query,
    onlineSearch,  // ✅ 记录联网搜索状态
    fullUrl: window.location.origin + url
  })

  // ... 后续处理逻辑不变
}
```

**说明**:
- 使用 `URLSearchParams` 构建查询参数
- 将布尔值转换为字符串 `"true"` 或 `"false"`
- 默认值为 `false`，确保向后兼容

---

## 完整的数据流

### 1. 用户开启联网搜索

```
用户操作：
1. 点击输入框上方的"联网搜索"开关
2. 开关变为打开状态
3. isInternetSearchEnabled = true
```

### 2. 发送消息

```
用户输入："今天天气怎么样？"
点击发送按钮

ChatInput组件：
- onlineSearch = true
- 发送事件：{ content: "...", files: [], onlineSearch: true }
```

### 3. ChatPage处理

```
ChatPage接收：
- content: "今天天气怎么样？"
- onlineSearch: true

用户消息显示：
"今天天气怎么样？ [联网搜索]"  ✅
```

### 4. API请求

```
构建URL：
/api/v1/documents/{doc_id}/query-stream?query=今天天气怎么样？&online_search=true

发送到后端：
GET /api/v1/documents/xxx/query-stream?query=...&online_search=true
```

### 5. 后端处理

```
后端接收参数：
- query: "今天天气怎么样？"
- online_search: true

后端逻辑：
1. 检测到 online_search = true
2. 进行联网搜索
3. 结合搜索结果生成回答
4. 流式返回数据
```

### 6. 流式响应

```
前端接收流式数据：
chunk1: "根据联网搜索结果..."
chunk2: "今天北京天气..."
chunk3: "晴转多云，温度..."

用户看到：
助手: 根据联网搜索结果，今天北京天气晴转多云...  ✅
```

---

## 使用示例

### 示例1: 不开启联网搜索

**操作**:
1. 保持"联网搜索"开关关闭
2. 输入："Python有哪些特性？"
3. 点击发送

**用户消息**:
```
用户: Python有哪些特性？
```

**API请求**:
```
GET /api/v1/documents/xxx/query-stream?query=Python有哪些特性？&online_search=false
```

**助手回复**:
```
助手: 根据上传的文档，Python具有以下特性...
```

---

### 示例2: 开启联网搜索

**操作**:
1. 打开"联网搜索"开关
2. 输入："今天天气怎么样？"
3. 点击发送

**用户消息**:
```
用户: 今天天气怎么样？ [联网搜索]
```

**API请求**:
```
GET /api/v1/documents/xxx/query-stream?query=今天天气怎么样？&online_search=true
```

**助手回复**:
```
助手: 根据联网搜索结果，今天北京天气晴转多云...
```

---

## 修改的文件

1. ✅ `src/components/ChatInput.vue:309-322` - 添加onlineSearch参数
2. ✅ `src/views/ChatPage.vue:139-145` - 接收onlineSearch参数
3. ✅ `src/views/ChatPage.vue:242-257` - 显示联网搜索状态
4. ✅ `src/views/ChatPage.vue:286-303` - 传递onlineSearch给API
5. ✅ `src/api/document.js:77-100` - 添加onlineSearch参数支持

---

## 测试验证

### 测试1: 关闭联网搜索

1. **访问**: http://localhost:5173/
2. **确认**: "联网搜索"开关是关闭状态
3. **上传文档**，上传任意PDF文件
4. **输入问题**: "这个文档讲了什么？"
5. **发送消息**
6. **检查**:
   - ✅ 用户消息显示："这个文档讲了什么？"
   - ✅ 没有 `[联网搜索]` 标记
   - ✅ 控制台显示 `onlineSearch: false`
   - ✅ API URL包含 `online_search=false`

### 测试2: 开启联网搜索

1. **访问**: http://localhost:5173/
2. **打开**: "联网搜索"开关
3. **看到提示**: "已开启联网搜索"
4. **上传文档**，上传任意PDF文件
5. **输入问题**: "Python的最新版本是什么？"
6. **发送消息**
7. **检查**:
   - ✅ 用户消息显示："Python的最新版本是什么？ [联网搜索]"
   - ✅ 有 `[联网搜索]` 标记
   - ✅ 控制台显示 `onlineSearch: true`
   - ✅ API URL包含 `online_search=true`
   - ✅ 助手回复包含联网搜索的结果

### 测试3: 切换开关

1. **开启**联网搜索
2. **发送**消息A
3. **检查**: 消息A显示 `[联网搜索]`
4. **关闭**联网搜索
5. **发送**消息B
6. **检查**: 消息B不显示 `[联网搜索]`
7. **验证**: 每条消息独立记录开关状态

---

## 控制台日志示例

### 关闭联网搜索

```javascript
ChatPage收到消息: {
  content: "Python有哪些特性？",
  files: [],
  onlineSearch: false
}

开始流式查询: {
  url: "/api/v1/documents/xxx/query-stream?query=Python有哪些特性？&online_search=false",
  docId: "xxx",
  query: "Python有哪些特性？",
  onlineSearch: false,
  fullUrl: "http://localhost:5173/api/v1/documents/xxx/query-stream?..."
}
```

### 开启联网搜索

```javascript
ChatPage收到消息: {
  content: "今天天气怎么样？",
  files: [],
  onlineSearch: true
}

联网搜索已开启

开始流式查询: {
  url: "/api/v1/documents/xxx/query-stream?query=今天天气怎么样？&online_search=true",
  docId: "xxx",
  query: "今天天气怎么样？",
  onlineSearch: true,
  fullUrl: "http://localhost:5173/api/v1/documents/xxx/query-stream?..."
}
```

---

## UI效果

### 开关关闭状态
```
┌─────────────────────────────┐
│ [模型选择▼] [ 联网搜索 ]   │ ← 开关灰色，关闭
│ [+新建对话] [🕒历史记录]   │
└─────────────────────────────┘
```

### 开关打开状态
```
┌─────────────────────────────┐
│ [模型选择▼] [✓联网搜索 ]   │ ← 开关蓝色，打开
│ [+新建对话] [🕒历史记录]   │
└─────────────────────────────┘
```

### 用户消息显示

**关闭联网搜索**:
```
用户: Python有哪些特性？
```

**开启联网搜索**:
```
用户: 今天天气怎么样？ [联网搜索]
                          ↑
                    蓝色标记，表示使用联网搜索
```

---

## 后端API要求

### 接口规范

**URL**:
```
GET /api/v1/documents/{doc_id}/query-stream
```

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| query | string | 是 | 用户的问题 |
| online_search | boolean | 否 | 是否启用联网搜索，默认false |

**示例请求**:
```
GET /api/v1/documents/abc123/query-stream?query=今天天气&online_search=true
```

**响应**:
- 流式返回（Server-Sent Events）
- 格式与其他查询相同
- 内容包含联网搜索结果

---

## 兼容性

### 向后兼容

✅ **完全向后兼容**
- `onlineSearch` 参数有默认值 `false`
- 不传该参数时，行为与之前完全一致
- 不影响现有功能

### 前端兼容

✅ **不影响其他功能**
- 文件上传 ✓
- 普通查询 ✓
- 流式响应 ✓
- 多轮对话 ✓
- 会话管理 ✓

---

## 状态

✅ **功能已实现**
✅ **代码已优化**
✅ **已热更新**
✅ **可以立即测试**

---

## 测试地址

**前端**: http://localhost:5173/
**后端**: http://localhost:8001/api/v1/

请开启联网搜索开关后进行测试，验证功能是否正常工作！
