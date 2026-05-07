import './style.css';

// --- Global State ---
const state = {
  nodes: [],       // Array of node objects
  connections: [], // Array of { id, from: nodeId, to: nodeId, sourceHandle }
  nextId: 1,

  // Interaction State
  draggingNode: null,
  dragOffset: { x: 0, y: 0 },

  connecting: {
    active: false,
    startNodeId: null,
    sourceHandle: null, // 'default', 'true', 'false'
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

// Data Merge Modal Elements
const dataMergeModal = document.getElementById('data-merge-modal-overlay');
const btnDataMergeModalCancel = document.getElementById('btn-data-merge-modal-cancel');
const btnDataMergeModalSave = document.getElementById('btn-data-merge-modal-save');
const closeDataMergeModal = document.querySelector('.close-data-merge-modal');
const dataMergeInputCount = document.getElementById('data-merge-input-count');
const dataMergeMode = document.getElementById('data-merge-mode');
const dataMergeObjectMode = document.getElementById('data-merge-object-mode');
const dataMergeFieldMappingsContainer = document.getElementById('data-merge-field-mappings-container');
const dataMergeFieldMappings = document.getElementById('data-merge-field-mappings');

// Confirm Modal Elements
const confirmModal = document.getElementById('confirm-modal-overlay');
const confirmMsg = document.getElementById('confirm-message');
const btnConfirmOk = document.getElementById('btn-confirm-ok');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
const closeConfirm = document.querySelector('.close-confirm');

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

  // 7. Data Merge Modal
  btnDataMergeModalCancel.addEventListener('click', hideDataMergeModal);
  closeDataMergeModal.addEventListener('click', hideDataMergeModal);
  btnDataMergeModalSave.addEventListener('click', saveDataMergeConfig);
  
  dataMergeMode.addEventListener('change', () => {
    updateFieldMappingsVisibility();
  });
  
  dataMergeInputCount.addEventListener('change', () => {
    updateFieldMappingsUI();
  });

  // Confirm Modal Listeners
  btnConfirmOk.addEventListener('click', () => {
    if (pendingConfirmCallback) pendingConfirmCallback();
    hideConfirm();
  });
  btnConfirmCancel.addEventListener('click', hideConfirm);
  closeConfirm.addEventListener('click', hideConfirm);
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
  } else if (type === 'data-merge') {
    node.data.inputCount = node.data.inputCount || 2;
    node.data.mergeMode = node.data.mergeMode || 'array-concat';
    node.data.objectMergeMode = node.data.objectMergeMode || 'shallow';
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
    'output': { icon: '👁️', title: '输出结果' },
    'data-merge': { icon: '🔗', title: '数据合并' }
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
  } else if (node.type === 'output') {
    const resultBox = document.createElement('div');
    resultBox.className = 'node-result';
    resultBox.id = `res-${node.id}`;
    resultBox.textContent = node.data.result !== undefined ? node.data.result : '等待运行...';
    body.appendChild(resultBox);
  } else if (node.type === 'data-merge') {
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.style.width = '100%';
    const modeText = node.data.mergeMode === 'array-concat' ? '数组拼接' : '对象合并';
    btn.textContent = `配置: ${node.data.inputCount}个输入 / ${modeText}`;
    btn.addEventListener('click', () => openDataMergeConfig(node));
    body.appendChild(btn);
    
    const infoText = document.createElement('div');
    infoText.className = 'node-merge-info';
    const strategyText = node.data.objectMergeMode === 'deep' ? '深合并' : '浅合并';
    infoText.textContent = `策略: ${node.data.mergeMode === 'object-merge' ? strategyText : '顺序拼接'}`;
    body.appendChild(infoText);
  }

  el.appendChild(body);

  // Input Ports (Left) - Not for sources
  if (node.type !== 'input-num' && node.type !== 'input-text') {
    if (node.type === 'data-merge') {
      const inputCount = node.data.inputCount || 2;
      for (let i = 0; i < inputCount; i++) {
        const inPort = document.createElement('div');
        inPort.className = 'port input-port';
        inPort.dataset.nodeId = node.id;
        inPort.dataset.handle = `input-${i}`;
        inPort.title = `输入源 ${i + 1}`;
        const topPosition = 20 + (i * 25);
        inPort.style.top = `${topPosition}%`;
        el.appendChild(inPort);
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

function completeConnection(targetNodeId) {
  if (state.connecting.active && state.connecting.startNodeId !== targetNodeId) {
    const targetNode = state.nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return;

    if (targetNode.type === 'input-num' || targetNode.type === 'input-text') {
      showToast('该组件不能作为输入目标');
      state.connecting.active = false;
      renderTempLine(null, null);
      return;
    }

    let targetHandle = null;

    if (targetNode.type === 'data-merge') {
      const inputCount = targetNode.data.inputCount || 2;
      const existingConnections = state.connections.filter(c => c.to === targetNodeId);
      const usedHandles = existingConnections.map(c => c.targetHandle);

      targetHandle = null;
      for (let i = 0; i < inputCount; i++) {
        const handleId = `input-${i}`;
        if (!usedHandles.includes(handleId)) {
          targetHandle = handleId;
          break;
        }
      }

      if (!targetHandle) {
        showToast('所有输入端口已被占用');
        state.connecting.active = false;
        renderTempLine(null, null);
        document.querySelectorAll('.node.highlight').forEach(n => n.classList.remove('highlight'));
        return;
      }
    }

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
      completeConnection(nodeEl.id);
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
    const endPoint = getPortPosition(conn.to, 'input', conn.targetHandle);

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
  if (handle && handle !== 'default') {
    selector += `[data-handle="${handle}"]`;
  }

  let portEl = nodeEl.querySelector(selector);
  if (!portEl) {
    portEl = nodeEl.querySelector(`.${type}-port`);
  }
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

/**
 * 将值格式化为可读的字符串，支持循环引用检测
 * @param {*} value 需要格式化的值
 * @returns {string} 格式化后的字符串
 */
function formatDisplayValue(value) {
  if (value === null || value === undefined) {
    return '未触发/无值';
  }
  
  if (typeof value !== 'object') {
    return String(value);
  }

  try {
    const seen = new WeakSet();
    const result = JSON.stringify(value, (key, val) => {
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular Reference]';
        }
        seen.add(val);
      }
      return val;
    }, 2);
    
    if (result.length > 500) {
      return result.substring(0, 500) + '\n...(已截断)';
    }
    return result;
  } catch (e) {
    return '[无法序列化的数据]';
  }
}

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
        
        outNode.data.result = val;
        const el = document.getElementById(`res-${outNode.id}`);
        if (el) el.textContent = formatDisplayValue(val);
      });
      showToast('运行完成');
    }, 100);

  } catch (e) {
    console.error(e);
    showToast('运行出错（请检查控制台）');
  }
}

