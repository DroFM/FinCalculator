// Константы
const SCENARIOS = {
    optimistic: { returnRate: 0.15, inflationRate: 0.07 },
    moderate:   { returnRate: 0.135, inflationRate: 0.08 },
    pessimistic:{ returnRate: 0.08, inflationRate: 0.10 }
};
const RETIREMENT_RETURN = 0.07;
const MONTHS_IN_YEAR = 12;

// Определяем, используется ли мобильное устройство
const isMobile = window.innerWidth <= 600;

// Массив для хранения финансовых целей
let financialGoals = [];

// Описание сценариев
const scenarioDescriptions = {
    optimistic: 'Оптимистичный сценарий: доходность 15%, инфляция 7%. Подразумевает высокий рост инвестиций и умеренную инфляцию.',
    moderate: 'Реалистичный сценарий: доходность 13.5%, инфляция 8%. Сбалансированный вариант для долгосрочного планирования.',
    pessimistic: 'Пессимистичный сценарий: доходность 8%, инфляция 10%. Консервативный подход с учетом возможных рисков.',
};

// Функции форматирования
function formatInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value) {
        let number = parseInt(value);
        input.value = number.toLocaleString('ru-RU');
    } else {
        input.value = '';
    }
}

function getNumberFromFormattedString(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\D/g, '')) || 0;
}

// Инициализация полей ввода
function initializeNumberInputs() {
    const numberInputs = [
        'current-savings',
        'monthly-income',
        'monthly-expenses',
        'monthly-savings',
        'desired-retirement-income',
        'goal-amount'
    ];

    numberInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.type = 'text';
            
            let previousValue = '';
            
            input.addEventListener('input', function(e) {
                if (!/^\d*$/.test(this.value.replace(/\s/g, ''))) {
                    this.value = previousValue;
                    return;
                }
                previousValue = this.value;
                formatInput(this);
            });
        }
    });
}

// Функции для работы с целями
function addGoal() {
    const name = document.getElementById('goal-name').value;
    const amount = getNumberFromFormattedString(document.getElementById('goal-amount').value);
    const year = parseInt(document.getElementById('goal-year').value);

    if (!name || !amount || !year) {
        alert('Пожалуйста, заполните все поля цели');
        return;
    }

    financialGoals.push({ id: Date.now(), name, amount, year });
    updateGoalsDisplay();
    calculateFinancialPlan();

    // Очистка полей
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-amount').value = '';
    document.getElementById('goal-year').value = '';
}

function removeGoal(goalId) {
    financialGoals = financialGoals.filter(goal => goal.id !== goalId);
    updateGoalsDisplay();
    calculateFinancialPlan();
}

