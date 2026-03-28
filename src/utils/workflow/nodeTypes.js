/**
 * 节点类型定义
 */

// 节点类型枚举
export const NodeType = {
  START: 'start',
  END: 'end',
  AGENT: 'agent',
  CONDITION: 'condition',
  LOOP: 'loop'
}

// Agent类型定义
export const AgentType = {
  RESEARCHER: 'researcher',
  WRITER: 'writer',
  CODER: 'coder',
  ANALYST: 'analyst',
  DESIGNER: 'designer',
  TRANSLATOR: 'translator',
  SUMMARIZER: 'summarizer',
  REVIEWER: 'reviewer',
  PLANNER: 'planner',
  TEACHER: 'teacher',
  CUSTOM: 'custom'
}

// Agent配置
export const AGENT_CONFIG = {
  [AgentType.RESEARCHER]: {
    name: '研究员',
    nameEn: 'Researcher',
    icon: '🔍',
    description: '信息搜集、资料整理',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    defaultTools: ['rag_search', 'web_search'],
    availableTools: ['rag_search', 'web_search', 'keyword_extract'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的研究员，擅长搜集和整理资料。'
  },
  [AgentType.WRITER]: {
    name: '撰稿人',
    nameEn: 'Writer',
    icon: '✍️',
    description: '内容创作、文案撰写',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    defaultTools: ['rag_search', 'style_guide'],
    availableTools: ['rag_search', 'style_guide', 'grammar_check'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的撰稿人，擅长创作各类文案。'
  },
  [AgentType.CODER]: {
    name: '程序员',
    nameEn: 'Coder',
    icon: '💻',
    description: '代码编写、技术实现',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    defaultTools: ['code_execute', 'documentation'],
    availableTools: ['code_execute', 'documentation', 'rag_search'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的程序员，擅长编写高质量的代码。'
  },
  [AgentType.ANALYST]: {
    name: '分析师',
    nameEn: 'Analyst',
    icon: '📊',
    description: '数据分析、趋势预测',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    defaultTools: ['db_query', 'calculator', 'chart_gen'],
    availableTools: ['db_query', 'calculator', 'chart_gen', 'rag_search'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的数据分析师，擅长分析和预测。'
  },
  [AgentType.DESIGNER]: {
    name: '设计师',
    nameEn: 'Designer',
    icon: '🎨',
    description: 'UI/UX设计、视觉创意',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    defaultTools: ['style_guide', 'rag_search'],
    availableTools: ['style_guide', 'rag_search', 'color_picker'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的设计师，擅长UI/UX设计。'
  },
  [AgentType.TRANSLATOR]: {
    name: '翻译员',
    nameEn: 'Translator',
    icon: '🌐',
    description: '多语言翻译',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    defaultTools: ['dictionary', 'terminology'],
    availableTools: ['dictionary', 'terminology', 'rag_search'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的翻译员，擅长多语言翻译。'
  },
  [AgentType.SUMMARIZER]: {
    name: '摘要员',
    nameEn: 'Summarizer',
    icon: '📝',
    description: '内容摘要、要点提取',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    defaultTools: ['keyword_extract', 'rag_search'],
    availableTools: ['keyword_extract', 'rag_search'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的摘要员，擅长提炼要点。'
  },
  [AgentType.REVIEWER]: {
    name: '审核员',
    nameEn: 'Reviewer',
    icon: '✅',
    description: '内容审核、质量检查',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    defaultTools: ['grammar_check', 'style_check'],
    availableTools: ['grammar_check', 'style_check', 'plagiarism_check'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的审核员，擅长质量检查。'
  },
  [AgentType.PLANNER]: {
    name: '规划师',
    nameEn: 'Planner',
    icon: '📋',
    description: '任务规划、项目管理',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    defaultTools: ['rag_search', 'calendar'],
    availableTools: ['rag_search', 'calendar', 'task_breakdown'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的规划师，擅长任务分解和项目管理。'
  },
  [AgentType.TEACHER]: {
    name: '教师',
    nameEn: 'Teacher',
    icon: '👨‍🏫',
    description: '知识讲解、教学指导',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    defaultTools: ['knowledge_graph', 'rag_search'],
    availableTools: ['knowledge_graph', 'rag_search', 'quiz_generator'],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个专业的教师，擅长知识讲解和教学。'
  },
  [AgentType.CUSTOM]: {
    name: '自定义Agent',
    nameEn: 'Custom Agent',
    icon: '➕',
    description: '用户自定义智能体',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    defaultTools: [],
    availableTools: [],
    defaultModel: 'glm-4',
    systemPrompt: '你是一个自定义的智能助手。'
  }
}

// 获取Agent配置
export function getAgentConfig(type) {
  return AGENT_CONFIG[type] || AGENT_CONFIG[AgentType.CUSTOM]
}

// 获取所有Agent类型列表
export function getAgentTypes() {
  return Object.keys(AgentType).map(key => ({
    value: AgentType[key],
    ...AGENT_CONFIG[AgentType[key]]
  }))
}

// 可用工具列表
export const AVAILABLE_TOOLS = {
  rag_search: {
    name: 'RAG搜索',
    description: '在文档库中检索相关信息'
  },
  web_search: {
    name: '联网搜索',
    description: '在互联网上搜索最新信息'
  },
  keyword_extract: {
    name: '关键词提取',
    description: '从文本中提取关键词'
  },
  code_execute: {
    name: '代码执行',
    description: '执行代码并获取结果'
  },
  documentation: {
    name: '文档生成',
    description: '生成代码文档'
  },
  db_query: {
    name: '数据库查询',
    description: '查询数据库'
  },
  calculator: {
    name: '计算器',
    description: '执行数学计算'
  },
  chart_gen: {
    name: '图表生成',
    description: '生成数据可视化图表'
  },
  style_guide: {
    name: '风格指南',
    description: '遵循特定写作风格'
  },
  grammar_check: {
    name: '语法检查',
    description: '检查文本语法错误'
  },
  style_check: {
    name: '风格检查',
    description: '检查文本风格一致性'
  },
  plagiarism_check: {
    name: '查重检测',
    description: '检测文本重复度'
  },
  dictionary: {
    name: '词典查询',
    description: '查询单词释义和用法'
  },
  terminology: {
    name: '术语库',
    description: '专业术语查询'
  },
  color_picker: {
    name: '配色工具',
    description: '获取配色建议'
  },
  knowledge_graph: {
    name: '知识图谱',
    description: '查询知识关系'
  },
  calendar: {
    name: '日历工具',
    description: '处理日期时间'
  },
  task_breakdown: {
    name: '任务分解',
    description: '将任务分解为子任务'
  },
  quiz_generator: {
    name: '测验生成',
    description: '生成测试题目'
  }
}

// 可用模型列表
export const AVAILABLE_MODELS = [
  { value: 'glm-4', label: 'GLM-4', provider: 'zhipu' },
  { value: 'glm-3-turbo', label: 'GLM-3-Turbo', provider: 'zhipu' },
  { value: 'deepseek-chat', label: 'DeepSeek-Chat', provider: 'deepseek' },
  { value: 'deepseek-reasoner', label: 'DeepSeek-Reasoner', provider: 'deepseek' },
  { value: 'gpt-4', label: 'GPT-4', provider: 'openai' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5-Turbo', provider: 'openai' }
]
