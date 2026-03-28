/**
 * 知识图谱常量和类型定义
 */

// ==================== 命名空间类型 ====================
export const NamespaceType = {
  PERSONAL: 'personal',    // 个人知识
  DOMAIN: 'domain',        // 领域知识
  PROJECT: 'project',      // 项目知识
  GENERAL: 'general'       // 通用知识
}

export const NamespaceTypeLabels = {
  [NamespaceType.PERSONAL]: '个人知识',
  [NamespaceType.DOMAIN]: '领域知识',
  [NamespaceType.PROJECT]: '项目知识',
  [NamespaceType.GENERAL]: '通用知识'
}

// ==================== 实体类型 ====================
export const EntityType = {
  PERSON: 'Person',           // 人物
  ORGANIZATION: 'Organization', // 组织机构
  LOCATION: 'Location',       // 地点
  TIME: 'Time',              // 时间
  PRODUCT: 'Product',        // 产品
  CONCEPT: 'Concept',        // 概念
  EVENT: 'Event',            // 事件
  DOCUMENT: 'Document',      // 文档
  TECHNOLOGY: 'Technology',  // 技术
  NUMBER: 'Number'           // 数字
}

export const EntityTypeLabels = {
  [EntityType.PERSON]: '人物',
  [EntityType.ORGANIZATION]: '组织',
  [EntityType.LOCATION]: '地点',
  [EntityType.TIME]: '时间',
  [EntityType.PRODUCT]: '产品',
  [EntityType.CONCEPT]: '概念',
  [EntityType.EVENT]: '事件',
  [EntityType.DOCUMENT]: '文档',
  [EntityType.TECHNOLOGY]: '技术',
  [EntityType.NUMBER]: '数字'
}

// ==================== 实体类型配置 ====================
export const EntityTypeConfig = {
  [EntityType.PERSON]: {
    color: '#5B8FF9',
    icon: '👤',
    size: 30,
    shape: 'circle'
  },
  [EntityType.ORGANIZATION]: {
    color: '#61DDAA',
    icon: '🏢',
    size: 35,
    shape: 'rect'
  },
  [EntityType.LOCATION]: {
    color: '#F6BD16',
    icon: '📍',
    size: 28,
    shape: 'circle'
  },
  [EntityType.TIME]: {
    color: '#9270CA',
    icon: '🕐',
    size: 25,
    shape: 'circle'
  },
  [EntityType.PRODUCT]: {
    color: '#FF99C3',
    icon: '📦',
    size: 28,
    shape: 'rect'
  },
  [EntityType.CONCEPT]: {
    color: '#6DC8EC',
    icon: '💡',
    size: 26,
    shape: 'ellipse'
  },
  [EntityType.EVENT]: {
    color: '#FF6B6B',
    icon: '📅',
    size: 32,
    shape: 'diamond'
  },
  [EntityType.DOCUMENT]: {
    color: '#9E9E9E',
    icon: '📄',
    size: 24,
    shape: 'rect'
  },
  [EntityType.TECHNOLOGY]: {
    color: '#4ECDC4',
    icon: '⚙️',
    size: 28,
    shape: 'hexagon'
  },
  [EntityType.NUMBER]: {
    color: '#C9C9C9',
    icon: '🔢',
    size: 22,
    shape: 'circle'
  }
}

// ==================== 关系类型 ====================
export const RelationType = {
  KNOWS: 'KNOWS',               // 认识
  WORKS_FOR: 'WORKS_FOR',       // 工作
  PART_OF: 'PART_OF',           // 属于
  LOCATED_IN: 'LOCATED_IN',     // 位于
  CREATED_AT: 'CREATED_AT',     // 创建于
  RELATED_TO: 'RELATED_TO',     // 相关
  MENTIONS: 'MENTIONS',         // 提及
  DERIVED_FROM: 'DERIVED_FROM', // 派生自
  SIMILAR_TO: 'SIMILAR_TO',     // 相似
  CAUSES: 'CAUSES',             // 导致
  PRECEDES: 'PRECEDES'          // 先于
}

