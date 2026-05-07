import './style.css';

// --- Global State ---
const state = {
  nodes: [],       // Array of node objects
  connections: [], // Array of { id, from: nodeId, to: nodeId, sourceHandle }
  nextId: 1,

  // Interaction State
  draggingNode: null,
  dragOffset: { x: 0, y: 0 },

  // Merge Modal State
  mergeConfigNodeId: null,

  connecting: {
    active: false,
    startNodeId: null,
    sourceHandle: null, // 'default', 'true', 'false'
    targetHandle: null, // 'in-0', 'in-1', ... for merge ports
    startX: 0,
    startY: 0
  }
};

// --- DOM Elements ---
const workspace = document.getElementById('workspace');
const nodesContainer = document.getElementById('nodes-container');
const connectionsLayer = document.getElementById('connections-layer');
const palette = document.getElementById('palette');
const toastEl = document.getElementById('toast');

// Modal Elements
const modal = document.getElementById('modal-overlay');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalSave = document.getElementById('btn-modal-save');
const closeModal = document.querySelector('.close-modal');
const judgeOperator = document.getElementById('judge-operator');
const judgeValue = document.getElementById('judge-value');

// Confirm Modal Elements
const confirmModal = document.getElementById('confirm-modal-overlay');
const confirmMsg = document.getElementById('confirm-message');
const btnConfirmOk = document.getElementById('btn-confirm-ok');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
const closeConfirm = document.querySelector('.close-confirm');

// Merge Modal Elements
const mergeModal = document.getElementById('merge-modal-overlay');
const mergeModeSelect = document.getElementById('merge-mode');
const mergeInputCount = document.getElementById('merge-input-count');
const mergeFieldMappings = document.getElementById('merge-field-mappings');
const btnMergeModalCancel = document.getElementById('btn-merge-modal-cancel');
const btnMergeModalSave = document.getElementById('btn-merge-modal-save');
const closeMergeModal = document.querySelector('.close-merge-modal');

