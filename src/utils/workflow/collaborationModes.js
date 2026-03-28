/**
 * 协作模式定义
 */

// 协作模式枚举
export const CollaborationMode = {
  SEQUENTIAL: 'sequential',      // 顺序
  PARALLEL: 'parallel',          // 并行
  HIERARCHICAL: 'hierarchical',  // 层次
  CONDITIONAL: 'conditional',    // 条件
  LOOP: 'loop',                  // 循环
  DEBATE: 'debate'               // 辩论
}

// 协作模式配置
export const COLLABORATION_MODES = {
  [CollaborationMode.SEQUENTIAL]: {
    name: '顺序协作',
    nameEn: 'Sequential',
    icon: '📋',
    description: 'Agent依次执行，前一个完成后再执行下一个',
    color: '#3b82f6',
    example: 'Start → Agent1 → Agent2 → Agent3 → End',
    scenarios: ['报告撰写', '数据清洗流程', '文档处理流程']
  },
  [CollaborationMode.PARALLEL]: {
    name: '并行协作',
    nameEn: 'Parallel',
    icon: '⚡',
    description: '多个Agent同时执行，所有完成后汇总',
    color: '#10b981',
    example: 'Start → [Agent1, Agent2, Agent3] → Aggregator → End',
    scenarios: ['多角度分析', '并行数据采集', '批量处理']
  },
  [CollaborationMode.HIERARCHICAL]: {
    name: '层次协作',
    nameEn: 'Hierarchical',
    icon: '🏛️',
    description: '管理者分配任务，工作者执行，管理者汇总',
    color: '#8b5cf6',
    example: 'Manager ↔ [Worker1, Worker2, Worker3]',
    scenarios: ['项目管理', '任务分解', '代码审查流程']
  },
  [CollaborationMode.CONDITIONAL]: {
    name: '条件协作',
    nameEn: 'Conditional',
    icon: '🔀',
    description: '根据条件选择执行不同的分支',
    color: '#f59e0b',
    example: 'Condition → [BranchA | BranchB | BranchC]',
    scenarios: ['智能路由', '分类处理', '异常处理']
  },
  [CollaborationMode.LOOP]: {
    name: '循环协作',
    nameEn: 'Loop',
    icon: '🔄',
    description: '重复执行直到满足退出条件',
    color: '#06b6d4',
    example: 'Agent → Condition ─┬─→ End (满足)',
    scenarios: ['迭代优化', '数据重试', '增量处理']
  },
  [CollaborationMode.DEBATE]: {
    name: '辩论协作',
    nameEn: 'Debate',
    icon: '💬',
    description: '多个Agent同时处理，仲裁者综合决策',
    color: '#ec4899',
    example: '[Agent1, Agent2, Agent3] → Arbiter → End',
    scenarios: ['方案评审', '决策讨论', '多观点综合']
  }
}

// 获取协作模式配置
export function getCollaborationModeConfig(mode) {
  return COLLABORATION_MODES[mode] || COLLABORATION_MODES[CollaborationMode.SEQUENTIAL]
}

// 获取所有协作模式列表
export function getCollaborationModes() {
  return Object.keys(CollaborationMode).map(key => ({
    value: CollaborationMode[key],
    ...COLLABORATION_MODES[CollaborationMode[key]]
  }))
}

// 协作模式参数配置模板
export const MODE_PARAMS_TEMPLATE = {
  [CollaborationMode.SEQUENTIAL]: {
    timeout: 300000,        // 5分钟超时
    retryOnError: true,     // 错误重试
    maxRetries: 3,          // 最大重试次数
    stopOnError: false      // 遇到错误是否停止
  },
  [CollaborationMode.PARALLEL]: {
    maxConcurrency: 3,      // 最大并发数
    timeout: 300000,
    retryOnError: true,
    maxRetries: 3,
    stopOnError: false,
    waitAll: true           // 等待所有完成
  },
  [CollaborationMode.HIERARCHICAL]: {
    managerNode: '',        // 管理者节点ID
    workerNodes: [],        // 工作者节点ID列表
    timeout: 300000,
    retryOnError: true,
    maxRetries: 3
  },
  [CollaborationMode.CONDITIONAL]: {
    defaultBranch: '',      // 默认分支
    conditions: []          // 条件配置 [{expression, targetNodeId}]
  },
  [CollaborationMode.LOOP]: {
    maxIterations: 10,      // 最大循环次数
    exitCondition: '',      // 退出条件表达式
    timeout: 300000
  },
  [CollaborationMode.DEBATE]: {
    debaters: [],           // 辩手节点ID列表
    arbiterNode: '',        // 仲裁者节点ID
    maxRounds: 3,           // 最大辩论轮数
    timeout: 300000
  }
}
