/**
 * SkyGlass - Chart.js 매니저 모듈
 */

class WeatherChartManager {
    constructor() {
        this.chartInstance = null;
        this.currentData = null;
        this.currentType = 'temp'; // 'temp' or 'rain'
        this.isFahrenheit = false;
    }

    /**
     * 차트를 초기설정합니다.
     * @param {string} canvasId 
     */
    initChart(canvasId) {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Chart visualization is disabled.');
            return;
        }
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Chart.js 전역 기본 폰트 설정
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '온도',
                    data: [],
                    borderColor: 'rgba(122, 219, 255, 0.85)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                    pointBorderColor: 'rgba(122, 219, 255, 1)',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4, // 곡선 텐션 부여
                    fill: true,
                    backgroundColor: this.getGradient(ctx, 'temp')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // 범례는 숨김 (헤더 탭에서 대체)
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                const val = context.raw;
                                if (this.currentType === 'temp') {
                                    return `기온: ${val}°${this.isFahrenheit ? 'F' : 'C'}`;
                                } else {
                                    return `강수 확률: ${val}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.65)',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.65)',
                            font: {
                                size: 11
                            },
                            callback: (value) => {
                                return this.currentType === 'temp' ? `${value}°` : `${value}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 차트 그라데이션 채우기 효과 생성
     */
    getGradient(ctx, type) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 240);
        if (type === 'temp') {
            gradient.addColorStop(0, 'rgba(122, 219, 255, 0.35)');
            gradient.addColorStop(1, 'rgba(122, 219, 255, 0.0)');
        } else {
            gradient.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
            gradient.addColorStop(1, 'rgba(96, 165, 250, 0.0)');
        }
        return gradient;
    }

    /**
     * 차트 데이터를 갱신합니다.
     * @param {Array} hourlyData 
     * @param {string} type 'temp' 또는 'rain'
     * @param {boolean} isFahrenheit 
     */
    updateChart(hourlyData, type = this.currentType, isFahrenheit = this.isFahrenheit) {
        if (!this.chartInstance) return;

        this.currentData = hourlyData;
        this.currentType = type;
        this.isFahrenheit = isFahrenheit;

        // 라벨 생성 (시간 형식: "09시", "12시")
        const labels = hourlyData.map(h => `${String(h.hour).padStart(2, '0')}시`);
        
        let data = [];
        let datasetLabel = '';
        let strokeColor = '';
        const ctx = this.chartInstance.ctx;

        if (type === 'temp') {
            datasetLabel = '기온';
            strokeColor = 'rgba(122, 219, 255, 0.9)';
            data = hourlyData.map(h => {
                let t = h.temp;
                if (isFahrenheit) {
                    t = (t * 9/5) + 32;
                }
                return Math.round(t * 10) / 10;
            });
        } else {
            datasetLabel = '강수 확률';
            strokeColor = 'rgba(96, 165, 250, 0.9)';
            data = hourlyData.map(h => h.rain_prob);
        }

        // 데이터셋 필드 갱신
        const dataset = this.chartInstance.data.datasets[0];
        dataset.label = datasetLabel;
        dataset.data = data;
        dataset.borderColor = strokeColor;
        dataset.pointBorderColor = strokeColor;
        dataset.backgroundColor = this.getGradient(ctx, type);
        
        this.chartInstance.data.labels = labels;
        this.chartInstance.update();
    }
}

// 전역 인스턴스로 바인딩
window.weatherChartManager = new WeatherChartManager();