// --- Helper Functions ---
const generateId = () => `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 3000);
}

// Confirm Modal Logic
let pendingConfirmCallback = null;

function showConfirm(message, callback) {
  confirmMsg.textContent = message;
  pendingConfirmCallback = callback;
  confirmModal.classList.remove('hidden');
}

function hideConfirm() {
  confirmModal.classList.add('hidden');
  pendingConfirmCallback = null;
}

// --- App Initialization ---
function init() {
  setupEventListeners();
  render();
}

function setupEventListeners() {
  // 1. Sidebar Drag Start (New Node)
  palette.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', e.target.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
  });

  // 2. Workspace Drag Over
  workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  // 3. Workspace Drop (Create Node)
  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type) {
      const rect = workspace.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createNode(type, x, y);
    }
  });

  // 4. Workspace Mouse Events
  workspace.addEventListener('mousemove', handleMouseMove);
  workspace.addEventListener('mouseup', handleMouseUp);

  // 5. Toolbar Buttons
  document.getElementById('btn-new').addEventListener('click', newWorkflow);
  document.getElementById('btn-save').addEventListener('click', saveWorkflow);
  document.getElementById('btn-load').addEventListener('click', loadWorkflow);
  document.getElementById('btn-run').addEventListener('click', runWorkflow);

  // 6. Modals
  btnModalCancel.addEventListener('click', hideModal);
  closeModal.addEventListener('click', hideModal);
  btnModalSave.addEventListener('click', saveNodeConfig);

  // Confirm Modal Listeners
  btnConfirmOk.addEventListener('click', () => {
    if (pendingConfirmCallback) pendingConfirmCallback();
    hideConfirm();
  });
  btnConfirmCancel.addEventListener('click', hideConfirm);
  closeConfirm.addEventListener('click', hideConfirm);

  // Merge Modal Listeners
  btnMergeModalCancel.addEventListener('click', hideMergeModal);
  closeMergeModal.addEventListener('click', hideMergeModal);
  btnMergeModalSave.addEventListener('click', saveMergeConfig);
  mergeInputCount.addEventListener('input', renderMergeFieldMappings);
  mergeModeSelect.addEventListener('change', renderMergeFieldMappings);
}

// --- Core Logic: Nodes ---

function createNode(type, x, y, id = null, data = {}) {
  const node = {
    id: id || generateId(),
    type,
    x: x - 100, // Center the node roughly
    y: y - 40,
    data: { ...data }, // Stores values, config, result
    inputs: [],
    outputs: []
  };

  // Initialize data based on type
  if (type === 'input-num') {
    node.data.value = node.data.value || 0;
  } else if (type === 'input-text') {
    node.data.value = node.data.value || '';
  } else if (type === 'judge') {
    node.data.operator = node.data.operator || '>';
    node.data.threshold = node.data.threshold || 0;
  } else if (type === 'merge') {
    // 数据合并组件：初始化合并模式、输入端口数量和字段映射规则
    node.data.mergeMode = node.data.mergeMode || 'concat';
    node.data.inputCount = node.data.inputCount || 2;
    node.data.fieldMappings = node.data.fieldMappings || [];
  }

  state.nodes.push(node);
  renderNode(node);
}

function renderNode(node) {
  const el = document.createElement('div');
  el.className = 'node';
  el.id = node.id;
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;

  // Icon & Title Map (Chinese)
  const meta = {
    'input-num': { icon: '#', title: '数字输入' },
    'input-text': { icon: 'Aa', title: '文字输入' },
    'judge': { icon: '⚙️', title: '逻辑判断' },
    'merge': { icon: '🔗', title: '数据合并' },
    'output': { icon: '👁️', title: '输出结果' }
  };
  const info = meta[node.type];

  // Header
  const header = document.createElement('div');
  header.className = 'node-header';
  header.innerHTML = `
    <span class="node-title"><span class="comp-icon" style="width:24px;height:24px;font-size:0.8rem">${info.icon}</span> ${info.title}</span>
    <button class="btn-delete" style="border:none;background:none;cursor:pointer;color:#ef4444;">&times;</button>
  `;

  // Dragging start
  header.addEventListener('mousedown', (e) => {
    // Only drag if not clicking buttons/inputs
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
      state.draggingNode = node.id;
      const rect = el.getBoundingClientRect();
      state.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      el.classList.add('selected');
    }
  });

  // Delete with Confirm
  header.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    showConfirm('确定要删除这个组件吗？', () => {
      deleteNode(node.id);
    });
  });

  el.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'node-body';

  if (node.type === 'input-num') {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'node-input';
    input.value = node.data.value;
    input.placeholder = '请输入数字';
    input.addEventListener('input', (e) => { node.data.value = Number(e.target.value); });
    body.appendChild(input);
  } else if (node.type === 'input-text') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'node-input';
    input.value = node.data.value;
    input.placeholder = '请输入文字';
    input.addEventListener('input', (e) => { node.data.value = e.target.value; });
    body.appendChild(input);
  } else if (node.type === 'judge') {
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.style.width = '100%';
    btn.textContent = `配置: ${node.data.operator} ${node.data.threshold}`;
    btn.addEventListener('click', () => openJudgeConfig(node));
    body.appendChild(btn);
  } else if (node.type === 'merge') {
    // 数据合并组件主体：显示合并模式、输入源数量及配置按钮
    const modeLabel = node.data.mergeMode === 'concat' ? '数组拼接' : '对象合并';
    const infoDiv = document.createElement('div');
    infoDiv.className = 'merge-node-info';
    infoDiv.innerHTML = `
      <div class="merge-info-row"><span>模式:</span> <strong>${modeLabel}</strong></div>
      <div class="merge-info-row"><span>输入源:</span> <strong>${node.data.inputCount} 个</strong></div>
    `;
    body.appendChild(infoDiv);

    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.style.width = '100%';
    btn.textContent = '配置合并规则';
    btn.addEventListener('click', () => openMergeConfig(node));
    body.appendChild(btn);
  } else if (node.type === 'output') {
    const resultBox = document.createElement('div');
    resultBox.className = 'node-result';
    resultBox.id = `res-${node.id}`;
    resultBox.textContent = node.data.result !== undefined ? node.data.result : '等待运行...';
    body.appendChild(resultBox);
  }

  el.appendChild(body);

  // Input Port (Left) - Not for sources
  if (node.type !== 'input-num' && node.type !== 'input-text') {
    if (node.type === 'merge') {
      // 数据合并组件：渲染多个输入端口，纵向均匀分布
      const inputCount = node.data.inputCount || 2;
      for (let i = 0; i < inputCount; i++) {
        const inPort = document.createElement('div');
        inPort.className = 'port input-port merge-input-port';
        inPort.dataset.nodeId = node.id;
        inPort.dataset.handle = `in-${i}`;
        inPort.title = `输入源 ${i + 1}`;
        // 动态计算端口的纵向位置百分比
        const topPercent = inputCount === 1 ? 50 : (20 + (60 * i / (inputCount - 1)));
        inPort.style.top = `${topPercent}%`;
        el.appendChild(inPort);

        // 端口序号标签
        const portLabel = document.createElement('div');
        portLabel.className = 'port-label';
        portLabel.style.top = `${topPercent}%`;
        portLabel.style.transform = 'translateY(-50%)';
        portLabel.textContent = `${i + 1}`;
        el.appendChild(portLabel);
      }
    } else {
      const inPort = document.createElement('div');
      inPort.className = 'port input-port';
      inPort.dataset.nodeId = node.id;
      el.appendChild(inPort);
    }
  }

  // Output Ports (Right/Branching)
  if (node.type === 'judge') {
    // Two ports for Logic Judge
    const truePort = document.createElement('div');
    truePort.className = 'port output-port true-port';
    truePort.dataset.nodeId = node.id;
    truePort.dataset.handle = 'true';
    truePort.title = '真 (True)';
    truePort.addEventListener('mousedown', (e) => { e.stopPropagation(); startConnection(node.id, e, 'true'); });
    el.appendChild(truePort);

    const falsePort = document.createElement('div');
    falsePort.className = 'port output-port false-port';
    falsePort.dataset.nodeId = node.id;
    falsePort.dataset.handle = 'false';
    falsePort.title = '假 (False)';
    falsePort.addEventListener('mousedown', (e) => { e.stopPropagation(); startConnection(node.id, e, 'false'); });
    el.appendChild(falsePort);
  } else if (node.type !== 'output') {
    // Standard Port
    const outPort = document.createElement('div');
    outPort.className = 'port output-port';
    outPort.dataset.nodeId = node.id;
    outPort.dataset.handle = 'default';
    outPort.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startConnection(node.id, e, 'default');
    });
    el.appendChild(outPort);
  }

  nodesContainer.appendChild(el);
}

function deleteNode(id) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.connections = state.connections.filter(c => c.from !== id && c.to !== id);
  // Remove element from DOM
  const el = document.getElementById(id);
  if (el) el.remove();
  updateConnections();
}

// --- Logic: Connections ---

function startConnection(nodeId, e, handleType) {
  const rect = workspace.getBoundingClientRect();
  state.connecting.active = true;
  state.connecting.startNodeId = nodeId;
  state.connecting.sourceHandle = handleType; // 'default', 'true', 'false'
  state.connecting.startX = e.clientX - rect.left;
  state.connecting.startY = e.clientY - rect.top;
}

function completeConnection(targetNodeId, targetHandle = null) {
  if (state.connecting.active && state.connecting.startNodeId !== targetNodeId) {
    const targetNode = state.nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return;

    // Prevent connecting to Input nodes (they have no inputs)
    if (targetNode.type === 'input-num' || targetNode.type === 'input-text') {
      showToast('该组件不能作为输入目标');
      state.connecting.active = false;
      renderTempLine(null, null);
      return;
    }

    // 数据合并组件：限制每个输入端口只能接收一条连接
    if (targetNode.type === 'merge' && targetHandle) {
      const portOccupied = state.connections.find(c =>
        c.to === targetNodeId && c.targetHandle === targetHandle
      );
      if (portOccupied) {
        showToast('该输入端口已被连接');
        state.connecting.active = false;
        renderTempLine(null, null);
        return;
      }
    }

    // Check if exists (considering handle)
    const exists = state.connections.find(c =>
      c.from === state.connecting.startNodeId &&
      c.to === targetNodeId &&
      c.sourceHandle === state.connecting.sourceHandle &&
      c.targetHandle === targetHandle
    );

    if (!exists) {
      state.connections.push({
        id: `conn-${Date.now()}`,
        from: state.connecting.startNodeId,
        to: targetNodeId,
        sourceHandle: state.connecting.sourceHandle,
        targetHandle: targetHandle
      });
      updateConnections();
    } else {
      showToast('连接已存在');
    }
  }
  state.connecting.active = false;
  renderTempLine(null, null);
  document.querySelectorAll('.node.highlight').forEach(n => n.classList.remove('highlight'));
}

function handleMouseMove(e) {
  const rect = workspace.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Dragging Node
  if (state.draggingNode) {
    const node = state.nodes.find(n => n.id === state.draggingNode);
    if (node) {
      node.x = x - state.dragOffset.x;
      node.y = y - state.dragOffset.y;

      const el = document.getElementById(node.id);
      if (el) {
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }
      updateConnections();
    }
  }

  // Dragging Connection
  if (state.connecting.active) {
    renderTempLine(x, y);

    // Visual Feedback
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    const nodeEl = elUnder?.closest('.node');

    // Clear previous highlight
    document.querySelectorAll('.node.highlight').forEach(n => n.classList.remove('highlight'));

    if (nodeEl) {
      const targetId = nodeEl.id;
      if (targetId !== state.connecting.startNodeId) {
        nodeEl.classList.add('highlight');
      }
    }
  }
}

function handleMouseUp(e) {
  state.draggingNode = null;

  if (state.connecting.active) {
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    const nodeEl = elUnder?.closest('.node');

    if (nodeEl) {
      // 检测是否点击在数据合并组件的某个输入端口上
      const portEl = elUnder?.closest('.merge-input-port');
      const targetHandle = portEl ? portEl.dataset.handle : null;
      completeConnection(nodeEl.id, targetHandle);
    } else {
      state.connecting.active = false;
      renderTempLine(null, null);
    }

    document.querySelectorAll('.node.highlight').forEach(n => n.classList.remove('highlight'));
  }

  document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
}

// --- Rendering Lines ---

function updateConnections() {
  connectionsLayer.innerHTML = '';

  state.connections.forEach(conn => {
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;

    const startPoint = getPortPosition(conn.from, 'output', conn.sourceHandle);
    // 数据合并组件：使用targetHandle定位具体的输入端口
    const endPoint = getPortPosition(conn.to, 'input', conn.targetHandle || null);

    if (startPoint && endPoint) {
      const path = createPath(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
      path.setAttribute('data-id', conn.id);

      // Color code lines from logic
      if (conn.sourceHandle === 'true') {
        path.setAttribute('stroke', '#10b981'); // Green
      } else if (conn.sourceHandle === 'false') {
        path.setAttribute('stroke', '#ef4444'); // Red
      }

      // Delete on click with Confirm
      path.addEventListener('click', (e) => {
        showConfirm('确定要删除这条连接吗？', () => {
          state.connections = state.connections.filter(c => c.id !== conn.id);
          updateConnections();
        });
      });

      connectionsLayer.appendChild(path);
    }
  });
}

function getPortPosition(nodeId, type, handle = null) {
  const nodeEl = document.getElementById(nodeId);
  if (!nodeEl) return null;

  let selector = `.${type}-port`;
  // Narrow down if handle is specified and not default
  if (type === 'output' && handle && handle !== 'default') {
    selector += `[data-handle="${handle}"]`;
  }
  // 数据合并组件：根据targetHandle定位具体的输入端口
  if (type === 'input' && handle) {
    selector += `[data-handle="${handle}"]`;
  }

  const portEl = nodeEl.querySelector(selector);
  if (!portEl) return null;

  const wsRect = workspace.getBoundingClientRect();
  const portRect = portEl.getBoundingClientRect();

  return {
    x: portRect.left - wsRect.left + (portRect.width / 2),
    y: portRect.top - wsRect.top + (portRect.height / 2)
  };
}

function createPath(x1, y1, x2, y2) {
  const ns = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(ns, 'path');

  // Bezier Curve
  const dist = Math.abs(x2 - x1) * 0.5;
  const c1 = x1 + Math.max(dist, 50);
  const c2 = x2 - Math.max(dist, 50);

  const d = `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;

  path.setAttribute('d', d);
  return path;
}

