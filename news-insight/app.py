from flask import Flask, jsonify, render_template
from flask_cors import CORS
import os
import requests
import xml.etree.ElementTree as ET
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Google News RSS Parser Helper
def fetch_google_news(keyword):
    # RSS URL for Korean news matching the keyword
    url = f"https://news.google.com/rss/search?q={keyword}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return []
        
        root = ET.fromstring(response.content)
        articles = []
        # Get top 3 items
        for item in root.findall('.//item')[:3]:
            title = item.find('title').text if item.find('title') is not None else "No Title"
            link = item.find('link').text if item.find('link') is not None else "#"
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
            
            # Clean source from title (usually at the end like "- SourceName")
            clean_title = title
            if " - " in title:
                clean_title = " - ".join(title.split(" - ")[:-1])
            
            articles.append({
                "title": clean_title,
                "link": link,
                "date": pub_date
            })
        return articles
    except Exception as e:
        print(f"Error fetching news for {keyword}: {e}")
        return []

# Simple prompt builder to simulate LLM logic / Static insights based on current 2026 data
INSIGHTS = {
    "economy": {
        "summary": "원/달러 환율이 1,470원대에 머무는 고환율 국면이 고착화되고 있으며, 물가 상승률은 2% 중후반대로 소비 위축이 이어지는 스태그플레이션 우려가 상존합니다. 수출 호조에 따른 낙수효과를 선별적으로 관망해야 할 때입니다.",
        "keyword": "경제"
    },
    "estate": {
        "summary": "서울 강남권 및 반도체 배후 주거 벨트(동탄, 판교, 분당 등)의 신고가 갱신과 외곽 하락세가 맞물린 극단적 '양극화' 양상입니다. 실거주 의무 완화 조치를 주시하며 선별적 접근이 요구됩니다.",
        "keyword": "부동산"
    },
    "stock": {
        "summary": "코스피의 양호한 지수 흐름 뒤에 대형 반도체주 중심의 강한 쏠림이 가려진 'K자 양극화' 장세입니다. 무조건적인 추격 매수보다는 로봇, AI 하드웨어 장비주 등으로 분산하는 순환매 전략이 유효합니다.",
        "keyword": "주식"
    },
    "coin": {
        "summary": "비트코인은 7만 달러 중후반대 박스권에서 이란 휴전 협상 등 거시 경제 및 전쟁 이벤트 변동성에 노출되어 있습니다. 이더리움 기반 RWA(실물자산 토큰화) 성장을 보며 알트코인 선별이 중요합니다.",
        "keyword": "코인"
    }
}

@app.route('/api/insights', methods=['GET'])
def get_insights():
    results = {}
    for category, info in INSIGHTS.items():
        articles = fetch_google_news(info["keyword"])
        results[category] = {
            "insight": info["summary"],
            "articles": articles
        }
    return jsonify(results), 200

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
