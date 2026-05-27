/**
 * SkyGlass - Core Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 상태 변수 정의
    let currentCity = 'Seoul';
    let isFahrenheit = false;
    let apiKey = localStorage.getItem('owm_api_key') || '';
    let favorites = ['Seoul', 'Tokyo', 'New York'];
    try {
        const storedFavs = localStorage.getItem('fav_cities');
        if (storedFavs) {
            const parsed = JSON.parse(storedFavs);
            if (Array.isArray(parsed)) {
                favorites = parsed;
            }
        }
    } catch (e) {
        console.error('Failed to parse favorites from localStorage:', e);
    }
    let weatherData = null;
    let chartTabType = 'temp'; // 'temp' or 'rain'

    // 2. DOM 요소 선택
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const currentCityNameEl = document.getElementById('current-city-name');
    const toggleFavoriteBtn = document.getElementById('toggle-favorite-btn');
    const localTimeEl = document.getElementById('local-time');
    const unitToggle = document.getElementById('unit-toggle');
    
    // 현재 날씨 요소
    const currentTempEl = document.getElementById('current-temp');
    const currentConditionTextEl = document.getElementById('current-condition-text');
    const mainWeatherIconContainer = document.getElementById('main-weather-icon-container');
    const feelsLikeTempEl = document.getElementById('feels-like-temp');
    const minTempEl = document.getElementById('min-temp');
    const maxTempEl = document.getElementById('max-temp');
    
    // 주간 예보 컨테이너
    const weeklyForecastContainer = document.getElementById('weekly-forecast-container');
    
    // 상세 메트릭 요소
    const aqiValueEl = document.getElementById('aqi-value');
    const aqiStatusEl = document.getElementById('aqi-status');
    const aqiProgressEl = document.getElementById('aqi-progress');
    
    const windSpeedEl = document.getElementById('wind-speed');
    const windDirTextEl = document.getElementById('wind-dir-text');
    const windCompassArrow = document.getElementById('wind-compass-arrow');
    
    const uvValueEl = document.getElementById('uv-value');
    const uvStatusEl = document.getElementById('uv-status');
    const uvIndicatorEl = document.getElementById('uv-indicator');
    
    const sunriseTimeEl = document.getElementById('sunrise-time');
    const sunsetTimeEl = document.getElementById('sunset-time');
    
    const humidityValueEl = document.getElementById('humidity-value');
    const humidityDescEl = document.getElementById('humidity-desc');
    
    const pressureValueEl = document.getElementById('pressure-value');
    const visibilityValueEl = document.getElementById('visibility-value');
    
    // 사이드바 즐겨찾기 목록 컨테이너
    const favoritesContainer = document.getElementById('favorites-container');
    const favCountEl = document.getElementById('fav-count');
    
    // 설정 모달 요소
    const settingsModal = document.getElementById('settings-modal');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
    const apiStatusMessage = document.getElementById('api-status-message');
    
    const currentLocationBtn = document.getElementById('current-location-btn');

    // 3. 앱 초기화
    function init() {
        // 차트 초기화
        window.weatherChartManager.initChart('hourly-forecast-chart');
        
        // 즐겨찾기 목록 렌더링
        renderFavoritesList();
        
        // 초기 도시 날씨 가져오기
        fetchWeather(currentCity);

        // 이벤트 바인딩
        bindEvents();
    }

    // 4. 이벤트 바인딩
    function bindEvents() {
        // 검색 실행
        searchBtn.addEventListener('click', () => executeSearch());
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeSearch();
        });

        // 빠른 도시 선택
        document.querySelectorAll('.quick-city-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const city = btn.dataset.city;
                fetchWeather(city);
            });
        });

        // 즐겨찾기 토글
        toggleFavoriteBtn.addEventListener('click', () => toggleFavoriteCurrentCity());

        // 섭씨/화씨 토글
        unitToggle.addEventListener('change', (e) => {
            isFahrenheit = e.target.checked;
            updateWeatherUI();
            window.weatherChartManager.updateChart(weatherData.hourly, chartTabType, isFahrenheit);
        });

        // 차트 탭 전환
        document.querySelectorAll('.chart-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                chartTabType = btn.dataset.type;
                window.weatherChartManager.updateChart(weatherData.hourly, chartTabType, isFahrenheit);
            });
        });

        // 설정 모달 제어
        openSettingsBtn.addEventListener('click', () => {
            apiKeyInput.value = apiKey;
            settingsModal.classList.add('active');
            apiStatusMessage.innerHTML = '';
        });

        const closeModal = () => settingsModal.classList.remove('active');
        closeSettingsBtn.addEventListener('click', closeModal);
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeModal();
        });

        // 설정 저장
        saveSettingsBtn.addEventListener('click', () => {
            const inputKey = apiKeyInput.value.strip ? apiKeyInput.value.strip() : apiKeyInput.value.trim();
            apiKey = inputKey;
            localStorage.setItem('owm_api_key', apiKey);
            
            apiStatusMessage.innerHTML = `<span style="color: var(--color-good);">API 키가 임시 저장되었습니다. 날씨를 다시 불러옵니다.</span>`;
            setTimeout(() => {
                closeModal();
                fetchWeather(currentCity);
            }, 1000);
        });

        // 설정 키 제거
        clearApiKeyBtn.addEventListener('click', () => {
            apiKey = '';
            apiKeyInput.value = '';
            localStorage.removeItem('owm_api_key');
            apiStatusMessage.innerHTML = `<span style="color: var(--color-warning);">API 키가 제거되었습니다. 시뮬레이션 모드로 작동합니다.</span>`;
            setTimeout(() => {
                closeModal();
                fetchWeather(currentCity);
            }, 1000);
        });

        // 현재 위치 날씨 조회
        currentLocationBtn.addEventListener('click', () => fetchCurrentLocationWeather());
    }

    // 5. 날씨 검색 및 통신
    function executeSearch() {
        const query = cityInput.value.trim();
        if (query) {
            fetchWeather(query);
            cityInput.value = '';
        }
    }

    async function fetchWeather(city) {
        try {
            // 로딩 애니메이션 등 시각 효과 추가 가능
            currentCityNameEl.textContent = '불러오는 중...';
            
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&apiKey=${encodeURIComponent(apiKey)}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            weatherData = await response.json();
            currentCity = weatherData.city;
            
            updateWeatherUI();
            
            // 차트 갱신
            window.weatherChartManager.updateChart(weatherData.hourly, chartTabType, isFahrenheit);
            
            // 즐겨찾기 상태 갱신
            updateFavoriteBtnState();
            
        } catch (error) {
            console.error('Fetch error:', error);
            currentCityNameEl.textContent = '조회 실패';
            alert('날씨 데이터를 가져오는 중 오류가 발생했습니다. 도시 이름을 확인해 주세요.');
        }
    }

    // 6. UI 업데이트 및 글래스모피즘 클래스 적용
    function updateWeatherUI() {
        if (!weatherData) return;

        const curr = weatherData.current;
        
        // 섭씨/화씨 변환
        const displayTemp = (celsius) => {
            const val = isFahrenheit ? (celsius * 9/5) + 32 : celsius;
            return Math.round(val);
        };

        // 1. 헤더 영역 정보 갱신
        currentCityNameEl.textContent = weatherData.city;
        
        // 현지 일자 시간 포맷팅
        const dateObj = new Date(curr.dt * 1000);
        const formattedTime = dateObj.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        localTimeEl.textContent = `${formattedTime} ${weatherData.is_simulated ? '(시뮬레이션)' : '(실시간)'}`;

        // 2. 배경 그라데이션 동적 변환
        // 낮/밤 구분
        const isDay = curr.dt >= curr.sunrise && curr.dt <= curr.sunset;
        let bodyClass = `weather-${curr.condition.toLowerCase()}`;
        
        if (curr.condition === 'Clear') {
            bodyClass = isDay ? 'weather-clear-day' : 'weather-clear-night';
        }
        
        // body 클래스 초기화 후 대입
        document.body.className = '';
        document.body.classList.add(bodyClass);

        // 3. 메인 온도 정보 갱신
        currentTempEl.textContent = displayTemp(curr.temp);
        currentConditionTextEl.textContent = curr.condition_label;
        
        // 메인 날씨 아이콘 변경
        let mainIcon = curr.icon;
        if (curr.condition === 'Clear' && !isDay) {
            mainIcon = 'moon'; // 밤이면 달 아이콘으로 변경
        }
        mainWeatherIconContainer.innerHTML = `<i data-lucide="${mainIcon}" class="weather-icon-anim" style="width:64px; height:64px;"></i>`;
        
        feelsLikeTempEl.textContent = `${displayTemp(curr.feels_like)}°`;
        minTempEl.textContent = `${displayTemp(curr.temp_min)}°`;
        maxTempEl.textContent = `${displayTemp(curr.temp_max)}°`;

        // 4. 7일 예보 목록 생성
        weeklyForecastContainer.innerHTML = '';
        weatherData.daily.forEach(day => {
            const item = document.createElement('div');
            item.className = 'weekly-item';
            item.innerHTML = `
                <div class="weekly-day">
                    <span class="day-title">${day.day_name}요일</span>
                    <span class="day-date">${day.date.substring(5)}</span>
                </div>
                <div class="weekly-status">
                    <i data-lucide="${day.icon}" title="${day.condition_label}"></i>
                </div>
                <div class="weekly-rain">
                    ${day.rain_prob > 0 ? `<span style="display:flex; align-items:center; gap:2px; justify-content:center;"><i data-lucide="droplets" style="width:11px; height:11px;"></i>${day.rain_prob}%</span>` : ''}
                </div>
                <div class="weekly-temp">
                    <span class="temp-max-val">${displayTemp(day.temp_max)}°</span>
                    <span class="temp-min-val">${displayTemp(day.temp_min)}°</span>
                </div>
            `;
            weeklyForecastContainer.appendChild(item);
        });

        // 5. 상세 메트릭 카드 갱신
        // 미세먼지(AQI)
        aqiValueEl.textContent = curr.aqi;
        aqiStatusEl.textContent = curr.aqi_label;
        aqiStatusEl.className = 'metric-status-badge';
        
        let aqiPercent = Math.min(100, (curr.aqi / 150) * 100);
        aqiProgressEl.style.width = `${aqiPercent}%`;
        if (curr.aqi_level === 1) {
            aqiStatusEl.classList.add('aqi-badge-good');
        } else if (curr.aqi_level === 2) {
            aqiStatusEl.classList.add('aqi-badge-warn');
        } else {
            aqiStatusEl.classList.add('aqi-badge-bad');
        }

        // 바람 정보
        windSpeedEl.innerHTML = `${curr.wind_speed} <span class="sub-unit">m/s</span>`;
        windDirTextEl.textContent = getWindDirectionText(curr.wind_deg);
        windCompassArrow.style.transform = `rotate(${curr.wind_deg}deg)`;

        // 자외선 지수 (UV)
        uvValueEl.textContent = curr.uv_index;
        uvStatusEl.textContent = curr.uv_index <= 2 ? '낮음' : curr.uv_index <= 5 ? '보통' : curr.uv_index <= 7 ? '높음' : '매우높음';
        uvStatusEl.className = 'metric-status-badge';
        
        if (curr.uv_index <= 5) {
            uvStatusEl.classList.add('uv-badge-normal');
        } else {
            uvStatusEl.classList.add('uv-badge-high');
        }
        uvIndicatorEl.style.left = `${Math.min(100, (curr.uv_index / 10) * 100)}%`;

        // 일출 & 일몰
        sunriseTimeEl.textContent = formatUnixTime(curr.sunrise);
        sunsetTimeEl.textContent = formatUnixTime(curr.sunset);

        // 습도
        humidityValueEl.innerHTML = `${curr.humidity}<span class="sub-unit">%</span>`;
        if (curr.humidity < 40) {
            humidityDescEl.textContent = '대기가 건조합니다.';
        } else if (curr.humidity <= 60) {
            humidityDescEl.textContent = '활동하기 좋은 습도입니다.';
        } else {
            humidityDescEl.textContent = '대기가 다소 다습합니다.';
        }

        // 기압 & 시정
        pressureValueEl.textContent = `${curr.pressure} hPa`;
        visibilityValueEl.textContent = `${(curr.visibility / 1000).toFixed(1)} km`;

        // Lucide 아이콘 새로 그리기
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            console.warn('Lucide icons library is not loaded.');
        }
    }

    // 7. 즐겨찾기 관리
    function renderFavoritesList() {
        favoritesContainer.innerHTML = '';
        favCountEl.textContent = favorites.length;

        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<p class="empty-text">즐겨찾는 도시가 없습니다.</p>';
            return;
        }

        favorites.forEach(city => {
            const btn = document.createElement('button');
            btn.className = 'favorite-item-btn';
            btn.innerHTML = `
                <div class="fav-city-info">
                    <span class="fav-name">${city}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <i data-lucide="chevron-right" style="width:16px; height:16px;"></i>
                </div>
            `;
            btn.addEventListener('click', () => fetchWeather(city));
            favoritesContainer.appendChild(btn);
        });
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            console.warn('Lucide icons library is not loaded.');
        }
    }

    function toggleFavoriteCurrentCity() {
        const index = favorites.findIndex(c => c.toLowerCase() === currentCity.toLowerCase());
        
        if (index > -1) {
            // 이미 존재하면 삭제
            favorites.splice(index, 1);
        } else {
            // 존재하지 않으면 추가
            favorites.push(currentCity);
        }

        localStorage.setItem('fav_cities', JSON.stringify(favorites));
        renderFavoritesList();
        updateFavoriteBtnState();
    }

    function updateFavoriteBtnState() {
        const isFav = favorites.some(c => c.toLowerCase() === currentCity.toLowerCase());
        if (isFav) {
            toggleFavoriteBtn.classList.add('active');
        } else {
            toggleFavoriteBtn.classList.remove('active');
        }
    }

    // 8. 현재 위치 날씨 기능 (위치 정보)
    function fetchCurrentLocationWeather() {
        if (!navigator.geolocation) {
            alert('이 브라우저는 위치 정보를 제공하지 않습니다.');
            return;
        }

        currentCityNameEl.textContent = '위치 검색 중...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                try {
                    // OpenStreetMap Nominatim API 무료 역지오코딩 시도
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ko`);
                    const geoData = await geoRes.json();
                    
                    // 도시 혹은 구 이름을 추출
                    const city = geoData.address.city || geoData.address.town || geoData.address.borough || geoData.address.suburb || 'My Location';
                    fetchWeather(city);
                } catch (e) {
                    console.error('Reverse Geocoding failed:', e);
                    // 실패할 경우 임의의 이름으로 날씨 조회
                    fetchWeather('Seoul');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('위치 정보를 가져올 수 없습니다. 권한 설정을 확인하세요.');
                fetchWeather(currentCity);
            }
        );
    }

    // 9. 유틸리티 함수
    function getWindDirectionText(deg) {
        const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
        const index = Math.round(deg / 45) % 8;
        return `${directions[index]}풍`;
    }

    function formatUnixTime(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // 실행 시작!
    init();
});