let tempPath = null;
function renderTempLine(endX, endY) {
  if (tempPath) {
    tempPath.remove();
    tempPath = null;
  }

  if (endX === null) return;

  const startPoint = getPortPosition(state.connecting.startNodeId, 'output', state.connecting.sourceHandle);
  if (!startPoint) return;

  tempPath = createPath(startPoint.x, startPoint.y, endX, endY);
  tempPath.setAttribute('stroke-dasharray', '5,5');
  tempPath.style.opacity = '0.6';
  connectionsLayer.appendChild(tempPath);
}


// --- Logic: Execution ---

function runWorkflow() {
  showToast('正在运行工作流...');

  try {
    // Reset outputs
    state.nodes.forEach(n => {
      if (n.type === 'output') {
        n.data.result = '...';
        const el = document.getElementById(`res-${n.id}`);
        if (el) el.textContent = '...';
      }
    });

    const outputNodes = state.nodes.filter(n => n.type === 'output');

    // Slight delay to allow UI to show '...'
    setTimeout(() => {
      outputNodes.forEach(outNode => {
        const val = evaluateNode(outNode.id);
        // Check for explicit blocked state (null means flow stopped)
        let displayVal = val;
        if (val === null || val === undefined) {
          displayVal = '未触发/无值';
        }

        outNode.data.result = displayVal;
        const el = document.getElementById(`res-${outNode.id}`);
        if (el) {
          // 对象和数组使用JSON格式化展示，基础类型直接转字符串
          if (displayVal !== null && displayVal !== undefined && typeof displayVal === 'object') {
            el.textContent = JSON.stringify(displayVal, null, 2);
          } else {
            el.textContent = String(displayVal);
          }
        }
      });
      showToast('运行完成');
    }, 100);

  } catch (e) {
    console.error(e);
    showToast('运行出错（请检查控制台）');
  }
}

