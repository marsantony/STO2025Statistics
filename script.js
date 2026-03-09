import { getFilteredCards as _getFilteredCards, normalizeCardData, calculateC0 } from './data-utils.js';

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

// 卡片資料
let cardData = [];

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

// 只取有職業的 key（排除 all 和 neutral）
const classKeys = Object.keys(classData).filter(k => k !== 'all' && k !== 'neutral');

const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
];

// DOM 快取
const toggleEl = document.getElementById('includeNeutralLabel');
const checkboxEl = document.getElementById('includeNeutralCheckbox');
const cardListEl = document.getElementById('cardList');
const totalCardTypesEl = document.getElementById('totalCardTypes');
const sharedCardsEl = document.getElementById('sharedCards');
const cardPieTitleEl = document.getElementById('cardPieTitle');
const cardBarTitleEl = document.getElementById('cardBarTitle');

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    renderClassCards();
    createCharts();
    loadCardData();
    setupIncludeNeutralCheckbox();
}

function setupIncludeNeutralCheckbox() {
    toggleEl.style.display = 'none';
    checkboxEl.checked = false;
    checkboxEl.addEventListener('change', function() {
        includeNeutral = checkboxEl.checked;
        const filtered = getFilteredCards();
        renderCardList(filtered);
        updateCardStats(filtered);
        updateCardCharts(filtered, selectedClass);
    });
}

// 獲取過濾後的卡片數據
function getFilteredCards() {
    return _getFilteredCards(cardData, selectedClass, includeNeutral, classMap);
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
    const currentSelected = document.querySelector('.class-card.selected');
    const targetCard = document.querySelector(`[data-class="${className}"]`);

    // 如果點擊的是已經選中的卡片，不做任何操作
    if (currentSelected && currentSelected.dataset.class === className) {
        return;
    }

    // 移除選中狀態，添加新的
    if (currentSelected) currentSelected.classList.remove('selected');
    if (targetCard) targetCard.classList.add('selected');

    // 更新選中的職業
    selectedClass = className;
    // 顯示/隱藏勾選框
    if (className !== 'all' && className !== 'neutral') {
        toggleEl.style.display = 'flex';
    } else {
        toggleEl.style.display = 'none';
        includeNeutral = false;
        checkboxEl.checked = false;
    }
    // 根據選擇的職業過濾卡片，計算一次傳給所有函式
    const filtered = getFilteredCards();
    updateCardStats(filtered);
    updateCardCharts(filtered, className);
    renderCardList(filtered);
}

function updateCardCharts(filteredCards, cls) {
    const pieLabels = filteredCards.map(card => card.名稱);
    const pieData = filteredCards.map(card => card.數量);
    const pieColors = cls === 'all'
        ? filteredCards.map((_, i) => chartColors[i % chartColors.length])
        : filteredCards.map(() => classData[cls]?.color || '#888');
    cardPieChart.data.labels = pieLabels;
    cardPieChart.data.datasets[0].data = pieData;
    cardPieChart.data.datasets[0].backgroundColor = pieColors;
    cardPieChart.update('none');
    cardBarChart.data.labels = pieLabels;
    cardBarChart.data.datasets[0].data = pieData;
    cardBarChart.data.datasets[0].backgroundColor = pieColors;
    cardBarChart.data.datasets[0].borderColor = pieColors;
    cardBarChart.update('none');
    cardPieTitleEl.textContent = cls === 'all' ? '全部牌分布圓餅圖' : `${classData[cls]?.name || ''}牌分布圓餅圖`;
    cardBarTitleEl.textContent = cls === 'all' ? '全部牌統計圖表' : `${classData[cls]?.name || ''}牌統計圖表`;
}

// 載入卡片數據
async function loadCardData() {
    try {
        const response = await fetch('cards_data.json');
        const rawData = await response.json();
        cardData = normalizeCardData(rawData, classMap);
        updateCardStats(cardData);
        updateCardCharts(cardData, 'all');
        renderCardList(cardData);
    } catch (error) {
        console.log('無法載入卡片數據');
        updateCardStats([]);
    }
}

// 更新卡片統計
function updateCardStats(filteredCards) {
    totalCardTypesEl.textContent = filteredCards.length;
    sharedCardsEl.textContent = filteredCards.filter(card => card.數量 > 1).length;
}

// 渲染卡片列表
function renderCardList(filteredCards) {
    cardListEl.classList.add('loading');
    const fragment = document.createDocumentFragment();
    filteredCards.forEach(card => {
        const count = card.數量;
        const c3 = card.帶3 || 0;
        const c2 = card.帶2 || 0;
        const c1 = card.帶1 || 0;
        let total;
        if (card._isNeutralByClass) {
            total = classData[card.byclass]?.count || 0;
        } else if (card.class === 'neutral') {
            total = classData['all']?.count || 0;
        } else {
            total = classData[card.class]?.count || 0;
        }
        const c0 = calculateC0(total, c1, c2, c3);
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
        fragment.appendChild(cardElement);
    });
    cardListEl.innerHTML = '';
    cardListEl.appendChild(fragment);
    setTimeout(() => {
        cardListEl.classList.remove('loading');
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
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: classKeys.map(k => classData[k].name),
            datasets: [{
                data: classKeys.map(k => classData[k].count),
                backgroundColor: classKeys.map(k => classData[k].color),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12 }, padding: 20 }
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
    });
}

// 創建長條圖
function createBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classKeys.map(k => classData[k].name),
            datasets: [{
                label: '數量',
                data: classKeys.map(k => classData[k].count),
                backgroundColor: classKeys.map(k => classData[k].color),
                borderColor: classKeys.map(k => classData[k].color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
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
