class TippmixCalculator {
    constructor() {
        this.odds = [];
        this.betAmount = 100;
        this.combination = '3/4';
        this.includeExtra = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.addInitialOdds();
        this.updateDisplay();
    }

    bindEvents() {
        document.getElementById('betAmount').addEventListener('input', (e) => {
            this.betAmount = parseFloat(e.target.value) || 0;
            this.updateDisplay();
        });

        document.getElementById('combination').addEventListener('change', (e) => {
            this.combination = e.target.value;
            this.updateDisplay();
        });

        document.getElementById('addOdd').addEventListener('click', () => {
            this.addOdd();
        });

        document.getElementById('removeOdd').addEventListener('click', () => {
            if (this.odds.length > 1) {
                this.removeLastOdd();
            }
        });

        document.getElementById('includeExtraCombo').addEventListener('change', (e) => {
            this.includeExtra = e.target.checked;
            this.updateDisplay();
        });
    }

    addInitialOdds() {
        const initialOdds = [1.50, 1.80, 2.10, 1.90];
        initialOdds.forEach(value => this.addOdd(value));
    }

    addOdd(value = 1.50) {
        const id = Date.now() + Math.random();
        const odd = { id, value, status: 'pending' };
        this.odds.push(odd);
        this.renderOdd(odd);
        this.updateDisplay();
    }

    removeLastOdd() {
        if (this.odds.length > 0) {
            const lastOdd = this.odds.pop();
            const element = document.querySelector(`[data-id="${lastOdd.id}"]`);
            if (element) element.remove();
            this.updateDisplay();
        }
    }

    updateOdd(id, value) {
        const odd = this.odds.find(o => o.id === id);
        if (odd) {
            odd.value = Math.max(1.01, parseFloat(value) || 1.01);
            this.updateDisplay();
        }
    }

    updateOddStatus(id, status) {
        const odd = this.odds.find(o => o.id === id);
        if (odd) {
            odd.status = status;
            this.updateDisplay();
        }
    }

    renderOdd(odd) {
        const oddsList = document.getElementById('oddsList');
        const oddElement = document.createElement('div');
        oddElement.className = `odd-item ${odd.status}`;
        oddElement.setAttribute('data-id', odd.id);

        oddElement.innerHTML = `
            <button class="status-btn" data-status="pending">FÜGGŐ</button>
            <div class="odd-controls">
                <button class="odd-btn decrement" data-value="-0.01">-0.01</button>
                <button class="odd-btn decrement" data-value="-0.1">-0.1</button>
            </div>
            <input type="number" class="odd-input" value="${odd.value.toFixed(2)}" min="1.01" step="0.01">
            <div class="odd-controls">
                <button class="odd-btn increment" data-value="+0.1">+0.1</button>
                <button class="odd-btn increment" data-value="+0.01">+0.01</button>
            </div>
        `;

        const input = oddElement.querySelector('.odd-input');
        const statusBtn = oddElement.querySelector('.status-btn');
        const decrementBtns = oddElement.querySelectorAll('.decrement');
        const incrementBtns = oddElement.querySelectorAll('.increment');

        input.addEventListener('input', (e) => this.updateOdd(odd.id, e.target.value));
        statusBtn.addEventListener('click', () => this.cycleStatus(odd.id, statusBtn));

        decrementBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const change = parseFloat(btn.dataset.value);
                const newValue = Math.max(1.01, odd.value + change);
                input.value = newValue.toFixed(2);
                this.updateOdd(odd.id, newValue);
            });
        });

        incrementBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const change = parseFloat(btn.dataset.value);
                const newValue = odd.value + change;
                input.value = newValue.toFixed(2);
                this.updateOdd(odd.id, newValue);
            });
        });

        oddsList.appendChild(oddElement);
    }

    cycleStatus(id, button) {
        const odd = this.odds.find(o => o.id === id);
        if (!odd) return;

        let newStatus, newText, newClass;

        switch (odd.status) {
            case 'pending': newStatus = 'won'; newText = 'NYERT'; newClass = 'won-active'; break;
            case 'won': newStatus = 'lost'; newText = 'VESZTETT'; newClass = 'lost-active'; break;
            case 'lost': newStatus = 'pending'; newText = 'FÜGGŐ'; newClass = 'active'; break;
        }

        button.textContent = newText;
        button.className = `status-btn ${newClass}`;
        this.updateOddStatus(id, newStatus);
    }

    calculateCombinations() {
        const [required, total] = this.combination.split('/').map(Number);
        const wonOdds = this.odds.filter(o => o.status === 'won');
        const lostOdds = this.odds.filter(o => o.status === 'lost');
        const pendingOdds = this.odds.filter(o => o.status === 'pending');

        if (lostOdds.length > (total - required)) {
            return { totalBet: 0, maxWin: 0, canWin: false };
        }

        let totalCombinations = this.getCombinations(total, required);
        let totalBet = this.betAmount * totalCombinations;

        const allActiveOdds = [...wonOdds, ...pendingOdds];
        let maxWinCombinations = this.calculateWinningCombinations(allActiveOdds, required);
        let maxWin = maxWinCombinations * this.betAmount;

        // extra kombináció (N/N)
        if (this.includeExtra && required < total) {
            const extraCombos = this.getCombinations(total, total);
            totalCombinations += extraCombos;
            totalBet += this.betAmount * extraCombos;

            const extraWins = this.calculateWinningCombinations(allActiveOdds, total);
            maxWin += extraWins * this.betAmount;
        }

        return { totalBet, maxWin, canWin: maxWin > 0 };
    }

    getCombinations(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        let result = 1;
        for (let i = 0; i < k; i++) result = result * (n - i) / (i + 1);
        return Math.round(result);
    }

    calculateWinningCombinations(odds, required) {
        if (odds.length < required) return 0;
        let totalWin = 0;
        const combinations = this.generateCombinations(odds, required);
        combinations.forEach(combo => {
            const comboOdds = combo.reduce((prod, o) => prod * o.value, 1);
            totalWin += comboOdds;
        });
        return totalWin;
    }

    generateCombinations(arr, size) {
        if (size > arr.length) return [];
        if (size === 1) return arr.map(item => [item]);
        const combinations = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombinations = this.generateCombinations(arr.slice(i + 1), size - 1);
            tailCombinations.forEach(tail => combinations.push([head, ...tail]));
        }
        return combinations;
    }

    updateDisplay() {
        const results = this.calculateCombinations();
        document.getElementById('totalBet').textContent = `${results.totalBet.toLocaleString('hu-HU')} Ft`;
        document.getElementById('maxWin').textContent = `${Math.round(results.maxWin).toLocaleString('hu-HU')} Ft`;
        this.updateCombinationOptions();
    }

    updateCombinationOptions() {
        const select = document.getElementById('combination');
        const currentValue = select.value;
        const oddsCount = this.odds.length;
        const options = [];
        for (let i = 1; i <= oddsCount; i++) options.push(`${i}/${oddsCount}`);
        select.innerHTML = '';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        if (options.includes(currentValue)) {
            select.value = currentValue;
        } else {
            select.value = options[options.length - 1] || `${oddsCount}/${oddsCount}`;
            this.combination = select.value;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new TippmixCalculator());