function evaluateNode(nodeId, visited = new Set()) {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // 1. Inputs: Return raw value
  if (node.type === 'input-num' || node.type === 'input-text') {
    return node.data.value;
  }

  // 数据合并组件：收集所有输入端口的连接数据并合并
  if (node.type === 'merge') {
    return evaluateMergeNode(node, visited);
  }

  // 2. Find input source connection
  const conn = state.connections.find(c => c.to === nodeId);
  if (!conn) return null; // No input

  const inputData = evaluateNode(conn.from, visited);

  // 3. Check source type for branching reasoning
  const sourceNode = state.nodes.find(n => n.id === conn.from);

  if (sourceNode.type === 'judge') {
    // If input comes from a Judge, we expect an object: { value, isTrue }
    if (inputData && typeof inputData === 'object' && 'isTrue' in inputData) {
      const { value, isTrue } = inputData;

      // Branching Logic
      if (conn.sourceHandle === 'true') {
        return isTrue ? value : null; // Pass only if True
      }
      if (conn.sourceHandle === 'false') {
        return !isTrue ? value : null; // Pass only if False
      }
      // Fallback for default handle (if any)
      return value;
    }
    return null; // Judge failed to return valid struct
  }

  // If input data is null (blocked by previous chain), propagate null
  if (inputData === null) return null;

  // 4. Current Node Processing
  if (node.type === 'judge') {
    // Judge expects a Value (Number compatible usually) to compare
    // Logic
    const op = node.data.operator;
    const th = node.data.threshold;
    let res = false;
    const numIn = Number(inputData);
    const numTh = Number(th);

    switch (op) {
      case '>': res = numIn > numTh; break;
      case '<': res = numIn < numTh; break;
      case '==': res = numIn == numTh; break;
      case '>=': res = numIn >= numTh; break;
      case '<=': res = numIn <= numTh; break;
    }

    // Return structured result for next consumer
    return { value: inputData, isTrue: res };
  }

  if (node.type === 'output') {
    return inputData;
  }

  return inputData;
}

