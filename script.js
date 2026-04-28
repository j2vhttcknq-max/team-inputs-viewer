const state = {
  rawData: [],
  filteredData: [],
  selectedItem: null
};

const GITHUB_EXCEL_URLS = [
  'https://raw.githubusercontent.com/j2vhttcknq-max/team-inputs-viewer/main/team-inputs.xlsx',
  'https://raw.githubusercontent.com/j2vhttcknq-max/team-inputs-viewer/gh-pages/team-inputs.xlsx'
];

const elements = {
  fileInput: document.getElementById('fileInput'),
  uploadBtn: document.getElementById('uploadBtn'),
  saveBtn: document.getElementById('saveBtn'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  dateFrom: document.getElementById('dateFrom'),
  dateTo: document.getElementById('dateTo'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  rowCountLabel: document.getElementById('rowCountLabel'),
  summaryCards: document.getElementById('summary-cards'),
  tableBody: document.querySelector('#dataTable tbody'),
  statusChart: document.getElementById('statusChart'),
  dateChart: document.getElementById('dateChart'),
  detailPanel: document.getElementById('detailPanel'),
  detailItemName: document.getElementById('detailItemName'),
  detailDescription: document.getElementById('detailDescription'),
  detailComments: document.getElementById('detailComments'),
  updateHistory: document.getElementById('updateHistory'),
  updateDateInput: document.getElementById('updateDateInput'),
  updateDateBtn: document.getElementById('updateDateBtn'),
  newUpdateInput: document.getElementById('newUpdateInput'),
  addUpdateBtn: document.getElementById('addUpdateBtn')
};

function normalizeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getField(row, key) {
  const normalizedKey = key.replace(/\s/g, '').toLowerCase();
  const match = Object.keys(row).find(k => k && k.replace(/\s/g, '').toLowerCase() === normalizedKey);
  return match ? row[match] : '';
}

function normalizeRow(row) {
  const normalizeValue = (value) => {
    if (value == null) return '';
    return String(value).trim();
  };

  return {
    no: normalizeValue(getField(row, 'No.')),
    raiser: normalizeValue(getField(row, 'Raiser')),
    raisedDate: normalizeValue(getField(row, 'Raised Date')),
    itemName: normalizeValue(getField(row, 'Item Name')),
    description: normalizeValue(getField(row, 'items Desription')),
    comments: normalizeValue(getField(row, 'Comments & Actions')),
    status: normalizeValue(getField(row, 'Status')),
    remark: normalizeValue(getField(row, 'Other Remark'))
  };
}

function parseWorksheet(worksheet) {
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const headers = cols.map((col) => {
    const cell = worksheet[`${col}2`];
    return cell ? String(cell.w || cell.v || '').trim() : '';
  });
  const records = [];

  for (let row = 3; row <= range.e.r + 1; row++) {
    const values = cols.map((col) => {
      const cell = worksheet[`${col}${row}`];
      return cell ? String(cell.w || cell.v || '').trim() : '';
    });
    if (values.every(v => !v)) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (h) {
        record[h] = values[idx] || '';
      }
    });
    records.push(record);
  }
  return records;
}

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const records = parseWorksheet(worksheet);
        resolve({ records, sheetName });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseExcelFromArrayBuffer(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return { records: parseWorksheet(worksheet), sheetName };
}

function normalizeBoxLink(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('box.com') && !parsed.searchParams.has('dl')) {
      parsed.searchParams.set('dl', '1');
    }
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

