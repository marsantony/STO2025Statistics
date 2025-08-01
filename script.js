// 職業數據
const classData = {
    all: {
        id:-1,
        name: '全部',
        count: 2844,
        image: '',
        color: '#ffffff'
    },
    neutral: {
        id: 0,
        name: '中立',
        count: 0,
        image: 'images/class_neutral.svg',
        color: '#95a5a6'
    },
    elf: {
        id: 1,
        name: '精靈',
        count: 288,
        image: 'images/class_elf.svg',
        color: '#27ae60'
    },
    royal: {
        id: 2,
        name: '皇家護衛',
        count: 743,
        image: 'images/class_royal.svg',
        color: '#e74c3c'
    },
    witch: {
        id: 3,
        name: '巫師',
        count: 852,
        image: 'images/class_witch.svg',
        color: '#3498db'
    },
    dragon: {
        id: 4,
        name: '龍族',
        count: 76,
        image: 'images/class_dragon.svg',
        color: '#f39c12'
    },
    nightmare: {
        id: 5,
        name: '夜魔',
        count: 462,
        image: 'images/class_nightmare.svg',
        color: '#9b59b6'
    },
    bishop: {
        id: 6,
        name: '主教',
        count: 179,
        image: 'images/class_bishop.svg',
        color: '#f1c40f'
    },
    nemesis: {
        id: 7,
        name: '復仇者',
        count: 244,
        image: 'images/class_nemesis.svg',
        color: '#1abc9c'
    }
};

// 當前選中的職業
let selectedClass = 'all';
let includeNeutral = false;

// 圖表實例
let pieChart = null;
let barChart = null;
let cardPieChart = null;
let cardBarChart = null;

// 對應 class 數字與 key 的映射
const classMap = {
    0: 'neutral',
    1: 'elf',
    2: 'royal',
    3: 'witch',
    4: 'dragon',
    5: 'nightmare',
    6: 'bishop',
    7: 'nemesis'
};

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    renderClassCards();
    createCharts();
    loadCardData(); // 載入卡片數據
    setupIncludeNeutralCheckbox();
}

function setupIncludeNeutralCheckbox() {
    const label = document.getElementById('includeNeutralLabel');
    const checkbox = document.getElementById('includeNeutralCheckbox');
    label.style.display = 'none';
    checkbox.checked = false;
    includeNeutral = false;
    checkbox.addEventListener('change', function() {
        includeNeutral = checkbox.checked;
        renderCardList();
        updateCardStats(getFilteredCards());
        updateCardCharts(selectedClass); // ← 新增這行
    });
}
// 獲取過濾後的卡片數據
function getFilteredCards() {
    let filteredCards = cardData;
    if (selectedClass !== 'all') {
        filteredCards = cardData.filter(card => card.class === selectedClass);
        if (includeNeutral && selectedClass !== 'neutral') {
            const classNum = String(Object.entries(classMap).find(([k, v]) => v === selectedClass)?.[0]);
            const neutralCards = cardData
                .filter(card => card.class === 'neutral' && card.byclass && card.byclass[classNum])
                .map(card => {
                    const by = card.byclass[classNum];
                    return {
                        ...card,
                        數量: by.count || 0,
                        帶3: by.帶3 || 0,
                        帶2: by.帶2 || 0,
                        帶1: by.帶1 || 0,
                        帶0: by.帶0 || 0,
                        _isNeutralByClass: true,
                        byclass: selectedClass // 添加 byclass 欄位
                    };
                })
                .filter(card => card.數量 > 0); // 這裡過濾掉數量為0的
            filteredCards = filteredCards.concat(neutralCards);
        }
    }
    // 依照數量由大到小排序
    filteredCards = filteredCards.slice().sort((a, b) => b.數量 - a.數量);
    return filteredCards;
}

// 渲染職業卡片
function renderClassCards() {
    const cardsContainer = document.getElementById('classCards');
    cardsContainer.innerHTML = '';

    // 先將 neutral 放最前，其餘照原順序
    const orderedKeys = ['all', ...Object.keys(classData).filter(k => k !== 'all')];
    orderedKeys.forEach(key => {
        const data = classData[key];
        const card = document.createElement('div');
        card.className = `class-card class-${key}`;
        card.dataset.class = key;
        card.innerHTML = `
            <img src="${data.image}" alt="${data.name}" onerror="this.style.display='none'">
            <h3>${data.name}</h3>
            <div class="count">${data.count}</div>
        `;
        card.addEventListener('click', () => selectClass(key));
        cardsContainer.appendChild(card);
    });
}