/**
 * 数据合并组件的求值逻辑：
 * 根据合并模式（数组拼接或对象合并）和字段映射规则，
 * 将多个输入源的数据合并为单一输出
 */
function evaluateMergeNode(node, visited) {
  const inputCount = node.data.inputCount || 2;
  const mergeMode = node.data.mergeMode || 'concat';
  const fieldMappings = node.data.fieldMappings || [];

  // 收集各输入端口的数据
  const inputValues = [];
  for (let i = 0; i < inputCount; i++) {
    const portHandle = `in-${i}`;
    const conn = state.connections.find(c => c.to === node.id && c.targetHandle === portHandle);
    if (conn) {
      // 为每个输入源创建独立的visited副本，避免不同分支间互相干扰
      const branchVisited = new Set(visited);
      const data = evaluateNode(conn.from, branchVisited);

      // 处理来自逻辑判断组件的数据，提取实际值
      let actualData = data;
      if (data && typeof data === 'object' && 'isTrue' in data) {
        // 如果该连接来自判断组件的分支端口，只有条件成立时才取值
        if (conn.sourceHandle === 'true') {
          actualData = data.isTrue ? data.value : null;
        } else if (conn.sourceHandle === 'false') {
          actualData = !data.isTrue ? data.value : null;
        } else {
          actualData = data.value;
        }
      }

      inputValues.push(actualData);
    } else {
      inputValues.push(null);
    }
  }

  // 检查是否有至少一个非空输入
  const hasValidInput = inputValues.some(v => v !== null && v !== undefined);
  if (!hasValidInput) return null;

  // 根据合并模式执行合并操作
  if (mergeMode === 'concat') {
    // 数组拼接模式：将所有输入值拼接为一个数组
    return inputValues.filter(v => v !== null && v !== undefined);
  }

  if (mergeMode === 'merge') {
    // 对象合并模式：依据字段映射规则将输入数据合并为一个对象
    const result = {};
    for (let i = 0; i < inputValues.length; i++) {
      const inputValue = inputValues[i];
      const mapping = fieldMappings[i];

      if (inputValue === null || inputValue === undefined) continue;

      if (mapping && mapping.targetField) {
        // 有映射规则：将输入值赋值到指定的目标字段名
        result[mapping.targetField] = inputValue;
      } else {
        // 无映射规则：使用默认字段名 input0, input1, ...
        result[`input${i}`] = inputValue;
      }
    }
    return result;
  }

  return null;
}

