/**
 * VibePlan AI - Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM 요소 취득
    const vibeInput = document.getElementById('vibe-input');
    const recommendBtn = document.getElementById('recommend-btn');
    const platformSelect = document.getElementById('platform-select');
    const audienceInput = document.getElementById('audience-input');
    const apiKeyInput = document.getElementById('api-key-input');
    const modelSelect = document.getElementById('model-select');
    const customModelGroup = document.getElementById('custom-model-group');
    const customModelInput = document.getElementById('custom-model-input');

    const welcomeView = document.getElementById('welcome-view');
    const recommendView = document.getElementById('recommend-view');
    const recommendationsContainer = document.getElementById('recommendations-container');
    const plannerWorkspace = document.getElementById('planner-workspace');

    const activeProjectTitle = document.getElementById('active-project-title');
    const activeProjectSummary = document.getElementById('active-project-summary');
    const exportMarkdownBtn = document.getElementById('export-markdown-btn');
    const resetBtn = document.getElementById('reset-btn');

    const vibeCheckContent = document.getElementById('vibe-check-content');
    const blueprintContent = document.getElementById('blueprint-content');
    const userFlowContent = document.getElementById('user-flow-content');
    const promptGuideContainer = document.getElementById('prompt-guide-container');

    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingStatus = document.getElementById('loading-status');

    // 전역 상태 저장용
    let generatedData = null;
    let selectedProject = { title: '', summary: '' };

    // 2. 초기 세팅 및 로컬 스토리지 복원
    lucide.createIcons();
    restoreSettings();

    // 모델 변경 감지
    modelSelect.addEventListener('change', () => {
        if (modelSelect.value === 'custom') {
            customModelGroup.style.display = 'block';
        } else {
            customModelGroup.style.display = 'none';
        }
        saveSettings();
    });

    [apiKeyInput, customModelInput].forEach(el => {
        el.addEventListener('input', saveSettings);
    });

    // 3. 아이디어 추천받기 버튼 클릭
    recommendBtn.addEventListener('click', async () => {
        const keyword = vibeInput.value.trim();
        if (!keyword) {
            alert('아이디어나 키워드를 입력해 주세요!');
            vibeInput.focus();
            return;
        }

        const apiKey = apiKeyInput.value.trim();
        const model = getSelectedModel();

        showLoading('Gemini 3.5에게 아이디어를 분석하여 추천 카드를 제작하는 중...');

        try {
            const url = `/api/recommend?keyword=${encodeURIComponent(keyword)}&apiKey=${encodeURIComponent(apiKey)}&model=${encodeURIComponent(model)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('서버 응답 오류가 발생했습니다.');
            }
            const data = await response.json();
            renderRecommendations(data.ideas || []);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            alert(`추천 과정 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            hideLoading();
        }
    });

    // 4. 추천 아이디어 렌더링
    function renderRecommendations(ideas) {
        recommendationsContainer.innerHTML = '';
        
        if (ideas.length === 0) {
            recommendationsContainer.innerHTML = '<p class="error-text">추천된 아이디어가 없습니다. 다른 키워드로 입력해 보세요.</p>';
        } else {
            ideas.forEach(idea => {
                const card = document.createElement('div');
                card.className = 'recommend-card glow-on-hover';
                card.innerHTML = `
                    <div class="card-emoji">${idea.emoji || '💡'}</div>
                    <h3 class="card-title">${idea.title}</h3>
                    <p class="card-summary">${idea.summary}</p>
                    <button class="select-concept-btn">
                        <span>선택 및 상세 설계서 생성</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                `;
                
                // 카드 클릭 이벤트 (버튼 클릭 동일 처리)
                card.querySelector('.select-concept-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    generateSpecs(idea.title, idea.summary);
                });
                card.addEventListener('click', () => {
                    generateSpecs(idea.title, idea.summary);
                });

                recommendationsContainer.appendChild(card);
            });
            lucide.createIcons({
                attrs: {
                    class: 'card-icon'
                },
                nameAttr: 'data-lucide',
                nodeList: recommendationsContainer.querySelectorAll('[data-lucide]')
            });
        }

        // 뷰 전환
        welcomeView.style.display = 'none';
        plannerWorkspace.style.display = 'none';
        recommendView.style.display = 'block';
    }

    // 5. 핵심 사용자 동선 및 API 연동
    async function generateSpecs(title, summary) {
        selectedProject = { title, summary };
        const apiKey = apiKeyInput.value.trim();
        const model = getSelectedModel();
        const platform = platformSelect.value;
        const audience = audienceInput.value.trim() || '일반 사용자';

        showLoading(
            `"${title}" 상세 기획서 생성 중...`,
            '제미나이 3.5 아키텍트가 DB 스키마, 화면 설계 및 개발 프롬프트를 빌드하고 있습니다.'
        );

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    summary,
                    platform,
                    audience,
                    apiKey,
                    model
                })
            });

            if (!response.ok) {
                throw new Error('설계서 생성 중 서버 에러가 발생했습니다.');
            }

            generatedData = await response.json();
            displaySpecs(generatedData);
        } catch (error) {
            console.error('Error generating specifications:', error);
            alert(`설계서 생성 실패: ${error.message}`);
        } finally {
            hideLoading();
        }
    }

    // 6. 생성된 설계서 화면 렌더링
    function displaySpecs(data) {
        // 프로젝트 타이틀 표시
        activeProjectTitle.textContent = selectedProject.title;
        activeProjectSummary.textContent = selectedProject.summary;

        // 마크다운 파싱 및 주입 (marked.js 사용)
        vibeCheckContent.innerHTML = marked.parse(data.vibe_check || '');
        blueprintContent.innerHTML = marked.parse(data.blueprint || '');
        userFlowContent.innerHTML = marked.parse(data.user_flow || '');

        // 4장 AI 개발 프롬프트 리스트 빌드
        promptGuideContainer.innerHTML = '';
        const prompts = data.prompt_guide || [];
        
        prompts.forEach((stepItem, index) => {
            const stepCard = document.createElement('div');
            stepCard.className = 'prompt-card';
            stepCard.innerHTML = `
                <div class="prompt-card-header">
                    <span class="step-badge">${stepItem.step || `${index + 1}단계`}</span>
                    <button class="copy-prompt-btn">
                        <i data-lucide="copy"></i>
                        <span>프롬프트 복사</span>
                    </button>
                </div>
                <div class="prompt-body">
                    <pre><code>${escapeHtml(stepItem.prompt)}</code></pre>
                </div>
            `;

            // 복사 버튼 기능 구현
            stepCard.querySelector('.copy-prompt-btn').addEventListener('click', function() {
                copyTextToClipboard(stepItem.prompt, this);
            });

            promptGuideContainer.appendChild(stepCard);
        });

        // 아이콘 리프레시
        lucide.createIcons({
            nodeList: promptGuideContainer.querySelectorAll('[data-lucide]')
        });

        // 첫 번째 탭으로 초기화 활성화
        switchTab('vibe-check');

        // 뷰 전환
        recommendView.style.display = 'none';
        plannerWorkspace.style.display = 'block';
    }

    // 7. 탭 전환 기능 구현
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    function switchTab(tabId) {
        // 모든 탭 활성 비활성화
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const activeContent = document.getElementById(`${tabId}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // 8. 마크다운으로 설계서 내역 전체 내려받기
    exportMarkdownBtn.addEventListener('click', () => {
        if (!generatedData) return;

        let fullMarkdown = `# 📋 VibePlan AI 설계 명세서 - ${selectedProject.title}\n\n`;
        fullMarkdown += `**서비스 요약**: ${selectedProject.summary}\n`;
        fullMarkdown += `**플랫폼**: ${platformSelect.value}\n`;
        fullMarkdown += `**타겟 타겟**: ${audienceInput.value || '일반 사용자'}\n\n`;
        fullMarkdown += `*본 문서는 VibePlan AI에 의해 생성된 마크다운 설계서 세트입니다.*\n\n---\n\n`;
        
        fullMarkdown += `${generatedData.vibe_check}\n\n---\n\n`;
        fullMarkdown += `${generatedData.blueprint}\n\n---\n\n`;
        fullMarkdown += `${generatedData.user_flow}\n\n---\n\n`;
        
        fullMarkdown += `# 🤖 AI 개발 지시서 프롬프트 가이드\n\n`;
        generatedData.prompt_guide.forEach(p => {
            fullMarkdown += `## ${p.step}\n\n\`\`\`text\n${p.prompt}\n\`\`\`\n\n`;
        });

        const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `VibePlan_${selectedProject.title.replace(/\s+/g, '_')}_설계서.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 9. 리셋 및 초기화
    resetBtn.addEventListener('click', () => {
        if (confirm('현재 작업 중인 기획서를 초기화하고 처음으로 돌아가겠습니까?')) {
            vibeInput.value = '';
            generatedData = null;
            selectedProject = { title: '', summary: '' };
            plannerWorkspace.style.display = 'none';
            recommendView.style.display = 'none';
            welcomeView.style.display = 'block';
        }
    });

    // 10. 유틸리티 함수
    function getSelectedModel() {
        const selected = modelSelect.value;
        if (selected === 'custom') {
            return customModelInput.value.trim() || 'gemini-3.5-flash';
        }
        return selected;
    }

    function showLoading(statusText, subText = '구글 클라우드와 제미나이의 실시간 처리를 수신하고 있습니다.') {
        loadingStatus.textContent = statusText;
        loadingOverlay.querySelector('.loading-sub').textContent = subText;
        loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('active');
    }

    function saveSettings() {
        localStorage.setItem('vibeplan_api_key', apiKeyInput.value.trim());
        localStorage.setItem('vibeplan_model', modelSelect.value);
        localStorage.setItem('vibeplan_custom_model', customModelInput.value.trim());
    }

    function restoreSettings() {
        const savedKey = localStorage.getItem('vibeplan_api_key');
        if (savedKey) apiKeyInput.value = savedKey;

        const savedModel = localStorage.getItem('vibeplan_model');
        if (savedModel) {
            modelSelect.value = savedModel;
            if (savedModel === 'custom') {
                customModelGroup.style.display = 'block';
            }
        }

        const savedCustomModel = localStorage.getItem('vibeplan_custom_model');
        if (savedCustomModel) customModelInput.value = savedCustomModel;
    }

    function copyTextToClipboard(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const span = btnElement.querySelector('span');
            const icon = btnElement.querySelector('i');
            
            const originText = span.textContent;
            
            span.textContent = '복사 완료!';
            btnElement.classList.add('copied');
            
            if (icon) {
                icon.setAttribute('data-lucide', 'check');
                lucide.createIcons({ nodeList: [icon] });
            }

            setTimeout(() => {
                span.textContent = originText;
                btnElement.classList.remove('copied');
                if (icon) {
                    icon.setAttribute('data-lucide', 'copy');
                    lucide.createIcons({ nodeList: [icon] });
                }
            }, 2000);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            alert('복사에 실패했습니다. 텍스트를 드래그해서 직접 복사해 주세요.');
        });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