/**
 * 执行深度克隆操作，支持循环引用处理
 * @param {*} obj 需要克隆的对象
 * @param {WeakMap} visited 已访问对象映射表（用于处理循环引用）
 * @returns {*} 克隆后的对象
 */
function deepClone(obj, visited = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (visited.has(obj)) {
    return visited.get(obj);
  }

  if (Array.isArray(obj)) {
    const clonedArr = [];
    visited.set(obj, clonedArr);
    for (const item of obj) {
      clonedArr.push(deepClone(item, visited));
    }
    return clonedArr;
  }

  const clonedObj = {};
  visited.set(obj, clonedObj);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key], visited);
    }
  }
  return clonedObj;
}

/**
 * 执行对象深合并操作，支持循环引用处理
 * @param {object} target 目标对象
 * @param {object} source 源对象
 * @param {WeakMap} visitedTarget 目标对象访问记录
 * @param {WeakMap} visitedSource 源对象访问记录
 * @returns {object} 合并后的对象
 */
function deepMergeObjects(target, source, visitedTarget = new WeakMap(), visitedSource = new WeakMap()) {
  const result = deepClone(target);
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        if (visitedSource.has(sourceValue)) {
          result[key] = visitedSource.get(sourceValue);
        } else {
          const mergedSubObj = {};
          visitedSource.set(sourceValue, mergedSubObj);
          visitedTarget.set(targetValue, mergedSubObj);
          
          const merged = deepMergeObjects(targetValue, sourceValue, visitedTarget, visitedSource);
          result[key] = merged;
        }
      } else {
        result[key] = deepClone(sourceValue);
      }
    }
  }
  return result;
}