async function loadExcelFromUrl(url) {
  const downloadUrl = normalizeBoxLink(url);
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`下载失败：${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return parseExcelFromArrayBuffer(arrayBuffer);
}

async function loadDefaultData() {
  for (const url of GITHUB_EXCEL_URLS) {
    try {
      const { records, sheetName } = await loadExcelFromUrl(url);
      state.rawData = records.map(normalizeRow);
      state.filteredData = [...state.rawData];
      state.sheetName = sheetName || 'team-inputs.xlsx';
      renderSummary(state.filteredData);
      renderTable(state.filteredData);
      renderCharts(state.filteredData);
      elements.detailPanel.style.display = 'none';
      elements.saveBtn.disabled = false;
      console.log('已自动从 GitHub 加载 Excel 数据：', url);
      return;
    } catch (githubError) {
      console.warn(`自动加载 GitHub Excel 失败：${url}`, githubError);
    }
  }

  const boxUrl = 'https://apple.box.com/s/tseyvar4l9h0hwdunkfjdpbrg7xilgce';
  try {
    const { records, sheetName } = await loadExcelFromUrl(boxUrl);
    state.rawData = records.map(normalizeRow);
    state.filteredData = [...state.rawData];
    state.sheetName = sheetName;
    renderSummary(state.filteredData);
    renderTable(state.filteredData);
    renderCharts(state.filteredData);
    elements.detailPanel.style.display = 'none';
    elements.saveBtn.disabled = false;
    console.log('已自动从 Box 加载 Excel 数据');
    return;
  } catch (boxError) {
    console.warn('自动加载 Box Excel 失败：', boxError);
  }

  if (window.location.protocol === 'file:' && window.DEFAULT_TEAM_INPUTS) {
    console.log('使用本地嵌入数据 window.DEFAULT_TEAM_INPUTS');
    state.rawData = window.DEFAULT_TEAM_INPUTS.map(normalizeRow);
    state.filteredData = [...state.rawData];
    renderSummary(state.filteredData);
    renderTable(state.filteredData);
    renderCharts(state.filteredData);
    elements.detailPanel.style.display = 'none';
    elements.saveBtn.disabled = false;
    return;
  }

  try {
    const response = await fetch('team-inputs.json');
    if (!response.ok) {
      throw new Error(`无法加载 team-inputs.json：${response.status} ${response.statusText}`);
    }
    const jsonData = await response.json();
    state.rawData = jsonData.map(normalizeRow);
    state.filteredData = [...state.rawData];
    renderSummary(state.filteredData);
    renderTable(state.filteredData);
    renderCharts(state.filteredData);
    elements.detailPanel.style.display = 'none';
    elements.saveBtn.disabled = false;
  } catch (jsonError) {
    console.warn('加载本地 JSON 也失败：', jsonError);
  }
}

function extractUpdateHistory(comments) {
  if (!comments) return [];
  const updates = comments.split(/Update[:\s]*|Udpate[:\s]*/i).filter(u => u.trim());
  return updates.map(u => u.trim()).filter(u => u);
}

function renderSummary(data) {
  const total = data.length;
  const done = data.filter(item => item.status === 'Done').length;
  const ongoing = data.filter(item => item.status === 'Ongoing').length;
  const noStatus = total - done - ongoing;

  elements.summaryCards.innerHTML = `
    <div class="status-card"><strong>${total}</strong><span>总条目</span></div>
    <div class="status-card"><strong>${done}</strong><span>Done</span></div>
    <div class="status-card"><strong>${ongoing}</strong><span>Ongoing</span></div>
    <div class="status-card"><strong>${noStatus}</strong><span>其他状态</span></div>
  `;
}

function formatDate(value) {
  const date = normalizeDate(value);
  if (!date) return value || '-';
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function createStatusChip(status) {
  const value = status || 'Unknown';
  const normalized = value.toLowerCase();
  const styleClass = normalized === 'done' ? 'done' : normalized === 'ongoing' ? 'ongoing' : 'default';
  return `<span class="status-chip ${styleClass}">${value}</span>`;
}

function renderTable(data) {
  elements.tableBody.innerHTML = data.map((item, index) => `
    <tr data-index="${index}">
      <td>${item.no}</td>
      <td>${formatDate(item.raisedDate)}</td>
      <td>${item.itemName}</td>
    </tr>
  `).join('');
  elements.rowCountLabel.textContent = `当前展示 ${data.length} 条`;
}

function renderCharts(data) {
  const statusCounts = data.reduce((acc, item) => {
    const key = item.status || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const dateCounts = data.reduce((acc, item) => {
    const date = normalizeDate(item.raisedDate);
    if (!date) return acc;
    const key = date.toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const dateKeys = Object.keys(dateCounts).sort();
  const statusChart = echarts.init(elements.statusChart);
  statusChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: '状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
      }
    ]
  });

  const dateChart = echarts.init(elements.dateChart);
  dateChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dateKeys },
    yAxis: { type: 'value' },
    series: [{ data: dateKeys.map(key => dateCounts[key]), type: 'bar', itemStyle: { color: '#2563eb' } }]
  });
}

function showDetail(item) {
  elements.detailItemName.textContent = item.itemName;
  elements.detailDescription.textContent = item.description;
  elements.detailComments.textContent = item.comments;
  const history = extractUpdateHistory(item.comments);
  elements.updateHistory.innerHTML = history.map(update => `<li>${update}</li>`).join('');
  elements.updateDateInput.value = item.raisedDate ? new Date(item.raisedDate).toISOString().slice(0, 10) : '';
  elements.newUpdateInput.value = '';
  elements.detailPanel.style.display = 'block';
  state.selectedItem = item;
}

function applyFilters() {
  const keyword = elements.searchInput.value.trim().toLowerCase();
  const statusValue = elements.statusFilter.value;
  const fromDate = normalizeDate(elements.dateFrom.value);
  const toDate = normalizeDate(elements.dateTo.value);

  state.filteredData = state.rawData.filter(item => {
    const matchesKeyword = keyword === '' || [item.no, item.raiser, item.itemName, item.description, item.comments, item.remark]
      .some(value => value && value.toString().toLowerCase().includes(keyword));

    const itemStatus = item.status ? item.status.trim() : '';
    const matchesStatus = statusValue === 'all' || itemStatus.toLowerCase() === statusValue.toLowerCase();
    const rowDate = normalizeDate(item.raisedDate);
    const matchesFrom = !fromDate || (rowDate && rowDate >= fromDate);
    const matchesTo = !toDate || (rowDate && rowDate <= toDate);
    return matchesKeyword && matchesStatus && matchesFrom && matchesTo;
  });
  renderSummary(state.filteredData);
  renderTable(state.filteredData);
  renderCharts(state.filteredData);
}

function saveToExcel() {
  if (state.rawData.length === 0) {
    alert('没有数据可保存，请先上传文件。');
    return;
  }

  const sheetName = state.sheetName || 'Team Inputs';
  const headers = ['No.', 'Raiser', 'Raised Date', 'Item Name', 'Description', 'Comments & Actions', 'Status', 'Other Remark'];
  const dataRows = state.rawData.map(item => [
    item.no,
    item.raiser,
    item.raisedDate,
    item.itemName,
    item.description,
    item.comments,
    item.status,
    item.remark
  ]);

  // 生成与原文件一致的布局：第一行留空，第二行是标题，数据从第三行开始
  const aoa = [
    new Array(headers.length + 1).fill(''),
    [''].concat(headers),
    ...dataRows.map(row => [''].concat(row))
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    {wch: 5},  // 空列 A
    {wch: 10}, // No.
    {wch: 15}, // Raiser
    {wch: 12}, // Raised Date
    {wch: 30}, // Item Name
    {wch: 40}, // Description
    {wch: 50}, // Comments & Actions
    {wch: 10}, // Status
    {wch: 20}  // Other Remark
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `Team_Inputs_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
  alert(`文件已保存为 ${fileName}`);
}

