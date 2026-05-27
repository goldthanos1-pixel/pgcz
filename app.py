from flask import Flask, render_template, request, jsonify
import requests
import datetime
import math
import random

app = Flask(__name__)

# 각 도시별 기초 날씨 기후 설정 (시뮬레이션용)
CITY_CLIMATES = {
    "seoul": {"lat": 37.5665, "lon": 126.9780, "name": "서울", "base_temp": 22.0, "humidity": 60, "wind_speed": 2.5, "condition_weights": ["Clear", "Cloudy", "Rain", "Mist"]},
    "tokyo": {"lat": 35.6762, "lon": 139.6503, "name": "도쿄", "base_temp": 21.0, "humidity": 65, "wind_speed": 3.0, "condition_weights": ["Clear", "Cloudy", "Rain", "Mist"]},
    "new york": {"lat": 40.7128, "lon": -74.0060, "name": "뉴욕", "base_temp": 18.0, "humidity": 55, "wind_speed": 4.5, "condition_weights": ["Clear", "Cloudy", "Rain", "Windy"]},
    "london": {"lat": 51.5074, "lon": -0.1278, "name": "런던", "base_temp": 14.0, "humidity": 80, "wind_speed": 4.0, "condition_weights": ["Cloudy", "Rain", "Mist", "Clear"]},
    "paris": {"lat": 48.8566, "lon": 2.3522, "name": "파리", "base_temp": 16.0, "humidity": 70, "wind_speed": 3.5, "condition_weights": ["Clear", "Cloudy", "Rain", "Mist"]},
    "sydney": {"lat": -33.8688, "lon": 151.2093, "name": "시드니", "base_temp": 17.0, "humidity": 60, "wind_speed": 5.0, "condition_weights": ["Clear", "Cloudy", "Windy", "Rain"]}
}

CONDITION_LABELS = {
    "Clear": {"label": "맑음", "icon": "sun"},
    "Cloudy": {"label": "흐림", "icon": "cloud"},
    "Rain": {"label": "비", "icon": "cloud-rain"},
    "Snow": {"label": "눈", "icon": "snowflake"},
    "Mist": {"label": "안개", "icon": "cloud-drizzle"},
    "Windy": {"label": "바람", "icon": "wind"},
    "Thunderstorm": {"label": "뇌우", "icon": "cloud-lightning"}
}