// --- Persistence ---

function saveWorkflow() {
  const data = JSON.stringify({ nodes: state.nodes, connections: state.connections });
  localStorage.setItem('workflow-178', data);
  showToast('工作流已保存!');
}

function loadWorkflow() {
  const data = localStorage.getItem('workflow-178');
  if (data) {
    const parsed = JSON.parse(data);
    state.nodes = parsed.nodes;
    state.connections = parsed.connections;
    state.nextId = Date.now();
    render();
    showToast('工作流已加载');
  } else {
    showToast('没有找到保存的工作流');
  }
}

function newWorkflow() {
  showConfirm('确定要清空当前工作流吗？', () => {
    state.nodes = [];
    state.connections = [];
    render();
  });
}

function render() {
  nodesContainer.innerHTML = '';
  connectionsLayer.innerHTML = '';
  state.nodes.forEach(renderNode);
  updateConnections();
}


// --- Modal Handlers ---

function openJudgeConfig(node) {
  state.configNodeId = node.id;
  judgeOperator.value = node.data.operator;
  judgeValue.value = node.data.threshold;
  modal.classList.remove('hidden');
}

function hideModal() {
  modal.classList.add('hidden');
  state.configNodeId = null;
}

function saveNodeConfig() {
  if (state.configNodeId) {
    const node = state.nodes.find(n => n.id === state.configNodeId);
    if (node) {
      node.data.operator = judgeOperator.value;
      node.data.threshold = judgeValue.value;
      // Update UI button text
      const el = document.getElementById(node.id);
      if (el) {
        const btn = el.querySelector('button');
        if (btn) btn.textContent = `配置: ${node.data.operator} ${node.data.threshold}`;
      }
    }
  }
  hideModal();
}