function updateGoalsDisplay() {
    const container = document.getElementById('goals-container');
    container.innerHTML = financialGoals
        .sort((a, b) => a.year - b.year)
        .map(goal => `
            <div class="result-item" style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${goal.name}</strong><br>
                        <span>${goal.amount.toLocaleString('ru-RU')} ₽</span> через ${goal.year} ${pluralizeYears(goal.year)}
                    </div>
                    <button onclick="removeGoal(${goal.id})" 
                            style="background: var(--danger-color); width: auto; padding: 0.5rem 1rem; margin: 0;">
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
}

function pluralizeYears(years) {
    if (years % 10 === 1 && years % 100 !== 11) return 'год';
    if ([2,3,4].includes(years % 10) && ![12,13,14].includes(years % 100)) return 'года';
    return 'лет';
}

// Основные функции расчета
function calculateFinancialPlan() {
    // Определяем, находимся ли мы на странице результатов
    const isResultPage = window.location.pathname.includes('result.html');
    
    // In mobile mode, if we're on result.html, we don't need to run this function
    // as result.html has its own implementation
    if (isResultPage && isMobile) {
        return;
    }
    
    // Получаем данные
    let data = {};
    
    if (isResultPage) {
        // На странице результатов берем данные из localStorage
        const savedData = localStorage.getItem('financialPlannerData');
        if (!savedData) return;
        
        const loadedData = JSON.parse(savedData);
        const scenario = document.getElementById('scenario').value;
        
        data = {
            age: parseInt(loadedData.age) || 0,
            retirementAge: parseInt(loadedData.retirementAge) || 0,
            currentSavings: getNumberFromFormattedString(loadedData.currentSavings),
            monthlyIncome: getNumberFromFormattedString(loadedData.monthlyIncome),
            monthlyExpenses: getNumberFromFormattedString(loadedData.monthlyExpenses),
            monthlySavings: getNumberFromFormattedString(loadedData.monthlySavings),
            desiredRetirementIncome: getNumberFromFormattedString(loadedData.desiredRetirementIncome),
            lifeExpectancy: parseInt(loadedData.lifeExpectancy) || 80,
            inflationRate: SCENARIOS[scenario].inflationRate,
            returnRate: SCENARIOS[scenario].returnRate
        };
    } else {
        // На основной странице берем данные из формы
        const scenario = document.getElementById('scenario').value;
        data = {
            age: parseInt(document.getElementById('age').value) || 0,
            retirementAge: parseInt(document.getElementById('retirement-age').value) || 0,
            currentSavings: getNumberFromFormattedString(document.getElementById('current-savings').value),
            monthlyIncome: getNumberFromFormattedString(document.getElementById('monthly-income').value),
            monthlyExpenses: getNumberFromFormattedString(document.getElementById('monthly-expenses').value),
            monthlySavings: getNumberFromFormattedString(document.getElementById('monthly-savings').value),
            desiredRetirementIncome: getNumberFromFormattedString(document.getElementById('desired-retirement-income').value),
            lifeExpectancy: parseInt(document.getElementById('life-expectancy').value) || 80,
            inflationRate: SCENARIOS[scenario].inflationRate,
            returnRate: SCENARIOS[scenario].returnRate
        };
    }

    if (!isValidData(data)) return;

    const yearsToRetirement = data.retirementAge - data.age;
    const yearsInRetirement = data.lifeExpectancy - data.retirementAge;

    const requiredAmount = calculateRequiredAmount(data, yearsToRetirement, yearsInRetirement);
    const projectionResults = calculateProjectedAmounts(data);
    const recommendedSavings = calculateRecommendedSavings(data, requiredAmount, yearsToRetirement);

    updateResults(data, requiredAmount, projectionResults, recommendedSavings);
    updateChart(
        projectionResults.labels, 
        projectionResults.projectedData, 
        projectionResults.requiredData,
        projectionResults.contributionsData
    );
}

// Все остальные функции из оригинального JavaScript

// Функции для сохранения данных, расчета и т.д.
function saveDataToLocalStorage() {
    const dataToSave = {
        age: document.getElementById('age').value,
        retirementAge: document.getElementById('retirement-age').value,
        currentSavings: document.getElementById('current-savings').value,
        monthlyIncome: document.getElementById('monthly-income').value,
        monthlyExpenses: document.getElementById('monthly-expenses').value,
        monthlySavings: document.getElementById('monthly-savings').value,
        desiredRetirementIncome: document.getElementById('desired-retirement-income').value,
        lifeExpectancy: document.getElementById('life-expectancy').value,
        scenario: document.getElementById('scenario').value,
        autoCalculateSavings: document.getElementById('auto-calculate-savings').checked,
        financialGoals: financialGoals
    };

    localStorage.setItem('financialPlannerData', JSON.stringify(dataToSave));
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeNumberInputs();
    loadDataFromLocalStorage();
    setupSavingsCalculation();
    setupAutoSave();
    addClearDataButton();
    document.getElementById('scenario').addEventListener('change', function() {
        calculateFinancialPlan();
        generateRecommendations();
        updateScenarioDesc();
    });
    
    // Добавляем обработчик изменения размера окна для корректной работы мобильного/десктопного режимов
    window.addEventListener('resize', function() {
        const wasDesktop = !isMobile;
        const isMobileNow = window.innerWidth <= 600;
        
        // Если режим изменился, перезагружаем страницу для правильного отображения
        if (wasDesktop !== !isMobileNow) {
            location.reload();
        }
    });
    
    // Если на десктопе и есть валидные данные, запускаем расчет
    if (!isMobile && document.body.classList.contains('show-results')) {
        calculateFinancialPlan();
        generateRecommendations();
        updateScenarioDesc();
    }
});

function saveAndGoToResult() {
    // Make sure we save all form data first
    saveDataToLocalStorage();
    
    if (isMobile) {
        // Calculate all data and store it in localStorage
        const scenario = document.getElementById('scenario').value;
        const data = {
            age: parseInt(document.getElementById('age').value) || 0,
            retirementAge: parseInt(document.getElementById('retirement-age').value) || 0,
            currentSavings: getNumberFromFormattedString(document.getElementById('current-savings').value),
            monthlyIncome: getNumberFromFormattedString(document.getElementById('monthly-income').value),
            monthlyExpenses: getNumberFromFormattedString(document.getElementById('monthly-expenses').value),
            monthlySavings: getNumberFromFormattedString(document.getElementById('monthly-savings').value),
            desiredRetirementIncome: getNumberFromFormattedString(document.getElementById('desired-retirement-income').value),
            lifeExpectancy: parseInt(document.getElementById('life-expectancy').value) || 80,
            inflationRate: SCENARIOS[scenario].inflationRate,
            returnRate: SCENARIOS[scenario].returnRate,
            scenario: scenario,
            financialGoals: financialGoals
        };
        
        // Store the calculated data as well
        localStorage.setItem('financialPlannerData', JSON.stringify(data));
        
        // На мобильных устройствах перенаправляем на result.html
        window.location.href = 'result.html';
    } else {
        // Получаем данные для проверки их валидности
        const age = parseInt(document.getElementById('age').value) || 0;
        const retirementAge = parseInt(document.getElementById('retirement-age').value) || 0;
        
        // Проверяем валидность данных
        if (age > 0 && retirementAge > 0 && age < retirementAge) {
            // Данные валидны, показываем результаты
            document.body.classList.add('show-results');
            
            // На десктопах прокручиваем к блоку с графиком
            const chartBlock = document.querySelector('.chart-scenario-block');
            if (chartBlock) {
                chartBlock.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Обновляем результаты и рекомендации
            calculateFinancialPlan();
            generateRecommendations();
            updateScenarioDesc();
        } else {
            // Данные невалидны, показываем сообщение об ошибке
            alert('Пожалуйста, заполните все обязательные поля. Возраст выхода на пенсию должен быть больше текущего возраста.');
        }
    }
}

function toggleMenu() {
    var menu = document.getElementById('dropdownMenu');
    menu.classList.toggle('show');
}

// Функция для настройки автоматического расчета ежемесячных накоплений
function setupSavingsCalculation() {
    const checkboxAutoCalc = document.getElementById('auto-calculate-savings');
    const inputMonthlySavings = document.getElementById('monthly-savings');
    const inputMonthlyIncome = document.getElementById('monthly-income');
    const inputMonthlyExpenses = document.getElementById('monthly-expenses');

    // Функция для обновления значения накоплений
    function updateSavingsValue() {
        if (checkboxAutoCalc.checked) {
            const income = getNumberFromFormattedString(inputMonthlyIncome.value);
            const expenses = getNumberFromFormattedString(inputMonthlyExpenses.value);
            const savings = income - expenses;
            
            if (savings >= 0) {
                inputMonthlySavings.value = savings.toLocaleString('ru-RU');
                inputMonthlySavings.disabled = true;
            } else {
                inputMonthlySavings.value = '';
                inputMonthlySavings.disabled = true;
            }
        } else {
            inputMonthlySavings.disabled = false;
        }
    }

    // Добавление обработчиков событий
    if (checkboxAutoCalc && inputMonthlySavings) {
        checkboxAutoCalc.addEventListener('change', updateSavingsValue);
        inputMonthlyIncome.addEventListener('input', function() {
            if (checkboxAutoCalc.checked) {
                updateSavingsValue();
            }
        });
        inputMonthlyExpenses.addEventListener('input', function() {
            if (checkboxAutoCalc.checked) {
                updateSavingsValue();
            }
        });

        // Первоначальное обновление значения
        updateSavingsValue();
    }
}

// Функция для проверки валидности данных
function isValidData(data) {
    if (data.age === 0 || data.retirementAge === 0) {
        return false;
    }
    if (data.age >= data.retirementAge) {
        return false;
    }
    return true;
}

// Функция для обновления описания сценария
function updateScenarioDesc() {
    const scenarioSelect = document.getElementById('scenario');
    const scenarioDesc = document.getElementById('scenario-desc');
    
    if (scenarioSelect && scenarioDesc) {
        const selectedScenario = scenarioSelect.value;
        scenarioDesc.textContent = scenarioDescriptions[selectedScenario];
    }
}

// Функция для расчета необходимой суммы
function calculateRequiredAmount(data, yearsToRetirement, yearsInRetirement) {
    const inflationAdjustedIncome = data.desiredRetirementIncome * Math.pow(1 + data.inflationRate, yearsToRetirement);
    const realReturn = (1 + RETIREMENT_RETURN) / (1 + data.inflationRate) - 1;
    
    if (Math.abs(realReturn) < 0.0001) {
        return inflationAdjustedIncome * 12 * yearsInRetirement;
    } else {
        return (inflationAdjustedIncome * 12) * (1 - Math.pow(1 + realReturn, -yearsInRetirement)) / realReturn;
    }
}

// Функция для расчета прогнозируемых сумм
function calculateProjectedAmounts(data) {
    const yearsToRetirement = data.retirementAge - data.age;
    const yearsInRetirement = data.lifeExpectancy - data.retirementAge;
    const labels = [];
    const projectedData = [];
    const requiredData = [];
    const contributionsData = [];

    let currentAmount = data.currentSavings;
    const monthlyReturn = Math.pow(1 + data.returnRate, 1/12) - 1;
    const retirementMonthlyReturn = Math.pow(1 + RETIREMENT_RETURN, 1/12) - 1;
    let indexedMonthlySavings = data.monthlySavings;

    // Этап накопления
    for (let year = 0; year <= yearsToRetirement; year++) {
        labels.push(`Год ${year}`);
        projectedData.push(Math.max(0, currentAmount));
        // Целевая линия
        const requiredAmount = calculateRequiredAmount(data, yearsToRetirement, yearsInRetirement);
        requiredData.push(requiredAmount * (year / yearsToRetirement));
        contributionsData.push(indexedMonthlySavings * 12);
        for (let month = 0; month < 12; month++) {
            currentAmount = (currentAmount + indexedMonthlySavings) * (1 + monthlyReturn);
        }
        indexedMonthlySavings *= (1 + data.inflationRate);
    }
    const retirementAmount = currentAmount;

    // Этап пенсии (расходование)
    let targetAmount = calculateRequiredAmount(data, yearsToRetirement, yearsInRetirement);
    let monthlySpending = data.desiredRetirementIncome * Math.pow(1 + data.inflationRate, yearsToRetirement);
    for (let year = 1; year <= yearsInRetirement; year++) {
        labels.push(`Пенсия ${year}`);
        for (let month = 0; month < 12; month++) {
            currentAmount = (currentAmount - monthlySpending) * (1 + retirementMonthlyReturn);
            targetAmount = (targetAmount - monthlySpending) * (1 + retirementMonthlyReturn);
        }
        projectedData.push(Math.max(0, currentAmount));
        requiredData.push(Math.max(0, targetAmount));
        contributionsData.push(0); // На пенсии пополнений нет
        monthlySpending *= (1 + data.inflationRate);
    }
    
    return { 
        labels, 
        projectedData, 
        requiredData, 
        contributionsData, 
        retirementAmount 
    };
}

// Функция для расчета рекомендуемых накоплений
function calculateRecommendedSavings(data, requiredAmount, yearsToRetirement) {
    const realReturn = (1 + data.returnRate) / (1 + data.inflationRate) - 1;
    const realRequiredAmount = requiredAmount / Math.pow(1 + data.inflationRate, yearsToRetirement);
    const realMonthlyReturn = Math.pow(1 + realReturn, 1/12) - 1;
    const monthsToRetirement = yearsToRetirement * 12;
    
    const realFutureValueFactor = Math.pow(1 + realMonthlyReturn, monthsToRetirement);
    
    const realRecommendedSavings = (realRequiredAmount - data.currentSavings * realFutureValueFactor) / 
        ((realFutureValueFactor - 1) / realMonthlyReturn);
    
    return realRecommendedSavings;
}

// Функция для обновления результатов
function updateResults(data, requiredAmount, projectionResults, recommendedSavings) {
    const yearsToRetirement = data.retirementAge - data.age;
    
    const presentValueRequired = requiredAmount / 
        Math.pow(1 + data.inflationRate, yearsToRetirement);
    const presentValueProjected = projectionResults.retirementAmount / 
        Math.pow(1 + data.inflationRate, yearsToRetirement);

    // Обновляем блок с информацией о достижимости цели
    const gaugeTitle = document.getElementById('gauge-title');
    const gaugeDesc = document.getElementById('gauge-desc');
    
    if (projectionResults.retirementAmount >= requiredAmount) {
        gaugeTitle.textContent = 'Цель достижима';
        gaugeDesc.textContent = 'У вас получится профинансировать свою пенсию с заданными параметрами.';
    } else {
        gaugeTitle.textContent = 'Цель не достижима';
        gaugeDesc.textContent = 'С текущими параметрами вам не хватит средств для достижения поставленной цели.';
    }

    // Обновляем значения с пояснениями
    document.getElementById('required-amount').innerHTML = `
        <div class="result-value-container">
            <div class="result-value">${formatCurrency(requiredAmount)}</div>
            <div class="present-value-note">
                (${formatCurrency(presentValueRequired)} в текущих деньгах)
            </div>
        </div>
        <div class="result-explanation">
            Сумма денег, которая потребуется к моменту выхода на пенсию, чтобы хватило на запланированный ежемесячный доход на протяжении всей пенсии. Это целевой размер вашего капитала к началу пенсии.
        </div>
    `;

    document.getElementById('projected-amount').innerHTML = `
        <div class="result-value-container">
            <div class="result-value">${formatCurrency(projectionResults.retirementAmount)}</div>
            <div class="present-value-note">
                (${formatCurrency(presentValueProjected)} в текущих деньгах)
            </div>
        </div>
        <div class="result-explanation">
            Ожидаемый размер ваших накоплений к моменту выхода на пенсию при текущем финансовом плане. Это сколько денег вы сможете накопить к пенсии, исходя из ваших текущих сбережений, ежемесячных отчислений и выбранной стратегии инвестиций.
        </div>
    `;

    document.getElementById('recommended-savings').innerHTML = `
        <div class="result-value">${formatCurrency(Math.max(0, recommendedSavings))}</div>
        <div class="result-explanation">
            Расчетная сумма, которую вам необходимо откладывать каждый месяц для достижения необходимой суммы к пенсии. Если вы будете инвестировать примерно столько ежемесячно, к пенсии накопится достаточная сумма.
        </div>
    `;

    let monthlyGap, gapExplanation;
    if (projectionResults.retirementAmount >= requiredAmount) {
        monthlyGap = data.monthlySavings - recommendedSavings;
        if (monthlyGap < 0) monthlyGap = 0;
        gapExplanation = 'Ваши прогнозируемые накопления превышают необходимую сумму к пенсии. Вы на правильном пути!';
    } else {
        monthlyGap = data.monthlySavings - recommendedSavings;
        gapExplanation = monthlyGap < 0
            ? 'Отрицательное значение означает, что вы откладываете меньше требуемого и не достигнете цели.'
            : 'Положительное значение означает, что вы откладываете больше, чем необходимо для достижения цели.';
    }

    document.getElementById('monthly-gap').innerHTML = `
        <div class="result-value">${formatCurrency(monthlyGap)}</div>
        <div class="result-explanation">
            Разница между вашим текущим размером ежемесячных сбережений и рекомендованной суммой. ${gapExplanation}
        </div>
    `;
}

// Функция для обновления графика
function updateChart(labels, projectedData, requiredData, contributionsData) {
    const ctx = document.getElementById('chart').getContext('2d');
    
    if (window.financialChart) {
        window.financialChart.destroy();
    }
    
    window.financialChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Прогнозируемые накопления',
                    data: projectedData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Целевые накопления',
                    data: requiredData,
                    borderColor: '#e53e3e',
                    backgroundColor: 'rgba(229, 62, 62, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label + ': ' + formatCurrencyShort(context.parsed.y);
                            if (context.datasetIndex === 0) {
                                const index = context.dataIndex;
                                const contributionValue = contributionsData[index];
                                return [label, 'Прогнозируемые пополнения: ' + formatCurrencyShort(contributionValue)];
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        },
                        font: function(context) {
                            return window.innerWidth <= 600 ? { size: 10 } : { size: 13 };
                        }
                    },
                    grid: {
                        borderDash: [6, 6],
                        color: 'rgba(13,63,74,0.2)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Функция для форматирования валюты
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(amount);
}

// Функция для краткого форматирования валюты
function formatCurrencyShort(value) {
    if (value === 0) return '0 ₽';
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
        return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + (isMobile ? ' млрд' : ' млрд ₽');
    }
    if (absValue >= 1000000) {
        return (value / 1000000).toFixed(1).replace(/\.0$/, '') + (isMobile ? ' млн' : ' млн ₽');
    }
    if (absValue >= 1000) {
        return (value / 1000).toFixed(0) + (isMobile ? ' тыс.' : ' тыс. ₽');
    }
    return value.toFixed(0) + (isMobile ? '' : ' ₽');
}

// Функция для загрузки данных из localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('financialPlannerData');
    if (!savedData) return;
    
    const data = JSON.parse(savedData);
    
    if (data.age) document.getElementById('age').value = data.age;
    if (data.retirementAge) document.getElementById('retirement-age').value = data.retirementAge;
    
    // Форматируем денежные значения
    if (data.currentSavings) {
        const value = getNumberFromFormattedString(data.currentSavings);
        document.getElementById('current-savings').value = value.toLocaleString('ru-RU');
    }
    if (data.monthlyIncome) {
        const value = getNumberFromFormattedString(data.monthlyIncome);
        document.getElementById('monthly-income').value = value.toLocaleString('ru-RU');
    }
    if (data.monthlyExpenses) {
        const value = getNumberFromFormattedString(data.monthlyExpenses);
        document.getElementById('monthly-expenses').value = value.toLocaleString('ru-RU');
    }
    
    // Настраиваем автоматический расчет месячных накоплений
    if (data.autoCalculateSavings !== undefined) {
        const autoCalculateCheckbox = document.getElementById('auto-calculate-savings');
        autoCalculateCheckbox.checked = data.autoCalculateSavings;
        
        if (data.autoCalculateSavings) {
            // Если автоматический расчет включен, вычисляем накопления на основе дохода и расходов
            const income = getNumberFromFormattedString(document.getElementById('monthly-income').value);
            const expenses = getNumberFromFormattedString(document.getElementById('monthly-expenses').value);
            const savings = income - expenses;
            
            if (savings > 0) {
                document.getElementById('monthly-savings').value = savings.toLocaleString('ru-RU');
            } else {
                document.getElementById('monthly-savings').value = '';
            }
            document.getElementById('monthly-savings').disabled = true;
        } else {
            // Иначе используем сохраненное значение
            if (data.monthlySavings) {
                const value = getNumberFromFormattedString(data.monthlySavings);
                if (value > 0) {
                    document.getElementById('monthly-savings').value = value.toLocaleString('ru-RU');
                } else {
                    document.getElementById('monthly-savings').value = '';
                }
            }
            document.getElementById('monthly-savings').disabled = false;
        }
    } else if (data.monthlySavings) {
        // Если нет информации о checkbox, но есть о накоплениях, загружаем их
        const value = getNumberFromFormattedString(data.monthlySavings);
        if (value > 0) {
            document.getElementById('monthly-savings').value = value.toLocaleString('ru-RU');
        } else {
            document.getElementById('monthly-savings').value = '';
        }
    }
    
    if (data.desiredRetirementIncome) {
        const value = getNumberFromFormattedString(data.desiredRetirementIncome);
        document.getElementById('desired-retirement-income').value = value.toLocaleString('ru-RU');
    }
    
    if (data.lifeExpectancy) document.getElementById('life-expectancy').value = data.lifeExpectancy;
    if (data.scenario) document.getElementById('scenario').value = data.scenario;
    
    if (data.financialGoals && Array.isArray(data.financialGoals)) {
        financialGoals = data.financialGoals;
        updateGoalsDisplay();
    }
    
    // Проверяем, есть ли валидные данные для отображения результатов
    const age = parseInt(data.age) || 0;
    const retirementAge = parseInt(data.retirementAge) || 0;
    
    // Если данные загружены и они валидны, показываем блоки с результатами
    if (age > 0 && retirementAge > 0 && age < retirementAge && !isMobile) {
        document.body.classList.add('show-results');
    }
}

// Функция для настройки автосохранения
function setupAutoSave() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', saveDataToLocalStorage);
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('input', saveDataToLocalStorage);
        }
    });
}

// Функция для генерации рекомендаций
function generateRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    const scenario = document.getElementById('scenario').value;
    const data = {
        age: parseInt(document.getElementById('age').value) || 0,
        retirementAge: parseInt(document.getElementById('retirement-age').value) || 0,
        currentSavings: getNumberFromFormattedString(document.getElementById('current-savings').value),
        monthlyIncome: getNumberFromFormattedString(document.getElementById('monthly-income').value),
        monthlyExpenses: getNumberFromFormattedString(document.getElementById('monthly-expenses').value),
        monthlySavings: getNumberFromFormattedString(document.getElementById('monthly-savings').value),
        desiredRetirementIncome: getNumberFromFormattedString(document.getElementById('desired-retirement-income').value),
        lifeExpectancy: parseInt(document.getElementById('life-expectancy').value) || 80,
        inflationRate: SCENARIOS[scenario].inflationRate,
        returnRate: SCENARIOS[scenario].returnRate
    };
    
    if (!isValidData(data)) return;
    
    const yearsToRetirement = data.retirementAge - data.age;
    const requiredAmount = calculateRequiredAmount(data, yearsToRetirement, data.lifeExpectancy - data.retirementAge);
    const projectionResults = calculateProjectedAmounts(data);
    const recommendedSavings = calculateRecommendedSavings(data, requiredAmount, yearsToRetirement);
    const lastProjectedAmount = projectionResults.projectedData[projectionResults.projectedData.length - 1];
    const gap = lastProjectedAmount - requiredAmount;
    
    // Получаем текущие расчетные значения
    const requiredAmountElement = document.getElementById('required-amount');
    const projectedAmountElement = document.getElementById('projected-amount');
    const recommendedSavingsElement = document.getElementById('recommended-savings');
    const monthlyGapElement = document.getElementById('monthly-gap');
    
    // Преобразование текстовых значений в числа для сравнения
    const requiredAmountValue = getNumberFromFormattedString(requiredAmountElement ? requiredAmountElement.innerText : '0');
    const projectedAmountValue = getNumberFromFormattedString(projectedAmountElement ? projectedAmountElement.innerText : '0');
    const recommendedSavingsValue = getNumberFromFormattedString(recommendedSavingsElement ? recommendedSavingsElement.innerText : '0');
    const monthlyGapValue = getNumberFromFormattedString(monthlyGapElement ? monthlyGapElement.innerText : '0');
    
    // Соотношение рекомендуемых и текущих сбережений
    const savingsGapPercent = recommendedSavingsValue ? (data.monthlySavings - recommendedSavingsValue) / recommendedSavingsValue * 100 : 0;
    
    let recommendations = [];
    
    // Определяем, есть ли дефицит или профицит
    const hasInsufficientFunds = lastProjectedAmount < requiredAmount;
    const hasDeficit = hasInsufficientFunds || data.monthlySavings < recommendedSavings;
    
    if (hasDeficit) {
        // Рекомендации при дефиците средств
        recommendations.push({
            title: '💸 Увеличьте ежемесячные инвестиции',
            text: `Чтобы достичь желаемого пенсионного дохода в ${formatCurrency(data.desiredRetirementIncome)} в месяц, рекомендуется увеличить ежемесячные инвестиции ${data.monthlySavings < recommendedSavings ? `на ${formatCurrency(Math.abs(data.monthlySavings - recommendedSavings))}` : ''}. ${hasInsufficientFunds ? 'По текущему плану ваших накоплений не хватит для желаемого дохода на пенсии.' : ''}`
        });
        
        recommendations.push({
            title: '💰 Откройте ИИС (индивидуальный инвестиционный счёт)',
            text: 'Этот инструмент дает налоговый вычет 13% на взносы до 400 тыс. ₽ в год (максимум 52 тыс. ₽ возврата ежегодно). Таким образом, часть инвестиций вам фактически вернется от государства, что повысит общий шанс достижения цели.'
        });
        
        recommendations.push({
            title: '📉 Оптимизируйте расходы и бюджет',
            text: 'Проанализируйте текущие траты: возможно, есть статьи расходов, которые можно сократить, а сэкономленные деньги направить в инвестиции. Сокращение дискреционных расходов и перенаправление этих средств на пенсионные накопления заметно улучшит ваши перспективы.'
        });
        
        // Если большой дефицит, предложим отложить пенсию
        if (savingsGapPercent < -20) {
            recommendations.push({
                title: '⏳ Рассмотрите возможность более позднего выхода на пенсию',
                text: 'Увеличение горизонта накопления (например, выход на пенсию не в ' + data.retirementAge + ', а в ' + (data.retirementAge + 3) + '-' + (data.retirementAge + 5) + ' лет) позволит дольше пополнять пенсионный капитал и уменьшит период, в течение которого средства нужны на пенсии.'
            });
        }
        
        // Если очень большой дефицит, предложим скорректировать цель
        if (savingsGapPercent < -40) {
            recommendations.push({
                title: '🎯 Скорректируйте вашу финансовую цель',
                text: `Целевой доход ${formatCurrency(data.desiredRetirementIncome)} в месяц может быть труднодостижим при текущих условиях. Рассмотрите возможность немного снизить желаемый пенсионный доход или предусмотреть более короткий период выплат. Это уменьшит необходимую сумму к накоплению.`
            });
        }
        
        // Для молодых инвесторов можно предложить более агрессивную стратегию
        if (data.age < 40 && yearsToRetirement > 20) {
            recommendations.push({
                title: '📈 Рассмотрите повышение доходности инвестиций',
                text: 'Учитывая ваш долгосрочный инвестиционный горизонт, вы можете рассмотреть более агрессивную инвестиционную стратегию для потенциального повышения доходности. Однако важно учесть, что это также повышает риски. Проконсультируйтесь с финансовым советником для выбора оптимальной стратегии.'
            });
        }
    } else {
        // Рекомендации при профиците средств
        recommendations.push({
            title: '👍 Вы на правильном пути!',
            text: `Ваш текущий план превышает необходимый уровень. Продолжайте в том же духе!`
        });
        
        if (data.monthlySavings > recommendedSavings * 1.2) {
            recommendations.push({
                title: '🏝️ Рассмотрите более ранний выход на пенсию',
                text: `У вас есть возможность выйти на пенсию раньше запланированного срока (${data.retirementAge} лет) или поставить более амбициозную цель по пенсионному доходу, поскольку ваш текущий уровень сбережений опережает план.`
            });
        }
        
        if (yearsToRetirement < 10) {
            recommendations.push({
                title: '🔄 Оптимизируйте инвестиционную стратегию',
                text: 'Поскольку вы близки к достижению своей цели, рассмотрите возможность перевода части активов в более консервативные инструменты для защиты накопленного капитала от рыночных колебаний.'
            });
        }
    }
    
    // Добавляем рекомендации в зависимости от других условий
    
    // Универсальные рекомендации (добавляются всегда)
    recommendations.push({
        title: '📈 Диверсификация инвестиций',
        text: 'Разделите ваши инвестиции между разными классами активов: акции (60-70%), облигации (20-30%), альтернативные инвестиции (5-10%). Это снизит общий риск и повысит устойчивость вашего портфеля к рыночным колебаниям. Для составления оптимального портфеля лучше всего проконсультироваться с финансовым советником.'
    });
    
    // Рекомендация по финансовой подушке
    const monthlyExpensesValue = data.monthlyExpenses || recommendedSavings;
    recommendations.push({
        title: '🛡️ Создайте финансовую подушку',
        text: `Сформируйте резервный фонд в размере ${formatCurrency(monthlyExpensesValue * 6)} (ваших расходов за 6 месяцев). Это обеспечит вам защиту при непредвиденных обстоятельствах и позволит не прерывать инвестиционный план.`
    });
    
    // Налоговые льготы
    recommendations.push({
        title: '💼 Используйте налоговые льготы',
        text: `Максимально используйте инструменты с налоговыми преимуществами, такие как ИИС. При ваших ежемесячных отчислениях ${formatCurrency(data.monthlySavings)} это даст дополнительно ${formatCurrency(data.monthlySavings * 12 * 0.13)} в год за счет налогового вычета.`
    });
    
    // Начать раньше
    recommendations.push({
        title: '⏰ Начните раньше - получите больше',
        text: `Увеличение инвестиционного горизонта всего на 5 лет может увеличить итоговую сумму на ~40%. Рассмотрите возможность увеличения накоплений сейчас для достижения финансовой независимости к ${data.retirementAge - 3} годам.`
    });
    
    // Ипотечная нагрузка
    const returnRateValue = data.returnRate * 100;
    recommendations.push({
        title: '🏠 Оптимизация ипотечной нагрузки',
        text: `Если у вас есть ипотека, сравните её ставку с потенциальной доходностью инвестиций. При ставке ниже ${returnRateValue - 2}% может быть выгоднее инвестировать свободные средства, а не досрочно погашать кредит.`
    });
    
    // Страхование
    const monthlyIncomeValue = data.monthlyIncome || data.monthlySavings * 2;
    recommendations.push({
        title: '🏥 Страхование жизни и здоровья',
        text: `Защитите свой финансовый план с помощью страхования жизни и здоровья. При вашем ежемесячном доходе ${formatCurrency(monthlyIncomeValue)} и обязательствах стоит рассмотреть страховку с покрытием ${formatCurrency(monthlyIncomeValue * 60)}.`
    });
    
    // Балансировка риска
    recommendations.push({
        title: '⚖️ Балансируйте риск и доходность',
        text: `При вашем инвестиционном горизонте ${yearsToRetirement} лет оптимальное соотношение акций/облигаций составляет ${100 - data.age}/${data.age}. Это позволит получить ожидаемую доходность ${returnRateValue}% при умеренном риске.`
    });
    
    // Оптимизация расходов
    recommendations.push({
        title: '🛒 Оптимизация расходов',
        text: `Сократив необязательные расходы на 10% (примерно ${formatCurrency(monthlyExpensesValue * 0.1)}), вы сможете увеличить ежемесячные инвестиции. За ${yearsToRetirement} лет это даст дополнительно ${formatCurrency(monthlyExpensesValue * 0.1 * 12 * yearsToRetirement * Math.pow(1 + data.returnRate, yearsToRetirement/2))}.`
    });
    
    // Планирование наследства
    if (data.age > 45 || yearsToRetirement < 20) {
        recommendations.push({
            title: '🧓 Планирование наследства',
            text: `При достижении финансовой цели в ${formatCurrency(requiredAmount)}, подумайте о планировании наследства и передаче активов. Правильное структурирование поможет минимизировать налоги и обеспечить исполнение ваших пожеланий.`
        });
    }
    
    // Для молодых инвесторов с большим горизонтом
    if (data.age < 35 && yearsToRetirement > 25) {
        recommendations.push({
            title: '💎 Используйте преимущество долгосрочного инвестирования',
            text: 'Ваш долгий инвестиционный горизонт является значительным преимуществом. Даже небольшое увеличение ежемесячных инвестиций сейчас может значительно увеличить ваш пенсионный капитал благодаря эффекту сложного процента.'
        });
    }
    
    // Для инвесторов среднего возраста
    if (data.age >= 35 && data.age < 50) {
        recommendations.push({
            title: '⚡ Максимизируйте ваши инвестиции сейчас',
            text: 'Сейчас ключевой период для наращивания пенсионных накоплений. Постарайтесь максимизировать инвестиции, пока у вас есть стабильный доход и активная карьера.'
        });
    }
    
    // Для инвесторов предпенсионного возраста
    if (yearsToRetirement < 10) {
        recommendations.push({
            title: '🛡️ Защитите свои накопления',
            text: 'По мере приближения к пенсии важно снижать инвестиционные риски. Постепенно переводите часть портфеля в более стабильные активы, чтобы защитить накопленный капитал.'
        });
    }
    
    // Отображаем рекомендации
    if (recommendations.length > 0) {
        let recommendationsHTML = '';
        
        // Выбираем максимум 4 рекомендации, чтобы не перегружать страницу
        const displayRecommendations = recommendations.slice(0, 6);
        
        displayRecommendations.forEach(rec => {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <span class="recommendation-title">${rec.title}</span>
                    <div class="recommendation-text">${rec.text}</div>
                </div>
            `;
        });
        
        container.innerHTML = recommendationsHTML;
    } else {
        container.innerHTML = '<div class="recommendation-item"><p>Недостаточно данных для формирования рекомендаций.</p></div>';
    }
}

// Функция для добавления кнопки очистки данных
function addClearDataButton() {
    const container = document.querySelector('.calculator');
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Очистить все данные';
    clearButton.style.background = 'var(--danger-color)';
    clearButton.style.marginTop = '2rem';
    
    clearButton.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите удалить все введенные данные?')) {
            localStorage.removeItem('financialPlannerData');
            location.reload();
        }
    });
    
    container.appendChild(clearButton);
} 