def get_simulated_weather(city_name, target_date=None):
    """
    도시 이름과 날짜를 기준으로 항상 결정론적(Deterministic)이면서도 
    시간에 따라 변화하는 풍부한 날씨 데이터를 생성합니다.
    """
    city_key = city_name.strip().lower()
    climate = CITY_CLIMATES.get(city_key)
    
    # 알 수 없는 도시인 경우 해시값을 이용해 임의의 기후 생성
    if not climate:
        hash_val = sum(ord(c) for c in city_key)
        random.seed(hash_val)
        climate = {
            "lat": round(random.uniform(-60, 60), 4),
            "lon": round(random.uniform(-180, 180), 4),
            "name": city_name.title(),
            "base_temp": round(random.uniform(5, 30), 1),
            "humidity": random.randint(40, 90),
            "wind_speed": round(random.uniform(1.0, 8.0), 1),
            "condition_weights": ["Clear", "Cloudy", "Rain", "Mist"]
        }
    
    now = target_date or datetime.datetime.now()
    day_seed = now.year * 10000 + now.month * 100 + now.day
    # 도시 해시와 날짜 시드를 조합하여 일별 날씨 상태 고정
    random.seed(day_seed + sum(ord(c) for c in city_key))
    
    # 오늘의 메인 날씨 상태 결정
    primary_condition = random.choice(climate["condition_weights"])
    
    # 시간별 데이터 생성 (24시간)
    hourly_data = []
    base_t = climate["base_temp"]
    
    # 날씨 상태에 따른 온도 보정 (비/안개가 끼면 온도가 낮아짐)
    temp_modifier = 0
    if primary_condition == "Rain":
        temp_modifier = -3.0
    elif primary_condition == "Mist":
        temp_modifier = -1.5
    elif primary_condition == "Clear":
        temp_modifier = 2.0

    current_hour = now.hour
    
    for h in range(24):
        # 일주기 온도 변화 시뮬레이션 (오후 3시에 최고 기온, 오전 5시에 최저 기온)
        # Sine wave 활용: 24시간 주기로 -1에서 1까지 진동
        diurnal_factor = math.sin((h - 9) / 24.0 * 2.0 * math.pi)
        h_temp = base_t + temp_modifier + (diurnal_factor * 5.0) + random.uniform(-0.5, 0.5)
        
        # 시간별 강수 확률 설정
        h_rain_prob = 0
        h_cond = "Clear"
        if primary_condition == "Rain":
            h_rain_prob = random.randint(60, 95)
            h_cond = "Rain" if random.random() > 0.2 else "Cloudy"
        elif primary_condition == "Cloudy":
            h_rain_prob = random.randint(10, 40)
            h_cond = "Cloudy" if random.random() > 0.3 else "Clear"
        elif primary_condition == "Mist":
            h_rain_prob = random.randint(5, 20)
            h_cond = "Mist" if h < 10 or h > 18 else "Cloudy"
        else:
            h_rain_prob = random.randint(0, 10)
            h_cond = "Clear" if random.random() > 0.1 else "Cloudy"
            
        hourly_data.append({
            "hour": h,
            "temp": round(h_temp, 1),
            "condition": h_cond,
            "condition_label": CONDITION_LABELS[h_cond]["label"],
            "icon": CONDITION_LABELS[h_cond]["icon"],
            "rain_prob": h_rain_prob
        })

    # 현재 온도 및 상세 메트릭 정의
    current_temp = hourly_data[current_hour]["temp"]
    current_condition = hourly_data[current_hour]["condition"]
    
    # 미세먼지(AQI) 및 자외선(UV Index) 시뮬레이션
    uv_index = max(0.0, round((math.sin((current_hour - 6) / 12.0 * math.pi) if 6 <= current_hour <= 18 else 0) * 8.5 + random.uniform(-0.5, 0.5), 1))
    
    aqi_value = random.randint(15, 120)
    if aqi_value <= 50:
        aqi_label = "좋음"
        aqi_level = 1
    elif aqi_value <= 100:
        aqi_label = "보통"
        aqi_level = 2
    else:
        aqi_label = "나쁨"
        aqi_level = 3

    # 일출 / 일몰 시간 (유닉스 타임스탬프)
    today_start = datetime.datetime(now.year, now.month, now.day)
    sunrise_time = int((today_start + datetime.timedelta(hours=6, minutes=12)).timestamp())
    sunset_time = int((today_start + datetime.timedelta(hours=18, minutes=45)).timestamp())

    current_weather = {
        "temp": current_temp,
        "feels_like": round(current_temp + random.uniform(-1.0, 1.0) - (0.1 * (climate["humidity"] - 50)), 1),
        "temp_min": min(h["temp"] for h in hourly_data),
        "temp_max": max(h["temp"] for h in hourly_data),
        "condition": current_condition,
        "condition_label": CONDITION_LABELS[current_condition]["label"],
        "icon": CONDITION_LABELS[current_condition]["icon"],
        "humidity": climate["humidity"] + random.randint(-5, 5),
        "wind_speed": round(climate["wind_speed"] + random.uniform(-1.0, 1.5), 1),
        "wind_deg": random.randint(0, 360),
        "pressure": 1013 + random.randint(-8, 8),
        "visibility": 10000 if current_condition != "Mist" else 3000,
        "uv_index": uv_index,
        "aqi": aqi_value,
        "aqi_label": aqi_label,
        "aqi_level": aqi_level,
        "sunrise": sunrise_time,
        "sunset": sunset_time,
        "dt": int(now.timestamp())
    }

    # 7일 예보 데이터 생성 (오늘 포함 7일)
    daily_data = []
    for d in range(7):
        date_offset = now + datetime.timedelta(days=d)
        offset_seed = date_offset.year * 10000 + date_offset.month * 100 + date_offset.day
        random.seed(offset_seed + sum(ord(c) for c in city_key))
        
        day_cond = random.choice(climate["condition_weights"])
        day_base = climate["base_temp"] + random.uniform(-2.0, 2.0)
        
        d_min = day_base - random.uniform(3.0, 6.0)
        d_max = day_base + random.uniform(3.0, 6.0)
        d_rain_prob = random.randint(60, 95) if day_cond == "Rain" else random.randint(0, 30)

        daily_data.append({
            "date": date_offset.strftime("%Y-%m-%d"),
            "day_name": ["월", "화", "수", "목", "금", "토", "일"][date_offset.weekday()],
            "temp_min": round(d_min, 1),
            "temp_max": round(d_max, 1),
            "condition": day_cond,
            "condition_label": CONDITION_LABELS[day_cond]["label"],
            "icon": CONDITION_LABELS[day_cond]["icon"],
            "rain_prob": d_rain_prob
        })

    return {
        "city": climate["name"],
        "lat": climate["lat"],
        "lon": climate["lon"],
        "timezone_offset": 32400, # 기본 +9시간 (한국/일본)
        "current": current_weather,
        "hourly": hourly_data,
        "daily": daily_data,
        "is_simulated": True
    }