function initialize() {
  elements.uploadBtn.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.saveBtn.addEventListener('click', saveToExcel);

  elements.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      parseExcel(file).then(({ records, sheetName }) => {
        state.rawData = records.map(normalizeRow);
        state.filteredData = [...state.rawData];
        state.sheetName = sheetName;
        renderSummary(state.filteredData);
        renderTable(state.filteredData);
        renderCharts(state.filteredData);
        elements.detailPanel.style.display = 'none';
        elements.saveBtn.disabled = false;
      }).catch(error => {
        console.error('解析 Excel 失败:', error);
        alert('解析 Excel 文件失败，请检查文件格式。');
      });
    }
  });

  elements.tableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (row) {
      const index = parseInt(row.dataset.index);
      const item = state.filteredData[index];
      if (item) {
        document.querySelectorAll('#dataTable tbody tr').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        showDetail(item);
      }
    }
  });

  elements.updateDateBtn.addEventListener('click', () => {
    if (state.selectedItem) {
      const newDate = elements.updateDateInput.value;
      if (newDate) {
        state.selectedItem.raisedDate = newDate;
        applyFilters();
        alert('日期已更新！');
      }
    }
  });

  elements.addUpdateBtn.addEventListener('click', () => {
    if (state.selectedItem) {
      const newUpdate = elements.newUpdateInput.value.trim();
      if (newUpdate) {
        const currentComments = state.selectedItem.comments || '';
        const updatedComments = currentComments + (currentComments ? '\n' : '') + `Update: ${new Date().toLocaleDateString('zh-CN')} - ${newUpdate}`;
        state.selectedItem.comments = updatedComments;
        elements.detailComments.textContent = updatedComments;
        const history = extractUpdateHistory(updatedComments);
        elements.updateHistory.innerHTML = history.map(update => `<li>${update}</li>`).join('');
        applyFilters();
        elements.newUpdateInput.value = '';
        alert('新更新已添加！');
      }
    }
  });

  elements.searchInput.addEventListener('input', applyFilters);
  elements.statusFilter.addEventListener('change', applyFilters);
  elements.dateFrom.addEventListener('change', applyFilters);
  elements.dateTo.addEventListener('change', applyFilters);
  elements.resetFiltersBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.statusFilter.value = 'all';
    elements.dateFrom.value = '';
    elements.dateTo.value = '';
    applyFilters();
  });

  loadDefaultData();
}

initialize();
