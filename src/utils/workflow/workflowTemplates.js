/**
 * 工作流模板定义
 */

import { AgentType } from './nodeTypes.js'
import { CollaborationMode } from './collaborationModes.js'

// 生成唯一ID
function generateId() {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 工作流模板
export const WORKFLOW_TEMPLATES = [
  {
    id: 'template_research_report',
    name: '研究报告撰写',
    description: '自动搜集资料并生成研究报告',
    icon: '📊',
    category: '内容创作',
    tags: ['研究', '写作', '报告'],
    collaborationMode: CollaborationMode.SEQUENTIAL,
    nodes: [
      {
        id: generateId(),
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: '开始' }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 150 },
        data: {
          label: '研究员',
          agentType: AgentType.RESEARCHER,
          config: {
            model: 'glm-4',
            tools: ['rag_search', 'web_search'],
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: '你是一个专业的研究员，擅长搜集和整理资料。'
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 500, y: 150 },
        data: {
          label: '撰稿人',
          agentType: AgentType.WRITER,
          config: {
            model: 'glm-4',
            tools: ['rag_search'],
            temperature: 0.8,
            maxTokens: 4000,
            systemPrompt: '你是一个专业的撰稿人，擅长撰写研究报告。'
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 700, y: 150 },
        data: {
          label: '审核员',
          agentType: AgentType.REVIEWER,
          config: {
            model: 'glm-4',
            tools: ['grammar_check', 'style_check'],
            temperature: 0.5,
            maxTokens: 1000,
            systemPrompt: '你是一个专业的审核员，擅长报告质量检查。'
          }
        }
      },
      {
        id: generateId(),
        type: 'end',
        position: { x: 900, y: 150 },
        data: { label: '结束' }
      }
    ],
    edges: [
      { source: 'start', target: 'agent1', type: 'default' },
      { source: 'agent1', target: 'agent2', type: 'default' },
      { source: 'agent2', target: 'agent3', type: 'default' },
      { source: 'agent3', target: 'end', type: 'default' }
    ]
  },
  {
    id: 'template_code_development',
    name: '代码开发流程',
    description: '需求分析、代码生成、代码审查',
    icon: '💻',
    category: '开发工具',
    tags: ['代码', '开发', '审查'],
    collaborationMode: CollaborationMode.SEQUENTIAL,
    nodes: [
      {
        id: generateId(),
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: '开始' }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 150 },
        data: {
          label: '研究员',
          agentType: AgentType.RESEARCHER,
          config: {
            model: 'glm-4',
            tools: ['web_search'],
            temperature: 0.7,
            maxTokens: 2000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 500, y: 150 },
        data: {
          label: '程序员',
          agentType: AgentType.CODER,
          config: {
            model: 'glm-4',
            tools: ['code_execute', 'documentation'],
            temperature: 0.3,
            maxTokens: 4000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 700, y: 150 },
        data: {
          label: '审核员',
          agentType: AgentType.REVIEWER,
          config: {
            model: 'glm-4',
            tools: ['grammar_check'],
            temperature: 0.5,
            maxTokens: 1000
          }
        }
      },
      {
        id: generateId(),
        type: 'end',
        position: { x: 900, y: 150 },
        data: { label: '结束' }
      }
    ],
    edges: []
  },
  {
    id: 'template_data_analysis',
    name: '数据分析报告',
    description: '数据分析并生成摘要报告',
    icon: '📈',
    category: '数据分析',
    tags: ['分析', '数据', '报告'],
    collaborationMode: CollaborationMode.SEQUENTIAL,
    nodes: [
      {
        id: generateId(),
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: '开始' }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 150 },
        data: {
          label: '分析师',
          agentType: AgentType.ANALYST,
          config: {
            model: 'glm-4',
            tools: ['db_query', 'calculator', 'chart_gen'],
            temperature: 0.5,
            maxTokens: 3000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 500, y: 150 },
        data: {
          label: '摘要员',
          agentType: AgentType.SUMMARIZER,
          config: {
            model: 'glm-4',
            tools: ['keyword_extract'],
            temperature: 0.6,
            maxTokens: 2000
          }
        }
      },
      {
        id: generateId(),
        type: 'end',
        position: { x: 700, y: 150 },
        data: { label: '结束' }
      }
    ],
    edges: []
  },
  {
    id: 'template_parallel_analysis',
    name: '多角度并行分析',
    description: '多角度并行分析后汇总',
    icon: '⚡',
    category: '高级协作',
    tags: ['并行', '分析', '汇总'],
    collaborationMode: CollaborationMode.PARALLEL,
    nodes: [
      {
        id: generateId(),
        type: 'start',
        position: { x: 100, y: 250 },
        data: { label: '开始' }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 100 },
        data: {
          label: '研究员',
          agentType: AgentType.RESEARCHER,
          config: {
            model: 'glm-4',
            tools: ['web_search'],
            temperature: 0.7,
            maxTokens: 2000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 200 },
        data: {
          label: '分析师',
          agentType: AgentType.ANALYST,
          config: {
            model: 'glm-4',
            tools: ['db_query', 'calculator'],
            temperature: 0.5,
            maxTokens: 2000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 300 },
        data: {
          label: '程序员',
          agentType: AgentType.CODER,
          config: {
            model: 'glm-4',
            tools: ['code_execute'],
            temperature: 0.3,
            maxTokens: 2000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 500, y: 200 },
        data: {
          label: '撰稿人',
          agentType: AgentType.WRITER,
          config: {
            model: 'glm-4',
            tools: [],
            temperature: 0.8,
            maxTokens: 3000
          }
        }
      },
      {
        id: generateId(),
        type: 'end',
        position: { x: 700, y: 200 },
        data: { label: '结束' }
      }
    ],
    edges: []
  },
  {
    id: 'template_translation',
    name: '文档翻译',
    description: '文档翻译和质量检查',
    icon: '🌐',
    category: '翻译',
    tags: ['翻译', '文档', '审核'],
    collaborationMode: CollaborationMode.SEQUENTIAL,
    nodes: [
      {
        id: generateId(),
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: '开始' }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 150 },
        data: {
          label: '翻译员',
          agentType: AgentType.TRANSLATOR,
          config: {
            model: 'glm-4',
            tools: ['dictionary', 'terminology'],
            temperature: 0.5,
            maxTokens: 4000
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 500, y: 150 },
        data: {
          label: '审核员',
          agentType: AgentType.REVIEWER,
          config: {
            model: 'glm-4',
            tools: ['grammar_check'],
            temperature: 0.5,
            maxTokens: 1000
          }
        }
      },
      {
        id: generateId(),
        type: 'end',
        position: { x: 700, y: 150 },
        data: { label: '结束' }
      }
    ],
    edges: []
  },
  {
    id: 'template_debate_decision',
    name: '辩论决策',
    description: '多方观点辩论后综合决策',
    icon: '💬',
    category: '高级协作',
    tags: ['辩论', '决策', '评审'],
    collaborationMode: CollaborationMode.DEBATE,
    nodes: [
      {
        id: generateId(),
        type: 'start',
        position: { x: 100, y: 250 },
        data: { label: '开始' }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 100 },
        data: {
          label: '观点A',
          agentType: AgentType.ANALYST,
          config: {
            model: 'glm-4',
            temperature: 0.7,
            maxTokens: 1500
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 200 },
        data: {
          label: '观点B',
          agentType: AgentType.ANALYST,
          config: {
            model: 'glm-4',
            temperature: 0.7,
            maxTokens: 1500
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 300, y: 300 },
        data: {
          label: '观点C',
          agentType: AgentType.ANALYST,
          config: {
            model: 'glm-4',
            temperature: 0.7,
            maxTokens: 1500
          }
        }
      },
      {
        id: generateId(),
        type: 'agent',
        position: { x: 500, y: 200 },
        data: {
          label: '仲裁者',
          agentType: AgentType.PLANNER,
          config: {
            model: 'glm-4',
            temperature: 0.5,
            maxTokens: 2000
          }
        }
      },
      {
        id: generateId(),
        type: 'end',
        position: { x: 700, y: 200 },
        data: { label: '结束' }
      }
    ],
    edges: []
  }
]

// 获取模板分类
export function getTemplateCategories() {
  const categories = new Set(WORKFLOW_TEMPLATES.map(t => t.category))
  return Array.from(categories).map(cat => ({
    value: cat,
    label: cat,
    templates: WORKFLOW_TEMPLATES.filter(t => t.category === cat)
  }))
}

// 获取所有模板
export function getAllTemplates() {
  return WORKFLOW_TEMPLATES
}

// 根据ID获取模板
export function getTemplateById(id) {
  return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

// 根据分类获取模板
export function getTemplatesByCategory(category) {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}