// 選擇職業
function selectClass(className) {
    // 檢查是否已經選中
    const currentSelected = document.querySelector('.class-card.selected');
    const targetCard = document.querySelector(`[data-class="${className}"]`);

    // 如果點擊的是已經選中的卡片，不做任何操作
    if (currentSelected && currentSelected.dataset.class === className) {
        return;
    }

    // 移除所有選中狀態
    document.querySelectorAll('.class-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 添加選中狀態
    if (targetCard) {
        targetCard.classList.add('selected');
    }

    // 更新選中的職業
    selectedClass = className;
    // 顯示/隱藏勾選框
    const label = document.getElementById('includeNeutralLabel');
    if (className !== 'all' && className !== 'neutral') {
        label.style.display = 'flex';
    } else {
        label.style.display = 'none';
        includeNeutral = false;
        document.getElementById('includeNeutralCheckbox').checked = false;
    }
    // 根據選擇的職業過濾卡片
    updateCardStats(getFilteredCards());
    updateCardCharts(className);
    renderCardList();
}

function updateCardCharts(selectedClass) {
    let filteredCards = getFilteredCards(); // ← 改這裡
    const pieLabels = filteredCards.map(card => card.名稱);
    const pieData = filteredCards.map(card => card.數量);
    // 顏色：全部時用 chartColors，單職業時用職業色
    const pieColors = selectedClass === 'all'
        ? filteredCards.map((_, i) => chartColors[i % chartColors.length])
        : filteredCards.map(card => classData[selectedClass]?.color || '#888');
    cardPieChart.data.labels = pieLabels;
    cardPieChart.data.datasets[0].data = pieData;
    cardPieChart.data.datasets[0].backgroundColor = pieColors;
    cardPieChart.update('none');
    // 長條圖同理
    cardBarChart.data.labels = pieLabels;
    cardBarChart.data.datasets[0].data = pieData;
    cardBarChart.data.datasets[0].backgroundColor = pieColors;
    cardBarChart.data.datasets[0].borderColor = pieColors;
    cardBarChart.update('none');
    // 標題
    document.getElementById('cardPieTitle').textContent = selectedClass === 'all' ? '全部牌分布圓餅圖' : `${classData[selectedClass]?.name || ''}牌分布圓餅圖`;
    document.getElementById('cardBarTitle').textContent = selectedClass === 'all' ? '全部牌統計圖表' : `${classData[selectedClass]?.name || ''}牌統計圖表`;
}

// 載入卡片數據
async function loadCardData() {
    try {
        // 這裡您需要提供實際的JSON檔案路徑
        const response = await fetch('cards_data.json');
        let rawData = await response.json();
        // 將 class 數字轉換為 key，並欄位名稱標準化
        cardData = rawData.map(card => ({
            代碼: card.code || card.代碼,
            class: classMap[card.class] || card.class,
            名稱: card.name || card.名稱,
            數量: card.count || card.數量,
            imagehash: card.image_hash || card.imagehash,
            帶3: card.帶3 || 0,
            帶2: card.帶2 || 0,
            帶1: card.帶1 || 0,
            byclass: card.byclass || undefined // ← 加這行
        }));

        // 依照數量由大到小排序
        cardData.sort((a, b) => b.數量 - a.數量);
        updateCardStats(cardData);
        updateCardCharts('all');
        renderCardList();
    } catch (error) {
        console.log('無法載入卡片數據');
        // 使用示例數據
        updateCardStats([]);
    }
}

// 更新卡片統計
function updateCardStats(filteredCards) {
    const totalCardTypes = filteredCards.length;
    const sharedCards = filteredCards.filter(card => card.數量 > 1).length;

    document.getElementById('totalCardTypes').textContent = totalCardTypes;
    document.getElementById('sharedCards').textContent = sharedCards;
}

// 渲染卡片列表
function renderCardList() {
    const cardList = document.getElementById('cardList');
    cardList.classList.add('loading');
    let filteredCards = getFilteredCards();
    cardList.innerHTML = '';
    filteredCards.forEach(card => {
        let c3, c2, c1, c0, count;
        if (card._isNeutralByClass) {
            count = card.數量;
            c3 = card.帶3 || 0;
            c2 = card.帶2 || 0;
            c1 = card.帶1 || 0;
            let total = 0;
            total = classData[card.byclass]?.count || 0;
            c0 = Math.max(0, total - c1 - c2 - c3);
        } else {
            count = card.數量;
            c3 = card.帶3 || 0;
            c2 = card.帶2 || 0;
            c1 = card.帶1 || 0;
            let total = 0;
            if (card.class === 'neutral') {
                total = classData['all']?.count || 0;
            } else {
                total = classData[card.class]?.count || 0;
            }
            c0 = Math.max(0, total - c1 - c2 - c3);
        }
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.innerHTML = `
    <div class="card-img-wrap">
        <img src="images/cards/${card.imagehash}.png" alt="" class="card-full-img">
    </div>
    <div class="card-info">
        <span class="card-name">${card.名稱}</span>
        <span class="card-count">${count}</span>
    </div>
    <div class="card-carry-info">
        <div class="carry-row">
            <span class="trend-item trend-3">帶3：<span class="trend-num trend-num-3">${c3}</span></span>
            <span class="trend-item trend-2">帶2：<span class="trend-num trend-num-2">${c2}</span></span>
        </div>
        <div class="carry-row">
            <span class="trend-item trend-1">帶1：<span class="trend-num trend-num-1">${c1}</span></span>
            <span class="trend-item trend-0">帶0：<span class="trend-num trend-num-0">${c0}</span></span>
        </div>
    </div>
`;
        cardList.appendChild(cardElement);
    });
    setTimeout(() => {
        cardList.classList.remove('loading');
    }, 100);
}

// 創建圖表
function createCharts() {
    createPieChart();
    createBarChart();
    createCardPieChart();
    createCardBarChart();
}

// 創建圓餅圖
function createPieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    // 只取非 all 和非 neutral 的職業
    const classKeys = Object.keys(classData).filter(k => k !== 'all' && k !== 'neutral');
    const data = {
        labels: classKeys.map(k => classData[k].name),
        datasets: [{
            data: classKeys.map(k => classData[k].count),
            backgroundColor: classKeys.map(k => classData[k].color),
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };
    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    pieChart = new Chart(ctx, config);
}

// 創建長條圖
function createBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    // 只取非 all 和非 neutral 的職業
    const classKeys = Object.keys(classData).filter(k => k !== 'all' && k !== 'neutral');
    const data = {
        labels: classKeys.map(k => classData[k].name),
        datasets: [{
            label: '數量',
            data: classKeys.map(k => classData[k].count),
            backgroundColor: classKeys.map(k => classData[k].color),
            borderColor: classKeys.map(k => classData[k].color),
            borderWidth: 1
        }]
    };
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };
    barChart = new Chart(ctx, config);
}

