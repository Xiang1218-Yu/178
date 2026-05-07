# FutureFlow - 现代化可视工作流引擎

FutureFlow 是一款基于 Web 的**低代码可视化工作流编辑器**。它采用了极简主义的现代设计风格（玻璃拟态、微交互），致力于提供流畅的逻辑编排体验。用户可以通过简单的拖拽操作，构建包含数据输入、逻辑判断和结果输出的复杂逻辑链路。

---

## ✨ 核心特性

### 1. 拖拽式可视化编排
- **自由画布**：无限大的工作区域，支持组件任意拖放布局。
- **智能连线 (Smart Connect)**：无需像素级对准端口，只需将连线拖拽至目标组件实体，系统即可自动吸附并建立连接。
- **高亮反馈**：拖拽过程中实时高亮可连接的目标，防止误操作。

### 2. 强大的组件系统
内置四类核心组件，满足基础逻辑构建需求：
- **# 数字输入 (Number Input)**: 提供数值源，支持整数与浮点数。
- **Aa 文字输入 (Text Input)**: 提供字符串数据源。
- **⚙️ 逻辑判断 (Logic Judge)**: 
    - 核心控制节点，支持配置操作符 (`>`, `<`, `==`, `>=`, `<=`) 和阈值。
    - **双路分支输出**：具备 **真 (True)** 和 **假 (False)** 两个独立输出端口，支持构建条件分支流程。不同分支的连线会自动以颜色区分（绿色为真，红色为假）。
- **👁️ 输出结果 (Output Result)**: 实时展示链路运行的最终结果，方便调试与验证。

### 3. 工程化与交互细节
- **全中文界面**：深度本地化，所有菜单、提示、按钮均为中文。
- **安全交互模式**：
    - **删除确认**：删除组件或连线时会弹出二次确认模态框，防止误删。
    - **防错机制**：自检测环路与非法连接（如禁止连接至无输入端口的组件）。
- **数据持久化**：支持将当前工作流保存到浏览器本地（Local Storage），刷新页面不丢失，支持随时读取。
- **实时运行引擎**：内置轻量级执行引擎，支持点击"运行"即时遍历图结构并计算结果。

### 4. 现代美学设计
- **设计语言**：以 Indigo/Slate 为主色调，融合现代 CSS 阴影与渐变。
- **响应式布局**：基于 Flexbox/Grid，适配不同屏幕尺寸。
- **无障碍体验**：清晰的字体排印（Inter Font）与对比度。

---

## 🛠️ 技术栈