/**
 * 应用字段映射规则到输入数据
 * @param {*} inputData 原始输入数据
 * @param {Array} fieldMappings 字段映射规则数组
 * @param {number} inputIndex 输入源索引
 * @returns {*} 应用映射后的数据
 */
function applyFieldMappings(inputData, fieldMappings, inputIndex) {
  if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
    return inputData;
  }

  const mappingsForInput = fieldMappings.filter(m => m.inputIndex === inputIndex);
  if (mappingsForInput.length === 0) {
    return inputData;
  }

  const result = {};
  for (const mapping of mappingsForInput) {
    const { sourceField, targetField } = mapping;
    if (sourceField && targetField && sourceField in inputData) {
      result[targetField] = inputData[sourceField];
    }
  }

  if (Object.keys(result).length === 0) {
    return inputData;
  }
  return result;
}

/**
 * 合并多个数据源
 * @param {Array} inputDataArray 输入数据数组
 * @param {string} mergeMode 合并模式 ('array-concat' 或 'object-merge')
 * @param {string} objectMergeMode 对象合并策略 ('shallow' 或 'deep')
 * @param {Array} fieldMappings 字段映射规则
 * @returns {*} 合并后的结果
 */
function mergeDataSources(inputDataArray, mergeMode, objectMergeMode, fieldMappings) {
  const validInputs = inputDataArray.filter(item => item !== null && item !== undefined);

  if (validInputs.length === 0) {
    return null;
  }

  if (mergeMode === 'array-concat') {
    const result = [];
    for (let i = 0; i < validInputs.length; i++) {
      const data = validInputs[i].data;
      const inputIndex = validInputs[i].index;
      const mappedData = applyFieldMappings(data, fieldMappings, inputIndex);
      
      if (Array.isArray(mappedData)) {
        result.push(...mappedData);
      } else {
        result.push(mappedData);
      }
    }
    return result;
  } else if (mergeMode === 'object-merge') {
    let result = {};
    for (let i = 0; i < validInputs.length; i++) {
      const data = validInputs[i].data;
      const inputIndex = validInputs[i].index;
      const mappedData = applyFieldMappings(data, fieldMappings, inputIndex);
      
      let dataToMerge;
      if (mappedData && typeof mappedData === 'object' && !Array.isArray(mappedData)) {
        dataToMerge = mappedData;
      } else {
        const keyName = `input${inputIndex}`;
        dataToMerge = {};
        dataToMerge[keyName] = mappedData;
      }
      
      if (objectMergeMode === 'deep') {
        result = deepMergeObjects(result, dataToMerge);
      } else {
        result = { ...result, ...dataToMerge };
      }
    }
    return result;
  }

  return null;
}

/**
 * 处理来自逻辑判断节点的输入
 * @param {*} inputData 输入数据
 * @param {object} conn 连接对象
 * @returns {*} 处理后的数据
 */
function processJudgeInput(inputData, conn) {
  if (inputData && typeof inputData === 'object' && 'isTrue' in inputData) {
    const { value, isTrue } = inputData;
    if (conn.sourceHandle === 'true') {
      return isTrue ? value : null;
    }
    if (conn.sourceHandle === 'false') {
      return !isTrue ? value : null;
    }
    return value;
  }
  return null;
}