// 創建卡片圓餅圖
function createCardPieChart() {
    const ctx = document.getElementById('cardPieChart').getContext('2d');
    cardPieChart = new Chart(ctx, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

// 創建卡片長條圖
function createCardBarChart() {
    const ctx = document.getElementById('cardBarChart').getContext('2d');
    cardBarChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: '卡片數量', data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

const chartColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
  '#C9CBCF', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#C9CBCF', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40'
]

// 更新圖表
function updateCharts(selectedClass) {
    if (selectedClass === 'all') {
        // 顯示所有職業數據
        updatePieChart(Object.values(classData));
        updateBarChart(Object.values(classData));
    } else {
        // 顯示該職業所有牌的數量分布
        const filteredCards = cardData.filter(card => card.class === selectedClass || card.class === 'shared');
        if (filteredCards.length > 0) {
            // 以卡片名稱為標籤，數量為值
            updatePieChart(filteredCards.map(card => ({ name: card.名稱, count: card.數量, color: classData[selectedClass]?.color || '#888' })));
            updateBarChart(filteredCards.map(card => ({ name: card.名稱, count: card.數量, color: classData[selectedClass]?.color || '#888' })));
        } else {
            // 若無卡片則顯示空
            updatePieChart([]);
            updateBarChart([]);
        }
    }
}

// 更新圓餅圖
function updatePieChart(dataArray) {
    const labels = dataArray.map(data => data.name);
    const values = dataArray.map(data => data.count);
    const colors = dataArray.map(data => data.color);

    // 檢查數據是否真的改變了
    const currentLabels = pieChart.data.labels;
    const currentValues = pieChart.data.datasets[0].data;

    if (JSON.stringify(currentLabels) === JSON.stringify(labels) &&
        JSON.stringify(currentValues) === JSON.stringify(values)) {
        return; // 數據沒有改變，不需要更新
    }

    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = values;
    pieChart.data.datasets[0].backgroundColor = colors;
    pieChart.update('none'); // 使用 'none' 模式避免動畫
}

// 更新長條圖
function updateBarChart(dataArray) {
    const labels = dataArray.map(data => data.name);
    const values = dataArray.map(data => data.count);
    const colors = dataArray.map(data => data.color);

    // 檢查數據是否真的改變了
    const currentLabels = barChart.data.labels;
    const currentValues = barChart.data.datasets[0].data;

    if (JSON.stringify(currentLabels) === JSON.stringify(labels) &&
        JSON.stringify(currentValues) === JSON.stringify(values)) {
        return; // 數據沒有改變，不需要更新
    }

    barChart.data.labels = labels;
    barChart.data.datasets[0].data = values;
    barChart.data.datasets[0].backgroundColor = colors;
    barChart.data.datasets[0].borderColor = colors;
    barChart.update('none'); // 使用 'none' 模式避免動畫
}