- **Core**: Vanilla JavaScript (ES Module) - 无框架依赖，极致轻量。
- **Build Tool**: [Vite](https://vitejs.dev/) - 极速开发与构建体验。
- **Styling**: Native CSS3 + CSS Variables - 实现高性能动画与主题定制。
- **Rendering**: SVG - 用于绘制高性能、平滑的贝塞尔曲线连接线。

---

## 🚀 快速开始

### 环境依赖
请确保本地已安装 [Node.js](https://nodejs.org/) (推荐 v16+)。

### 安装与运行
1. **克隆/进入项目目录**
   ```bash
   cd 178
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   终端将输出访问地址（通常为 `http://localhost:5173` 或 `http://localhost:5177`）。

4. **构建生产版本**
   ```bash
   npm run build
   ```

---

## 📂 项目结构

```
178/
├── index.html          # 应用入口与页面骨架 (包含 Modal/Toolbar 结构)
├── package.json        # 项目依赖配置
├── public/             # 静态资源
└── src/
    ├── main.js         # 核心业务逻辑 (节点工厂、连线引擎、运行算法、事件处理)
    └── style.css       # 全局样式表 (包含 CSS 变量、组件样式、动画定义)
```

---

## 🔮 可扩展功能模块 (Expansion Modules)

以下功能模块基于现有架构可独立扩展，每个模块都具备完整的交互能力，且相互无依赖：

### 1. 数学运算组件 (Math Operator Node)
**功能描述**：提供基础数学运算能力，支持加、减、乘、除、取模、幂运算等操作。
- **输入端口**：2个（左操作数、右操作数）
- **输出端口**：1个（运算结果）
- **交互配置**：点击组件弹出配置面板，选择运算符类型
- **应用场景**：实现简单的计算器逻辑、数据转换、比例计算等

### 2. 定时触发器组件 (Timer Trigger Node)
**功能描述**：提供基于时间的流程触发能力，支持延时执行、周期性执行。
- **配置选项**：延时时间（毫秒）、是否循环、循环间隔
- **输出端口**：1个（到达触发条件时输出当前时间戳）
- **交互特性**：运行中显示倒计时动画，可手动触发/暂停
- **应用场景**：延迟任务、定时提醒、轮询检测等

### 3. 数据合并组件 (Data Merge Node)
**功能描述**：将多个输入源的数据合并为单一输出，支持数组拼接、对象合并。
- **输入端口**：动态多输入（2-5个）
- **输出端口**：1个（合并后的数据）
- **配置选项**：合并模式（数组/对象）、字段映射规则
- **应用场景**：聚合多个数据源、构建复杂数据结构

### 4. 变量存储组件 (Variable Store Node)
**功能描述**：提供工作流级别的状态存储，可在流程中读写变量。
- **模式切换**：读模式 / 写模式
- **配置选项**：变量名、默认值（写模式）
- **应用场景**：跨分支数据传递、状态保持、计数器实现

### 5. 随机生成器组件 (Random Generator Node)
**功能描述**：生成随机数据，支持随机数、随机布尔值、随机选项。
- **配置选项**：
  - 随机数：最小值、最大值、是否整数
  - 随机选项：预设选项列表
- **输出端口**：1个（生成的随机值）
- **应用场景**：模拟数据、随机决策、抽奖逻辑

### 6. 字符串处理组件 (String Processor Node)
**功能描述**：提供字符串操作能力，包括拼接、截取、替换、大小写转换等。
- **输入端口**：1-2个（主字符串、可选参数）
- **输出端口**：1个（处理后的字符串）
- **配置选项**：操作类型（拼接/截取/替换/转换）、参数值
- **应用场景**：文本格式化、数据清洗、动态内容生成

---

## 🔄 可迭代功能模块 (Iteration Modules)

以下功能基于现有组件进行增强迭代，提升用户体验和功能深度：

### 1. 节点多选与批量操作 (Multi-Selection & Batch Operations)
**迭代目标**：提升复杂工作流的操作效率
- **功能细节**：
  - 支持框选（Rubber Band Selection）多个节点
  - 选中节点显示统一边框高亮
  - 批量拖拽移动、批量删除（带确认）
  - 支持 Ctrl/Cmd 点击进行多选切换
- **交互优化**：选中状态下显示浮动工具栏，提供对齐、等距分布等快捷操作

### 2. 节点复制与粘贴 (Copy & Paste)
**迭代目标**：减少重复配置工作
- **功能细节**：
  - 支持 Ctrl+C / Ctrl+V 复制节点
  - 复制时保留节点的配置数据
  - 粘贴时自动偏移位置避免重叠
  - 支持跨工作流复制（基于剪贴板序列化）
- **扩展能力**：可导出为模板，在组件库中快速复用

### 3. 画布导航与缩略图 (Canvas Navigation & Minimap)
**迭代目标**：解决大型工作流的定位问题
- **功能细节**：
  - 右下角显示缩略图导航器
  - 缩略图中实时显示所有节点位置
  - 支持点击缩略图快速定位
  - 显示当前可视区域框，支持拖拽调整视野
- **附加功能**：画布缩放控制（放大/缩小/适应屏幕）

### 4. 运行历史与调试日志 (Execution History & Debug Log)
**迭代目标**：增强工作流的可调试性
- **功能细节**：
  - 底部面板显示运行日志
  - 记录每个节点的输入/输出值
  - 高亮显示执行路径（连线流动画）
  - 支持单步调试模式
- **数据展示**：时间戳、节点类型、执行耗时、数据快照

### 5. 工作流导入导出 (Import & Export)
**迭代目标**：实现工作流的跨环境迁移
- **功能细节**：
  - 导出为 JSON 文件下载
  - 支持从文件导入工作流
  - 导入时进行版本兼容性检查
  - 支持导出为图片（PNG/SVG）用于文档
- **安全机制**：导入时验证数据结构，防止恶意代码注入

### 6. 撤销重做系统 (Undo/Redo System)
**迭代目标**：提供安全的编辑体验
- **功能细节**：
  - 维护操作历史栈（最多50步）
  - 支持 Ctrl+Z / Ctrl+Y 快捷键
  - 记录的操作类型：添加节点、删除节点、移动节点、创建连接、删除连接、修改配置
- **状态管理**：每次操作后自动保存状态快照

---

## 💡 代码理解与重构建议

### 建议一：状态管理架构重构

#### 当前代码理解
当前项目采用单一全局状态对象 `state` 集中管理所有数据（节点、连线、交互状态），这种方式在小型项目中简洁有效，但随着功能扩展会面临以下问题：

1. **状态耦合度高**：UI 状态（draggingNode）与业务数据（nodes, connections）混合在一起
2. **变更追踪困难**：直接修改 state 对象，难以追踪数据变化来源
3. **副作用管理混乱**：渲染逻辑与状态更新逻辑紧密耦合

#### 重构方案
建议引入分层状态管理架构：

```javascript
// 分层状态结构示例
const store = {
  // 第一层：持久化数据层
  data: {
    nodes: [],
    connections: []
  },
  
  // 第二层：运行时状态层
  runtime: {
    executionResults: new Map(),
    selectedNodeIds: new Set(),
    executionPath: []
  },
  
  // 第三层：临时交互层
  interaction: {
    draggingNode: null,
    connecting: { active: false, ... },
    zoomLevel: 1,
    viewportOffset: { x: 0, y: 0 }
  }
};

// 引入发布订阅模式实现状态变更通知
class StateManager {
  constructor() {
    this.subscribers = new Map();
  }
  
  subscribe(key, callback) {
    // 订阅特定状态变更
  }
  
  dispatch(action) {
    // 统一状态变更入口，便于调试和中间件扩展
  }
}
```

#### 重构收益
- **可预测性**：所有状态变更通过统一入口，便于追踪和回放
- **可测试性**：业务逻辑与 UI 解耦，可独立测试状态流转
- **可扩展性**：新增功能时无需修改现有状态结构

---

### 建议二：组件系统插件化改造

#### 当前代码理解
当前节点渲染逻辑采用 `if-else` 分支判断节点类型，新增节点类型需要修改多处代码：
- `createNode` 函数中初始化数据
- `renderNode` 函数中渲染 UI
- `evaluateNode` 函数中定义执行逻辑

这种"集中式"设计违反了开闭原则，新增节点类型时需要侵入式修改核心文件。

#### 重构方案
建议实现插件化节点注册系统：

```javascript
// 节点类型注册中心
class NodeRegistry {
  constructor() {
    this.types = new Map();
  }
  
  register(type, definition) {
    this.types.set(type, {
      // 元数据
      metadata: definition.metadata,
      // 初始化函数
      initialize: definition.initialize || (() => ({})),
      // 渲染函数 - 返回 DOM 元素
      render: definition.render,
      // 执行函数 - 返回计算结果
      execute: definition.execute,
      // 配置面板渲染
      renderConfig: definition.renderConfig
    });
  }
  
  get(type) {
    return this.types.get(type);
  }
}

// 使用示例：注册新的节点类型
nodeRegistry.register('math-operator', {
  metadata: {
    icon: '🔢',
    title: '数学运算',
    category: 'data-processing'
  },
  initialize: () => ({ operator: '+', operand: 0 }),
  render: (node, container) => { /* 渲染逻辑 */ },
  execute: (inputs, config) => { /* 计算逻辑 */ }
});
```

#### 重构收益
- **开闭原则**：新增节点类型只需注册，无需修改核心代码
- **代码分割**：可将不同节点类型拆分为独立文件，实现懒加载
- **生态扩展**：第三方开发者可通过注册机制扩展节点类型

---

## 🧪 代码测试与工程化建议

### 建议一：建立分层测试体系

#### 现状分析
当前项目缺乏自动化测试，功能验证依赖手动操作，存在以下风险：
1. 重构时容易引入回归缺陷
2. 边界条件难以全面覆盖
3. 新功能开发缺乏安全网

#### 测试策略
建议建立三层测试体系：

**第一层：单元测试（Unit Tests）**
```javascript
// 测试节点执行逻辑
import { describe, it, expect } from 'vitest';
import { evaluateNode } from '@/core/executor';

describe('Logic Judge Node', () => {
  it('should return true branch when condition matches', () => {
    const node = {
      type: 'judge',
      data: { operator: '>', threshold: 10 }
    };
    const input = 15;
    expect(evaluateNode(node, input)).toEqual({ 
      value: 15, 
      isTrue: true 
    });
  });
  
  it('should detect circular dependencies', () => {
    const connections = [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'A' } // 循环
    ];
    expect(() => validateGraph(connections))
      .toThrow('Circular dependency detected');
  });
});
```

**第二层：集成测试（Integration Tests）**
```javascript
// 测试完整工作流执行
import { WorkflowEngine } from '@/core/engine';

describe('Workflow Execution', () => {
  it('should execute linear workflow correctly', async () => {
    const workflow = {
      nodes: [
        { id: 'input', type: 'input-num', data: { value: 100 } },
        { id: 'judge', type: 'judge', data: { operator: '>', threshold: 50 } },
        { id: 'output', type: 'output' }
      ],
      connections: [
        { from: 'input', to: 'judge' },
        { from: 'judge', to: 'output', sourceHandle: 'true' }
      ]
    };
    
    const engine = new WorkflowEngine(workflow);
    const results = await engine.execute();
    
    expect(results.get('output')).toBe(100);
  });
});
```

**第三层：端到端测试（E2E Tests）**
```javascript
// 使用 Playwright 测试用户交互
import { test, expect } from '@playwright/test';

test('user can create and execute workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // 拖拽创建节点
  const numInput = page.locator('[data-type="input-num"]');
  const workspace = page.locator('#workspace');
  await numInput.dragTo(workspace);
  
  // 配置节点
  await page.locator('.node input').fill('42');
  
  // 运行验证
  await page.click('#btn-run');
  await expect(page.locator('.toast')).toContainText('运行完成');
});
```

#### 实施步骤
1. 引入 Vitest 作为单元测试框架（与 Vite 生态一致）
2. 引入 Playwright 进行 E2E 测试
3. 在 CI/CD 流程中集成测试执行
4. 设定代码覆盖率门槛（建议 > 80%）

---

### 建议二：代码质量与工程规范

#### 现状分析
当前代码存在以下工程化改进空间：
1. 缺乏代码规范检查，风格不一致
2. 无类型系统，难以捕获潜在错误
3. 构建产物未优化，缺少代码分割

#### 改进方案

**1. 引入 TypeScript 类型系统**
```typescript
// 定义核心类型
interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: NodeData;
}

type NodeType = 'input-num' | 'input-text' | 'judge' | 'output';

interface Connection {
  id: string;
  from: string;
  to: string;
  sourceHandle?: 'default' | 'true' | 'false';
}

// 节点定义接口
interface NodeDefinition<T extends NodeData> {
  metadata: NodeMetadata;
  initialize: () => T;
  execute: (inputs: unknown[], config: T) => unknown;
}
```

**2. 配置 ESLint + Prettier**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    // 强制使用严格相等
    'eqeqeq': ['error', 'always'],
    // 禁止 console（生产环境）
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 强制使用分号
    'semi': ['error', 'always']
  }
};
```

**3. Git Hooks 与提交规范**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,ts}": ["eslint --fix", "prettier --write"]
  }
}
```