export const RelationTypeLabels = {
  [RelationType.KNOWS]: '认识',
  [RelationType.WORKS_FOR]: '工作于',
  [RelationType.PART_OF]: '属于',
  [RelationType.LOCATED_IN]: '位于',
  [RelationType.CREATED_AT]: '创建于',
  [RelationType.RELATED_TO]: '相关',
  [RelationType.MENTIONS]: '提及',
  [RelationType.DERIVED_FROM]: '派生自',
  [RelationType.SIMILAR_TO]: '相似',
  [RelationType.CAUSES]: '导致',
  [RelationType.PRECEDES]: '先于'
}

// ==================== 关系类型配置 ====================
export const RelationTypeConfig = {
  [RelationType.KNOWS]: {
    color: '#999',
    width: 2,
    dashArray: [],
    label: '认识'
  },
  [RelationType.WORKS_FOR]: {
    color: '#5B8FF9',
    width: 2,
    dashArray: [],
    label: '工作于'
  },
  [RelationType.PART_OF]: {
    color: '#61DDAA',
    width: 2,
    dashArray: [],
    label: '属于'
  },
  [RelationType.LOCATED_IN]: {
    color: '#F6BD16',
    width: 2,
    dashArray: [],
    label: '位于'
  },
  [RelationType.CREATED_AT]: {
    color: '#9270CA',
    width: 2,
    dashArray: [4, 4],
    label: '创建于'
  },
  [RelationType.RELATED_TO]: {
    color: '#6DC8EC',
    width: 1,
    dashArray: [],
    label: '相关'
  },
  [RelationType.MENTIONS]: {
    color: '#FF99C3',
    width: 1,
    dashArray: [],
    label: '提及'
  },
  [RelationType.DERIVED_FROM]: {
    color: '#4ECDC4',
    width: 2,
    dashArray: [2, 2],
    label: '派生自'
  },
  [RelationType.SIMILAR_TO]: {
    color: '#FF6B6B',
    width: 1,
    dashArray: [5, 5],
    label: '相似'
  },
  [RelationType.CAUSES]: {
    color: '#F6BD16',
    width: 2,
    dashArray: [],
    label: '导致'
  },
  [RelationType.PRECEDES]: {
    color: '#9E9E9E',
    width: 1,
    dashArray: [4, 4],
    label: '先于'
  }
}

// ==================== 图谱布局类型 ====================
export const GraphLayout = {
  FORCE: 'force',         // 力导向布局
  CIRCULAR: 'circular',   // 环形布局
  RADIAL: 'radial',       // 辐射布局
  DAGRE: 'dagre',         // 层次布局
  CONCENTRIC: 'concentric', // 同心圆布局
  GRID: 'grid'            // 网格布局
}

export const GraphLayoutLabels = {
  [GraphLayout.FORCE]: '力导向',
  [GraphLayout.CIRCULAR]: '环形',
  [GraphLayout.RADIAL]: '辐射',
  [GraphLayout.DAGRE]: '层次',
  [GraphLayout.CONCENTRIC]: '同心圆',
  [GraphLayout.GRID]: '网格'
}

// ==================== 图谱视图模式 ====================
export const GraphViewMode = {
  VIEW: 'view',           // 查看模式
  EDIT: 'edit'            // 编辑模式
}

// ==================== 节点状态 ====================
export const NodeState = {
  IDLE: 'idle',
  HOVER: 'hover',
  SELECTED: 'selected',
  EXPANDED: 'expanded',
  HIGHLIGHTED: 'highlighted',
  DIMMED: 'dimmed'
}

// ==================== 图谱缩放限制 ====================
export const GraphZoomLimits = {
  MIN: 0.1,
  MAX: 5,
  STEP: 0.1
}