// --- Merge Modal Handlers ---

/**
 * 打开数据合并组件的配置弹窗
 * 将当前节点的配置数据回显到表单中
 */
function openMergeConfig(node) {
  state.mergeConfigNodeId = node.id;

  // 回显合并模式
  mergeModeSelect.value = node.data.mergeMode || 'concat';

  // 回显输入源数量，限制在2~5范围内
  const count = Math.max(2, Math.min(5, node.data.inputCount || 2));
  mergeInputCount.value = count;

  // 渲染字段映射规则输入行
  renderMergeFieldMappings();

  // 回显已有的字段映射值
  const mappings = node.data.fieldMappings || [];
  const mappingInputs = mergeFieldMappings.querySelectorAll('.merge-mapping-input');
  mappingInputs.forEach((input, idx) => {
    if (mappings[idx] && mappings[idx].targetField) {
      input.value = mappings[idx].targetField;
    }
  });

  mergeModal.classList.remove('hidden');
}

/** 关闭数据合并配置弹窗 */
function hideMergeModal() {
  mergeModal.classList.add('hidden');
  state.mergeConfigNodeId = null;
}

/**
 * 根据当前输入源数量动态渲染字段映射规则的输入行
 * 仅在对象合并模式下显示字段映射输入框
 */
function renderMergeFieldMappings() {
  const count = Math.max(2, Math.min(5, parseInt(mergeInputCount.value) || 2));
  const isMergeMode = mergeModeSelect.value === 'merge';
  mergeFieldMappings.innerHTML = '';

  if (!isMergeMode) {
    // 数组拼接模式不需要字段映射
    mergeFieldMappings.innerHTML = '<span style="color:var(--text-light);font-size:0.8rem;">数组拼接模式无需字段映射</span>';
    return;
  }

  // 为每个输入源生成一行映射规则输入
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'merge-mapping-row';

    const label = document.createElement('span');
    label.className = 'merge-mapping-label';
    label.textContent = `输入源 ${i + 1} →`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'merge-mapping-input node-input';
    input.placeholder = `字段名 (默认: input${i})`;
    input.dataset.portIndex = i;

    row.appendChild(label);
    row.appendChild(input);
    mergeFieldMappings.appendChild(row);
  }
}

/**
 * 保存数据合并组件的配置
 * 将弹窗中的合并模式、输入源数量和字段映射规则写入节点数据，
 * 并重新渲染节点以更新端口和界面
 */
function saveMergeConfig() {
  if (!state.mergeConfigNodeId) return;

  const node = state.nodes.find(n => n.id === state.mergeConfigNodeId);
  if (!node) return;

  // 读取合并模式
  const newMode = mergeModeSelect.value;
  // 读取输入源数量并限制在2~5范围
  const newCount = Math.max(2, Math.min(5, parseInt(mergeInputCount.value) || 2));

  // 读取字段映射规则
  const newMappings = [];
  const mappingInputs = mergeFieldMappings.querySelectorAll('.merge-mapping-input');
  mappingInputs.forEach((input) => {
    const targetField = input.value.trim();
    newMappings.push({
      targetField: targetField || null
    });
  });

  // 更新节点数据
  node.data.mergeMode = newMode;
  node.data.inputCount = newCount;
  node.data.fieldMappings = newMappings;

  // 清理不再需要的旧输入端口连接
  state.connections = state.connections.filter(conn => {
    if (conn.to !== node.id) return true;
    if (!conn.targetHandle) return true;
    // 解析端口号，如果端口号超出新的输入源数量则删除
    const portIndex = parseInt(conn.targetHandle.replace('in-', ''));
    return portIndex < newCount;
  });

  // 重新渲染节点以更新端口数量和界面显示
  const el = document.getElementById(node.id);
  if (el) el.remove();
  renderNode(node);
  updateConnections();

  hideMergeModal();
}

// Run init
init();