function evaluateNode(nodeId, visited = new Set()) {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  if (node.type === 'input-num' || node.type === 'input-text') {
    return node.data.value;
  }

  const incomingConnections = state.connections.filter(c => c.to === nodeId);

  if (node.type === 'data-merge') {
    const inputDataArray = [];
    for (const conn of incomingConnections) {
      const inputData = evaluateNode(conn.from, new Set(visited));
      
      const sourceNode = state.nodes.find(n => n.id === conn.from);
      let processedData = inputData;
      
      if (sourceNode && sourceNode.type === 'judge') {
        processedData = processJudgeInput(inputData, conn);
      }
      
      if (processedData !== null && processedData !== undefined) {
        let inputIndex = 0;
        if (conn.targetHandle && conn.targetHandle.startsWith('input-')) {
          inputIndex = parseInt(conn.targetHandle.split('-')[1], 10);
        }
        inputDataArray.push({
          index: inputIndex,
          data: processedData
        });
      }
    }

    inputDataArray.sort((a, b) => a.index - b.index);

    return mergeDataSources(
      inputDataArray,
      node.data.mergeMode || 'array-concat',
      node.data.objectMergeMode || 'shallow',
      node.data.fieldMappings || []
    );
  }

  if (incomingConnections.length === 0) {
    return null;
  }

  const conn = incomingConnections[0];
  const inputData = evaluateNode(conn.from, visited);
  const sourceNode = state.nodes.find(n => n.id === conn.from);

  if (sourceNode && sourceNode.type === 'judge') {
    return processJudgeInput(inputData, conn);
  }

  if (inputData === null) return null;

  if (node.type === 'judge') {
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

    return { value: inputData, isTrue: res };
  }

  if (node.type === 'output') {
    return inputData;
  }

  return inputData;
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

/**
 * 打开数据合并配置模态框
 * @param {object} node 数据合并节点对象
 */
function openDataMergeConfig(node) {
  state.dataMergeConfigNodeId = node.id;
  dataMergeInputCount.value = node.data.inputCount || 2;
  dataMergeMode.value = node.data.mergeMode || 'array-concat';
  dataMergeObjectMode.value = node.data.objectMergeMode || 'shallow';
  
  updateFieldMappingsVisibility();
  updateFieldMappingsUI(node.data.fieldMappings || []);
  
  dataMergeModal.classList.remove('hidden');
}

/**
 * 关闭数据合并配置模态框
 */
function hideDataMergeModal() {
  dataMergeModal.classList.add('hidden');
  state.dataMergeConfigNodeId = null;
}

/**
 * 根据合并模式更新字段映射区域的可见性
 */
function updateFieldMappingsVisibility() {
  if (dataMergeMode.value === 'object-merge') {
    dataMergeFieldMappingsContainer.style.display = 'block';
  } else {
    dataMergeFieldMappingsContainer.style.display = 'none';
  }
}

/**
 * 创建单个字段映射项的 DOM 元素
 * @param {number} inputIndex 输入源索引
 * @param {string} sourceField 源字段名
 * @param {string} targetField 目标字段名
 * @returns {HTMLElement} 字段映射项元素
 */
function createMappingItem(inputIndex, sourceField = '', targetField = '') {
  const item = document.createElement('div');
  item.className = 'field-mapping-item';
  item.dataset.inputIndex = inputIndex;
  
  item.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
      <div class="mapping-source-label">输入源 ${inputIndex + 1}</div>
      <div style="display:flex;gap:8px;">
        <input type="text" class="source-field" placeholder="源字段名" value="${sourceField}" />
        <span style="align-self:center;color:#94a3b8;">→</span>
        <input type="text" class="target-field" placeholder="目标字段名" value="${targetField}" />
      </div>
    </div>
    <button class="btn-remove-mapping" type="button" title="删除映射">&times;</button>
  `;
  
  item.querySelector('.btn-remove-mapping').addEventListener('click', () => {
    item.remove();
  });
  
  return item;
}

/**
 * 更新字段映射 UI
 * @param {Array} existingMappings 已存在的字段映射规则
 */
function updateFieldMappingsUI(existingMappings = []) {
  dataMergeFieldMappings.innerHTML = '';
  const inputCount = parseInt(dataMergeInputCount.value, 10);
  
  for (let i = 0; i < inputCount; i++) {
    const mappingsForInput = existingMappings.filter(m => m.inputIndex === i);
    
    if (mappingsForInput.length === 0) {
      const item = createMappingItem(i);
      dataMergeFieldMappings.appendChild(item);
    } else {
      mappingsForInput.forEach(mapping => {
        const item = createMappingItem(i, mapping.sourceField, mapping.targetField);
        dataMergeFieldMappings.appendChild(item);
      });
    }
  }
  
  const addContainer = document.createElement('div');
  addContainer.className = 'field-mapping-add-container';
  addContainer.style.cssText = 'display:flex;gap:8px;margin-top:8px;align-items:flex-end;';
  
  const selectInput = document.createElement('select');
  selectInput.className = 'add-mapping-select';
  selectInput.style.cssText = 'flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.85rem;';
  
  for (let i = 0; i < inputCount; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `输入源 ${i + 1}`;
    selectInput.appendChild(option);
  }
  
  const addButton = document.createElement('button');
  addButton.className = 'btn-add-mapping';
  addButton.type = 'button';
  addButton.textContent = '+ 添加';
  addButton.style.cssText = 'flex:none;padding:8px 16px;white-space:nowrap;';
  addButton.addEventListener('click', () => {
    const selectedIndex = parseInt(selectInput.value, 10);
    const item = createMappingItem(selectedIndex);
    dataMergeFieldMappings.insertBefore(item, addContainer);
  });
  
  addContainer.appendChild(selectInput);
  addContainer.appendChild(addButton);
  dataMergeFieldMappings.appendChild(addContainer);
}

/**
 * 从 UI 收集字段映射数据
 * @returns {Array} 字段映射规则数组
 */
function collectFieldMappings() {
  const mappings = [];
  const items = dataMergeFieldMappings.querySelectorAll('.field-mapping-item');
  
  items.forEach(item => {
    const inputIndex = parseInt(item.dataset.inputIndex, 10);
    const sourceField = item.querySelector('.source-field').value.trim();
    const targetField = item.querySelector('.target-field').value.trim();
    
    if (sourceField && targetField) {
      mappings.push({
        inputIndex: inputIndex,
        sourceField: sourceField,
        targetField: targetField
      });
    }
  });
  
  return mappings;
}

/**
 * 保存数据合并配置
 */
function saveDataMergeConfig() {
  if (!state.dataMergeConfigNodeId) {
    hideDataMergeModal();
    return;
  }
  
  const node = state.nodes.find(n => n.id === state.dataMergeConfigNodeId);
  if (!node) {
    hideDataMergeModal();
    return;
  }
  
  const oldInputCount = node.data.inputCount || 2;
  const newInputCount = parseInt(dataMergeInputCount.value, 10);
  
  node.data.inputCount = newInputCount;
  node.data.mergeMode = dataMergeMode.value;
  node.data.objectMergeMode = dataMergeObjectMode.value;
  node.data.fieldMappings = collectFieldMappings();
  
  if (oldInputCount !== newInputCount) {
    state.connections = state.connections.filter(c => {
      if (c.to !== node.id) return true;
      if (!c.targetHandle) return true;
      const inputIndex = parseInt(c.targetHandle.split('-')[1], 10);
      return inputIndex < newInputCount;
    });
    
    render();
  } else {
    const el = document.getElementById(node.id);
    if (el) {
      const btn = el.querySelector('button');
      const modeText = node.data.mergeMode === 'array-concat' ? '数组拼接' : '对象合并';
      if (btn) btn.textContent = `配置: ${node.data.inputCount}个输入 / ${modeText}`;
      
      const infoText = el.querySelector('.node-merge-info');
      if (infoText) {
        const strategyText = node.data.objectMergeMode === 'deep' ? '深合并' : '浅合并';
        infoText.textContent = `策略: ${node.data.mergeMode === 'object-merge' ? strategyText : '顺序拼接'}`;
      }
    }
    updateConnections();
  }
  
  showToast('配置已保存');
  hideDataMergeModal();
}

// Run init
init();