**4. 构建优化配置**
```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  build: {
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心运行时
          'core': ['./src/core/engine.ts'],
          // 节点类型按需加载
          'nodes': ['./src/nodes/index.ts']
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  plugins: [splitVendorChunkPlugin()]
});
```

#### 预期收益
- **类型安全**：编译期捕获 80% 以上的常见错误
- **代码一致性**：自动化格式检查，减少代码审查负担
- **构建优化**：按需加载，首屏加载时间减少 50%+
- **团队协作**：统一的提交规范，清晰的变更历史

---

## 📅 更新日志

### v1.2.0 (2026-01-24) - 逻辑增强版
- **主要更新**: 重构逻辑判断组件，支持 **True/False 分支输出**。
- **功能**:
    - 判断节点现在拥有两个独立的输出端口（绿色-真，红色-假）。
    - 运行引擎升级，支持根据条件判断结果选择性传输数据。
    - 新增全局防误触机制，删除操作增加确认弹窗。
- **修复**: 修复了新建按钮无响应、删除操作无效的问题。优化了连线路径的绘制算法。

### v1.1.0 (2026-01-24) - 体验优化版
- **本地化**: 界面全面汉化。
- **交互**: 引入"智能吸附"连线功能，提升操作效率。
- **视觉**: 增加高亮反馈与 Toast 提示组件。

### v1.0.0 (2026-01-24) - 初始版本
- 完成基础架构搭建 (Vite + JS)。
- 实现组件拖拽、基础连线与数值计算功能。
- 确立现代 UI 设计风格。

---

*Maintained by Antigravity AI*