// ==================== 默认配置 ====================
export const DEFAULT_GRAPH_CONFIG = {
  layout: GraphLayout.FORCE,
  nodeSize: 30,
  edgeWidth: 2,
  labelFontSize: 12,
  labelMaxWidth: 200,
  preventNodeOverlap: true,
  nodeSpacing: 50,
  linkDistance: 150,
  nodeStrength: -5000,
  edgeStrength: 0.1
}

// ==================== G6 主题配置 ====================
export const getG6Theme = (isDark = false) => ({
  // 节点样式
  node: {
    fill: isDark ? '#1e293b' : '#ffffff',
    stroke: isDark ? '#475569' : '#e2e8f0',
    lineWidth: 2,
    fillOpacity: 0.9
  },
  // 边样式
  edge: {
    stroke: isDark ? '#475569' : '#cbd5e1',
    lineWidth: 2,
    strokeOpacity: 0.6,
    endArrow: true
  },
  // 文本样式
  text: {
    fill: isDark ? '#f1f5f9' : '#1e293b',
    fontSize: 12
  },
  // 选中状态
  selected: {
    node: {
      lineWidth: 3,
      stroke: '#4f46e5',
      shadowColor: '#4f46e5',
      shadowBlur: 10
    },
    edge: {
      lineWidth: 3,
      stroke: '#4f46e5'
    }
  },
  // 悬停状态
  hover: {
    node: {
      lineWidth: 2,
      stroke: '#818cf8',
      cursor: 'pointer'
    },
    edge: {
      lineWidth: 2,
      stroke: '#818cf8',
      cursor: 'pointer'
    }
  }
})

// ==================== 工具函数 ====================

/**
 * 获取实体类型配置
 */
export const getEntityTypeConfig = (type) => {
  return EntityTypeConfig[type] || EntityTypeConfig[EntityType.CONCEPT]
}

/**
 * 获取关系类型配置
 */
export const getRelationTypeConfig = (type) => {
  return RelationTypeConfig[type] || RelationTypeConfig[RelationType.RELATED_TO]
}

/**
 * 获取实体颜色
 */
export const getEntityColor = (type) => {
  return getEntityTypeConfig(type).color
}

/**
 * 获取实体图标
 */
export const getEntityIcon = (type) => {
  return getEntityTypeConfig(type).icon
}

/**
 * 根据节点度数计算节点大小
 */
export const calculateNodeSize = (degree, baseSize = 25) => {
  const minSize = baseSize
  const maxSize = baseSize * 2
  const size = minSize + Math.log(degree + 1) * 5
  return Math.min(size, maxSize)
}

/**
 * 根据关系权重计算边的宽度
 */
export const calculateEdgeWidth = (weight = 1, baseWidth = 1) => {
  const minWidth = baseWidth
  const maxWidth = baseWidth * 3
  const width = minWidth + Math.log(weight + 1) * 0.5
  return Math.min(width, maxWidth)
}

/**
 * 生成G6节点数据
 */
export const generateG6Node = (entity, degree = 0) => {
  const config = getEntityTypeConfig(entity.type)
  return {
    id: entity.id,
    label: entity.label || entity.name,
    type: config.shape,
    style: {
      fill: config.color,
      stroke: config.color,
      lineWidth: 2
    },
    size: calculateNodeSize(degree, config.size),
    data: entity,
    // 自定义属性
    entityType: entity.type,
    icon: config.icon,
    degree
  }
}

/**
 * 生成G6边数据
 */
export const generateG6Edge = (relation) => {
  const config = getRelationTypeConfig(relation.type || RelationType.RELATED_TO)
  return {
    id: relation.id,
    source: relation.source,
    target: relation.target,
    label: config.label,
    style: {
      stroke: config.color,
      lineWidth: calculateEdgeWidth(relation.weight, config.width),
      lineDash: config.dashArray,
      endArrow: true
    },
    data: relation,
    // 自定义属性
    relationType: relation.type
  }
}