def get_real_weather(city_name, api_key):
    """
    OpenWeatherMap API를 사용하여 실시간 날씨 데이터 및 예보 데이터를 조회합니다.
    """
    try:
        # 1. 지오코딩으로 위경도 검색
        geo_url = f"https://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={api_key}"
        geo_res = requests.get(geo_url, timeout=5)
        geo_data = geo_res.json()
        
        if not geo_data:
            return None
        
        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        display_name = geo_data[0].get("local_names", {}).get("ko", geo_data[0]["name"])

        # 2. 현재 날씨 정보 가져오기
        curr_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=kr"
        curr_res = requests.get(curr_url, timeout=5)
        curr_data = curr_res.json()

        # 3. 5일/3시간 단위 예보 정보 가져오기
        fore_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=kr"
        fore_res = requests.get(fore_url, timeout=5)
        fore_data = fore_res.json()

        # 4. 미세먼지(AQI) 정보 가져오기
        aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
        aqi_res = requests.get(aqi_url, timeout=5)
        aqi_data = aqi_res.json() if aqi_res.status_code == 200 else None

        # OWM 날씨 상태 코드를 대시보드 아이콘 형태로 맵핑
        def map_condition(owm_id):
            if 200 <= owm_id < 300: return "Thunderstorm"
            if 300 <= owm_id < 400: return "Mist"
            if 500 <= owm_id < 600: return "Rain"
            if 600 <= owm_id < 700: return "Snow"
            if 701 <= owm_id < 800: return "Mist"
            if owm_id == 800: return "Clear"
            return "Cloudy"

        main_cond = map_condition(curr_data["weather"][0]["id"])
        
        # 미세먼지 정보 추출
        aqi_value = 0
        aqi_level = 1
        aqi_label = "좋음"
        if aqi_data and "list" in aqi_data and len(aqi_data["list"]) > 0:
            # 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
            aqi_level = aqi_data["list"][0]["main"]["aqi"]
            aqi_value = int(aqi_data["list"][0]["components"]["pm2_5"]) # PM2.5 기준값 대리 활용
            labels = {1: "좋음", 2: "보통", 3: "민감군 영향", 4: "나쁨", 5: "매우 나쁨"}
            aqi_label = labels.get(aqi_level, "보통")

        current_weather = {
            "temp": round(curr_data["main"]["temp"], 1),
            "feels_like": round(curr_data["main"]["feels_like"], 1),
            "temp_min": round(curr_data["main"]["temp_min"], 1),
            "temp_max": round(curr_data["main"]["temp_max"], 1),
            "condition": main_cond,
            "condition_label": curr_data["weather"][0]["description"],
            "icon": CONDITION_LABELS[main_cond]["icon"],
            "humidity": curr_data["main"]["humidity"],
            "wind_speed": curr_data["wind"]["speed"],
            "wind_deg": curr_data["wind"].get("deg", 0),
            "pressure": curr_data["main"]["pressure"],
            "visibility": curr_data.get("visibility", 10000),
            "uv_index": 3.5, # 무료 API 2.5버전에서는 UV가 즉시 안 나올 수 있으므로 기본값 설정
            "aqi": aqi_value,
            "aqi_label": aqi_label,
            "aqi_level": aqi_level,
            "sunrise": curr_data["sys"]["sunrise"],
            "sunset": curr_data["sys"]["sunset"],
            "dt": curr_data["dt"]
        }

        # 시간대별 날씨 맵핑 (최근 8개 간격 = 24시간분량)
        hourly_data = []
        for i, item in enumerate(fore_data.get("list", [])[:8]):
            h_dt = datetime.datetime.fromtimestamp(item["dt"])
            h_cond = map_condition(item["weather"][0]["id"])
            hourly_data.append({
                "hour": h_dt.hour,
                "temp": round(item["main"]["temp"], 1),
                "condition": h_cond,
                "condition_label": item["weather"][0]["description"],
                "icon": CONDITION_LABELS[h_cond]["icon"],
                "rain_prob": int(item.get("pop", 0) * 100) # 강수확률 (0~1)
            })

        # 7일 날씨 구성 (5일치는 OWM 데이터에서 일자별 추출, 나머지는 시뮬레이션 패딩)
        daily_temp_map = {}
        for item in fore_data.get("list", []):
            d_dt = datetime.datetime.fromtimestamp(item["dt"])
            date_str = d_dt.strftime("%Y-%m-%d")
            
            if date_str not in daily_temp_map:
                daily_temp_map[date_str] = {
                    "temps": [],
                    "conditions": [],
                    "rain_probs": [],
                    "day_name": ["월", "화", "수", "목", "금", "토", "일"][d_dt.weekday()]
                }
            daily_temp_map[date_str]["temps"].append(item["main"]["temp"])
            daily_temp_map[date_str]["conditions"].append(map_condition(item["weather"][0]["id"]))
            daily_temp_map[date_str]["rain_probs"].append(item.get("pop", 0))

        daily_data = []
        for d_str, val in sorted(daily_temp_map.items())[:5]: # 5일간 실제 예보
            most_cond = max(set(val["conditions"]), key=val["conditions"].count)
            avg_rain_prob = int((sum(val["rain_probs"]) / len(val["rain_probs"])) * 100)
            daily_data.append({
                "date": d_str,
                "day_name": val["day_name"],
                "temp_min": round(min(val["temps"]), 1),
                "temp_max": round(max(val["temps"]), 1),
                "condition": most_cond,
                "condition_label": CONDITION_LABELS[most_cond]["label"],
                "icon": CONDITION_LABELS[most_cond]["icon"],
                "rain_prob": avg_rain_prob
            })

        # 부족한 2일 분량은 시뮬레이션 데이터를 활용하여 7일 완성
        last_date = datetime.datetime.strptime(daily_data[-1]["date"], "%Y-%m-%d")
        for i in range(1, 3):
            next_date = last_date + datetime.timedelta(days=i)
            # 도시별 시뮬레이션 데이터를 얻기 위해 로컬 시뮬레이션 엔진 호출 활용
            sim_day = get_simulated_weather(city_name, next_date)
            # 필요한 필드 매칭 및 복사
            pad_day = sim_day["daily"][0]
            pad_day["date"] = next_date.strftime("%Y-%m-%d")
            pad_day["day_name"] = ["월", "화", "수", "목", "금", "토", "일"][next_date.weekday()]
            daily_data.append(pad_day)

        return {
            "city": display_name,
            "lat": lat,
            "lon": lon,
            "timezone_offset": curr_data.get("timezone", 32400),
            "current": current_weather,
            "hourly": hourly_data,
            "daily": daily_data,
            "is_simulated": False
        }
    except Exception as e:
        print(f"API Fetch Error for {city_name}: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/weather')
def get_weather():
    city = request.args.get('city', 'seoul')
    api_key = request.args.get('apiKey', '').strip()
    
    if api_key:
        real_data = get_real_weather(city, api_key)
        if real_data:
            return jsonify(real_data)
        # API 조회 실패 시 폴백으로 시뮬레이션 데이터 반환
        return jsonify(get_simulated_weather(city))
    else:
        return jsonify(get_simulated_weather(city))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
