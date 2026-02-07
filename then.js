// ==UserScript==
// @name         Thiên
// @namespace    http://tampermonkey.net/
// @version      6.3.10 (Silent Auto Get)
// @description  Quản lý tài khoản Duolingo 
// @author       Thiên
// @icon         https://www.google.com/s2/favicons?sz=64&domain=duolingo.com
// @match        https://www.duolingo.com/*
// @match        https://*.duolingo.com/*
// @match        https://*.duolingo.cn/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @connect      duolingo.com
// @connect      stories.duolingo.com
// @connect      goals-api.duolingo.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = '6.3.10 (Silent Auto Get)';

    // --- CONFIG SUPER TOOL ---
    const d = new Date();
    const currentDateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const SUPER_STORAGE_LINKS = 'duo_v2_links';

    // [CẤU HÌNH] NỘI DUNG THÂN BÀI
    const SUPER_BODY_CONTENT = `if you are banned from participating, you can use the AutoDuo tool to experience Max for free.
Please take a screenshot`;


    // =========================================================================
    // SECTION: CAN THIỆP NETWORK (SUPER/MAX)
    // =========================================================================
    function injectSubscriptionInterceptor(subscriptionMode) {
        if (subscriptionMode === 'none') return;
        const script = document.createElement('script');
        script.id = 'duo-subscription-interceptor-thien';
        script.textContent = `
        (() => {
            const SUB_MODE = '${subscriptionMode}';
            const SUPER_SHOP_ITEMS = { premium_subscription: { itemName: "premium_subscription", subscriptionInfo: { vendor: "STRIPE", renewing: true, isFamilyPlan: true, expectedExpiration: 9999999999000 } } };
            const MAX_SHOP_ITEMS = { gold_subscription: { itemName: "gold_subscription", subscriptionInfo: { vendor: "STRIPE", renewing: true, isFamilyPlan: true, expectedExpiration: 9999999999000 } } };
            const USER_URL_REGEX = /https:\\/\\/www\\.duolingo\\.com\\/\\d{4}-\\d{2}-\\d{2}\\/users\\/.+/;

            function modifySubscriptionJson(jsonText) {
                try {
                    const data = JSON.parse(jsonText);
                    data.hasPlus = true;
                    if (!data.trackingProperties || typeof data.trackingProperties !== 'object') data.trackingProperties = {};
                    data.trackingProperties.has_item_gold_subscription = true;
                    if (SUB_MODE === 'super') data.shopItems = SUPER_SHOP_ITEMS;
                    else if (SUB_MODE === 'max') data.shopItems = MAX_SHOP_ITEMS;
                    return JSON.stringify(data);
                } catch (e) { return jsonText; }
            }

            const originalFetch = window.fetch;
            window.fetch = function(resource, options) {
                const url = resource instanceof Request ? resource.url : resource;
                if (SUB_MODE !== 'none' && USER_URL_REGEX.test(url)) {
                    return originalFetch.apply(this, arguments).then(async (response) => {
                        const cloned = response.clone();
                        const jsonText = await cloned.text();
                        const modified = modifySubscriptionJson(jsonText);
                        let hdrs = response.headers;
                        try { const obj = {}; response.headers.forEach((v,k)=>obj[k]=v); hdrs = obj; } catch {}
                        return new Response(modified, { status: response.status, statusText: response.statusText, headers: hdrs });
                    }).catch(err => originalFetch.apply(this, arguments));
                }
                return originalFetch.apply(this, arguments);
            };

            const originalXhrOpen = XMLHttpRequest.prototype.open;
            const originalXhrSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._interceptURL = url;
                this._method = method;
                this._isSubscriptionRequest = (SUB_MODE !== 'none' && USER_URL_REGEX.test(url));
                originalXhrOpen.call(this, method, url, ...args);
            };
            XMLHttpRequest.prototype.send = function() {
                if (this._isSubscriptionRequest) {
                    const originalOnReadyStateChange = this.onreadystatechange;
                    const xhr = this;
                    this.onreadystatechange = function() {
                        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                            try {
                                let modifiedText = xhr.responseText;
                                if (xhr._isSubscriptionRequest) modifiedText = modifySubscriptionJson(xhr.responseText);
                                Object.defineProperty(xhr, 'responseText', { writable: true, value: modifiedText });
                                Object.defineProperty(xhr, 'response', { writable: true, value: modifiedText });
                            } catch (e) {}
                        }
                        if (originalOnReadyStateChange) originalOnReadyStateChange.apply(this, arguments);
                    };
                }
                originalXhrSend.apply(this, arguments);
            };
        })();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    // =========================================================================
    // SECTION: CSS VÀ STYLES
    // =========================================================================
    function injectStyles() {
        if (document.getElementById('thien-autoduo-styles')) return;
        const styles = `
            /* --- VARIABLES & ANIMATIONS --- */
            :root {
                --thien-blue: #007AFF;
                --thien-red: #FF3B30;
                --thien-orange: #FF9500;
                --thien-teal: #5AC8FA;
                --thien-gray: #8E8E93;
                --thien-green: #34C759;
                --thien-purple: #AF52DE;
                --thien-bg-glass: rgba(255, 255, 255, 0.75);
                --thien-border: rgba(255, 255, 255, 0.4);
                --thien-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
                --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .thien-dark-mode {
                --thien-bg-glass: rgba(28, 28, 30, 0.85);
                --thien-border: rgba(255, 255, 255, 0.1);
                --thien-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            }
            @keyframes thien-slide-in { from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
            @keyframes thien-breathe { 0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.2); } 50% { transform: scale(1.08); box-shadow: 0 8px 25px rgba(88, 86, 214, 0.4); } }

            /* --- GLOBAL STYLES --- */
            .thien-panel, .thien-task-manager, .thien-popup {
                background: var(--thien-bg-glass);
                backdrop-filter: saturate(180%) blur(25px); -webkit-backdrop-filter: saturate(180%) blur(25px);
                border-radius: 24px; border: 1px solid var(--thien-border); box-shadow: var(--thien-shadow);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c1c1e;
                transition: all 0.3s ease; overflow: hidden;
            }
            .thien-feature-panel { animation: thien-slide-in 0.4s var(--ease-elastic) forwards; }
            .thien-panel-header { padding: 18px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: space-between; }
            .thien-panel-title { font-size: 20px; font-weight: 800; margin: 0; background: linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .thien-dark-mode .thien-panel-title { background: linear-gradient(135deg, #fff 0%, #a1a1a6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .thien-panel-close-btn, .thien-modal-close { background: none; border: none; font-size: 24px; color: var(--thien-gray); cursor: pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
            .thien-panel-close-btn:hover { background: rgba(0,0,0,0.1); color: var(--thien-red); }

            /* --- BUTTONS --- */
            .thien-btn { border-radius: 12px !important; font-weight: 600 !important; border: none !important; transition: transform 0.2s var(--ease-elastic), filter 0.2s ease !important; color: #fff; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 10px 15px; margin: 10px; font-size: 14px; }
            .thien-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
            .thien-btn:active { transform: scale(0.95); }
            .thien-btn-primary { background: var(--thien-blue); }
            .thien-btn-secondary { background: var(--thien-teal); }
            .thien-btn-warning { background: var(--thien-orange); }
            .thien-btn-danger { background: var(--thien-red); }
            .thien-btn-purple { background: var(--thien-purple); }

            /* --- INPUTS --- */
            .thien-input { width: 100%; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 8px 12px; font-size: 14px; color: #1c1c1e; box-sizing: border-box; }
            .thien-input:focus { background: #fff; border-color: var(--thien-blue); outline: none; }
            .thien-dark-mode .thien-input { background: rgba(0,0,0,0.3); color: #fff; border-color: rgba(255,255,255,0.1); }
            textarea.duo-input { width: 100%; height: 150px; resize: none; border-radius: 12px; padding: 10px; border: 1px solid #ccc; font-family: monospace; }

            /* --- GRID LAYOUT --- */
            .duovip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
            .duovip-card { background: rgba(255,255,255,0.4); border-radius: 16px; padding: 12px; border: 1px solid rgba(255,255,255,0.2); }
            .thien-dark-mode .duovip-card { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.05); }
            .duovip-full-width { grid-column: span 2; }
            .duovip-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--thien-gray); margin-bottom: 8px; display: block; }

            /* --- ITEMS ROW --- */
            .duovip-items-row { display: flex; gap: 8px; justify-content: space-between; }
            .duovip-item-btn { flex: 1; padding: 10px 5px !important; margin: 0 !important; font-size: 11px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
            .duovip-icon { font-size: 18px; }

            /* --- SUBSCRIPTION TOGGLE --- */
            .duovip-sub-group { display: flex; background: rgba(0,0,0,0.05); border-radius: 10px; padding: 4px; }
            .duovip-sub-option { flex: 1; text-align: center; }
            .duovip-sub-option input { display: none; }
            .duovip-sub-option label { display: block; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; color: var(--thien-gray); }
            .duovip-sub-option input:checked + label { background: #fff; color: #000; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .thien-dark-mode .duovip-sub-option input:checked + label { background: #3a3a3c; color: #fff; }

            /* --- FARM CONTROLS --- */
            .duovip-farm-row { display: flex; gap: 5px; align-items: center; margin-bottom: 8px; }
            .duovip-farm-btn { padding: 8px 12px !important; font-size: 12px; margin: 0 !important; white-space: nowrap; }

            /* --- ACCOUNT ITEM & SETTINGS --- */
            .thien-account-item { background: rgba(255,255,255,0.4); border-radius: 12px; padding: 10px; margin: 5px 0; display: flex; justify-content: space-between; align-items: center; }
            .thien-dark-mode .thien-account-item { background: rgba(255,255,255,0.05); }
            .thien-account-item.is-active { border-left: 4px solid var(--thien-green); }
            .thien-account-name { font-weight: bold; font-size: 14px; }
            .thien-settings-option { display: flex; justify-content: space-between; padding: 10px; align-items: center; }

            /* --- TASK MANAGER --- */
            .thien-task-manager { padding: 15px; border-left: 5px solid var(--thien-orange); position: fixed; bottom: 20px; right: 20px; width: 300px; z-index: 10001; }
            .thien-task-item { background: rgba(255,255,255,0.5); padding: 8px; border-radius: 8px; margin-top: 5px; display: flex; justify-content: space-between; align-items: center; }
            .thien-dark-mode .thien-task-item { background: rgba(0,0,0,0.3); }

            /* --- DARK MODE TEXT --- */
            .thien-dark-mode, .thien-dark-mode label, .thien-dark-mode span { color: #e5e5e5; }

            /* --- TOAST --- */
            #thienautoduo-toast { z-index: 999999; }
            #thien-final-toggle-button { transition: transform 0.2s var(--ease-elastic), top 0.1s, left 0.1s !important; }
            #thien-final-toggle-button:hover { transform: scale(1.15) rotate(10deg) !important; }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.id = "thien-autoduo-styles";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    }

    // =========================================================================
    // SECTION: CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS)
    // =========================================================================
    function getFormattedDate() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
        }
        return null;
    }

    function showToast(message, duration = 3000, type = 'info') {
        let toast = document.getElementById('thienautoduo-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'thienautoduo-toast';
            Object.assign(toast.style, {
                position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%) translateY(100px)',
                backgroundColor: '#333', color: 'white', padding: '15px 25px', borderRadius: '12px', zIndex: '2147483647',
                opacity: '0', transition: 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                fontSize: '15px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', maxWidth: '80%', boxSizing: 'border-box'
            });
            document.body.appendChild(toast);
        }
        if (type === 'success') toast.style.backgroundColor = '#34C759';
        else if (type === 'error') toast.style.backgroundColor = '#FF3B30';
        else toast.style.backgroundColor = '#007AFF';
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        if(duration > 0){
            setTimeout(() => {
                if (toast) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(-50%) translateY(100px)';
                }
            }, duration);
        }
        return toast;
    }

    function getCurrentUsername() {
        const userProfileLink = document.querySelector('a[href^="/profile/"]');
        if (userProfileLink && userProfileLink.href) {
            try { return userProfileLink.href.split('/profile/')[1];
            } catch (error) { return null; }
        }
        return null;
    }

    function copyToken() {
        const jwt = getCookie('jwt_token');
        if (jwt) { GM_setClipboard(jwt); showToast('Token đã được sao chép!', 3000, 'success');
        }
        else { showToast('Không tìm thấy token. Đảm bảo bạn đã đăng nhập.', 3000, 'error');
        }
    }

    function copyUsername() {
        const username = getCurrentUsername();
        if (username) {
            GM_setClipboard(username);
            showToast(`Username đã sao chép: ${username}`, 3000, 'success');
        } else { showToast('Không tìm thấy thông tin người dùng. Bạn đã đăng nhập chưa?', 3000, 'error');
        }
    }

    function autoLoginWithToken() {
        const tokenInput = prompt("Dán token vào đây để đăng nhập:");
        if (tokenInput === null) return showToast('Đã hủy.', 2000, 'info');
        const finalToken = tokenInput.trim();
        if (finalToken) {
            document.cookie = `jwt_token=${finalToken}; path=/; domain=.duolingo.com; expires=Fri, 31 Dec 9999 23:59:59 GMT; Secure; SameSite=Lax`;
            showToast('Đang đăng nhập...', 0, 'info');
            setTimeout(() => { window.location.href = 'https://www.duolingo.com/'; }, 1000);
        } else { showToast('Không có token nào được nhập.', 2000, 'error');
        }
    }

    function logoutAccount() {
        document.cookie = 'jwt_token=; Max-Age=0; path=/; domain=.duolingo.com;';
        showToast('Đã đăng xuất.', 2000, 'info');
        setTimeout(() => { window.location.href = 'https://www.duolingo.com/'; }, 1500);
    }

    function addButton(text, onClick, parent, className = '', id = null) {
        const btn = document.createElement('button');
        if(id) btn.id = id;
        btn.textContent = text;
        btn.className = `thien-btn ${className}`;
        btn.style.display = 'block';
        btn.style.width = 'calc(100% - 20px)';
        btn.onclick = onClick;
        parent.appendChild(btn);
        return btn;
    }

    function createPanel(id, title, closeBtnId, maxWidth = '420px') {
        if (document.getElementById(id)) {
            const panel = document.getElementById(id);
            const overlay = document.getElementById(`${id}-overlay`);
            const showPanel = () => { if(overlay) overlay.style.display = 'block'; if(panel) panel.style.display = 'flex'; };
            const hidePanel = () => { if(overlay) overlay.style.display = 'none'; if(panel) panel.style.display = 'none'; };
            return { panel, showPanel, hidePanel, content: document.getElementById(`${id}-content`) };
        }

        const overlayId = `${id}-overlay`;
        const panelHTML = `
            <div id="${overlayId}" style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); z-index: 10001; display: none; backdrop-filter: blur(4px);"></div>
            <div id="${id}" class="thien-panel thien-feature-panel" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: ${maxWidth}; z-index: 10002; display: none; flex-direction: column;">
                <div class="thien-panel-header">
                    <h3 class="thien-panel-title">${title}</h3>
                    <button id="${closeBtnId}" class="thien-panel-close-btn">&times;</button>
                </div>
                <div id="${id}-content" style="padding: 10px; max-height: 70vh; overflow-y: auto;"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', panelHTML);

        const panel = document.getElementById(id);
        const overlay = document.getElementById(overlayId);
        const closeBtn = document.getElementById(closeBtnId);
        const content = document.getElementById(`${id}-content`);
        const showPanel = () => { if(overlay) overlay.style.display = 'block'; if(panel) panel.style.display = 'flex'; };
        const hidePanel = () => { if(overlay) overlay.style.display = 'none'; if(panel) panel.style.display = 'none'; };

        if(closeBtn) closeBtn.addEventListener('click', hidePanel);
        if(overlay) overlay.addEventListener('click', hidePanel);
        return { panel, showPanel, hidePanel, content };
    }

    // =========================================================================
    // SECTION: SUPER MAKER INTEGRATION (AUTO ON IN SETTINGS/SUPER)
    // =========================================================================
    function createPersistentSuperPanel() {
        if (document.getElementById('thien-super-panel')) return document.getElementById('thien-super-panel');
        const isVisible = GM_getValue('thien_super_visible', false);
        const savedTop = GM_getValue('thien_super_pos_top', '100px');
        const savedLeft = GM_getValue('thien_super_pos_left', '100px');

        const panelHTML = `
            <div id="thien-super-panel" class="thien-panel" style="position: fixed; top: ${savedTop}; left: ${savedLeft}; width: 380px; z-index: 10001; display: ${isVisible ? 'flex' : 'none'}; flex-direction: column; cursor: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div class="thien-panel-header" style="cursor: move; user-select: none;">
                    <h3 class="thien-panel-title" style="pointer-events: none;">Super Maker</h3>
                    <button id="thien-super-close" class="thien-panel-close-btn">&times;</button>
                </div>
                <div class="duo-body" style="padding:15px;">
                    <textarea class="duo-input" spellcheck="false" id="super-textarea"></textarea>

                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px;">
                        <input type="checkbox" id="super-auto-get-check" style="width: 18px; height: 18px; cursor: pointer;">
                        <label for="super-auto-get-check" style="cursor: pointer; font-weight: 700; font-size: 13px; user-select: none;">Auto Get Link (1 lần/acc)</label>
                    </div>

                    <div class="duo-controls" style="display: flex; gap: 10px; margin-top: 15px;">
                        <button id="super-btn-paste" class="thien-btn thien-btn-primary" style="flex:1; margin:0;">➕ Dán Link</button>
                        <button id="super-btn-copy" class="thien-btn thien-btn-warning" style="flex:1; margin:0;">📋 Copy</button>
                        <button id="super-btn-reset" class="thien-btn thien-btn-danger" style="max-width: 60px; margin:0;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', panelHTML);

        const panel = document.getElementById('thien-super-panel');
        const header = panel.querySelector('.thien-panel-header');
        const closeBtn = document.getElementById('thien-super-close');

        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            panel.style.transition = 'none';
            panel.style.opacity = '0.9';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;
            if(newX < 0) newX = 0;
            if(newY < 0) newY = 0;
            panel.style.left = `${newX}px`;
            panel.style.top = `${newY}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                panel.style.transition = '';
                panel.style.opacity = '1';
                GM_setValue('thien_super_pos_top', panel.style.top);
                GM_setValue('thien_super_pos_left', panel.style.left);
            }
        });
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
            GM_setValue('thien_super_visible', false);
        });
        return panel;
    }

    function toggleSuperPanel() {
        let panel = document.getElementById('thien-super-panel');
        if (!panel) panel = createPersistentSuperPanel();
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
        GM_setValue('thien_super_visible', isHidden);
        if (isHidden) setupSuperMakerLogic();
    }

    function setupSuperMakerLogic() {
        const textarea = document.getElementById('super-textarea');
        const btnPaste = document.getElementById('super-btn-paste');
        const btnCopy = document.getElementById('super-btn-copy');
        const btnReset = document.getElementById('super-btn-reset');
        const panelTitle = document.querySelector('#thien-super-panel .thien-panel-title');
        const autoGetCheckbox = document.getElementById('super-auto-get-check');

        if (!textarea) return;
        let linkList = JSON.parse(localStorage.getItem(SUPER_STORAGE_LINKS) || '[]');

        function saveData() {
            localStorage.setItem(SUPER_STORAGE_LINKS, JSON.stringify(linkList));
        }

        function render() {
            if (panelTitle) panelTitle.innerText = `Super Maker (${linkList.length})`;
            const count = linkList.length;
            const dynamicTitle = `Super Duolingo ${currentDateStr} - ${count} Link Super`;
            let content = `${dynamicTitle}\n${SUPER_BODY_CONTENT}`;

            if (linkList.length > 0) {
                const listText = linkList.map((l, i) => `${i + 1}. ${l}`).join('\n');
                content += `\n\n------------------\n${listText}`;
            }
            textarea.value = content;
            if (linkList.length > 0) textarea.scrollTop = textarea.scrollHeight;
        }

        // --- [NEW] LOGIC AUTO GET LINK WITH TOKEN CHECK ---
        let autoGetInterval = null;

        function runAutoGetLinkLogic() {
            if (!window.location.pathname.includes('/settings/super')) return;

            // [LOGIC MỚI] KIỂM TRA TOKEN
            const currentToken = getCookie('jwt_token');
            const lastHarvestedToken = GM_getValue('thien_super_last_harvested_token', '');

            // Nếu token hiện tại trùng với token đã lấy -> Dừng, không làm gì cả
            if (currentToken && currentToken === lastHarvestedToken) {
                return;
            }

            // 1. Tìm Link Input
            const linkInput = document.querySelector('input[readonly][value^="http"]');

            if (linkInput && linkInput.value) {
                const detectedLink = linkInput.value.trim();
                // Nếu link chưa có trong list thì mới thêm
                if (!linkList.includes(detectedLink)) {
                    linkList.push(detectedLink);
                    saveData();
                    render();
                    if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(detectedLink);
                    navigator.clipboard.writeText(detectedLink);

                    // [UPDATE] Đánh dấu token này đã xong
                    if (currentToken) {
                        GM_setValue('thien_super_last_harvested_token', currentToken);
                    }

                    showToast(`🎉 Đã lấy xong! Chờ acc tiếp theo...`, 4000, 'success');

                    // Không reload trang, không tắt checkbox
                }
                return;
            }

            // 2. Tìm nút Add Member
            const btnAdd = document.querySelector('[data-test="add-family-member"]');
            if (btnAdd) {
                btnAdd.click();
            }

            // 3. Tìm nút Copy (trường hợp hiếm)
            const btnCopyDuo = document.querySelector('button[type="submit"]');
            if (btnCopyDuo && btnCopyDuo.innerText.toUpperCase().includes("CHÉP")) {
                btnCopyDuo.click();
            }
        }

        function toggleAutoGet(enable) {
            GM_setValue('thien_super_auto_get_enabled', enable);
            if (enable) {
                if (!autoGetInterval) {
                    autoGetInterval = setInterval(runAutoGetLinkLogic, 1500); // Check mỗi 1.5s
                    // Đã tắt thông báo "Đã bật..."
                }
            } else {
                if (autoGetInterval) {
                    clearInterval(autoGetInterval);
                    autoGetInterval = null;
                    showToast('Đã tắt Auto Get Link', 2000, 'info');
                }
            }
        }

        // TỰ ĐỘNG BẬT KHI Ở TRANG SETTINGS/SUPER
        if (window.location.pathname.includes('/settings/super')) {
            if (autoGetCheckbox) autoGetCheckbox.checked = true;
            toggleAutoGet(true);
        } else {
            const isAutoGetEnabled = GM_getValue('thien_super_auto_get_enabled', false);
            if (autoGetCheckbox) {
                autoGetCheckbox.checked = isAutoGetEnabled;
                if (isAutoGetEnabled) toggleAutoGet(true);
            }
        }

        if(autoGetCheckbox) {
            autoGetCheckbox.addEventListener('change', (e) => {
                toggleAutoGet(e.target.checked);
            });
        }
        // --- END AUTO GET ---

        render();
        if (btnPaste) btnPaste.onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    const cleanLink = text.trim();
                    if (linkList.includes(cleanLink)) {
                        showToast('Link đã tồn tại! (Đã bỏ qua)', 3000, 'error');
                        return;
                    }

                    linkList.push(cleanLink);
                    saveData();
                    render();
                    const oldText = btnPaste.innerText;
                    btnPaste.innerText = "Đã dán!";
                    setTimeout(() => btnPaste.innerText = oldText, 800);
                }
            } catch (e) { alert("Lỗi đọc clipboard!");
            }
        };

        if (btnCopy) btnCopy.onclick = () => {
            if (!textarea.value) return;
            navigator.clipboard.writeText(textarea.value);
            const oldText = btnCopy.innerText;
            btnCopy.innerText = "Đã chép!";
            setTimeout(() => btnCopy.innerText = oldText, 800);
        };
        if (btnReset) btnReset.onclick = () => {
            if (linkList.length > 0 && confirm('Xóa sạch danh sách?')) {
                linkList = [];
                saveData();
                render();
            }
        };
    }

    // =========================================================================
    // SECTION: TỰ ĐỘNG LƯU TOKEN
    // =========================================================================
    function autoSaveCurrentToken(isSilent = false) {
        const token = getCookie('jwt_token');
        if (!token) { if (!isSilent) showToast('Không tìm thấy token. Bạn đã đăng nhập chưa?', 3000, 'error'); return false;
        }
        let username = getCurrentUsername() || 'Tài khoản mới';
        const accountCount = GM_getValue('duo_multi_account_count', 5);
        let saved = false;
        const today = getFormattedDate();
        for (let i = 1; i <= accountCount; i++) {
            if (GM_getValue(`duo_multi_name_${i}`, '') === '') {
                GM_setValue(`duo_multi_token_${i}`, token);
                GM_setValue(`duo_multi_name_${i}`, username);
                GM_setValue(`duo_multi_date_${i}`, today);
                if (!isSilent) showToast(`Đã lưu token vào "${username}" (ô số ${i}).`, 3000, 'success');
                saved = true;
                break;
            }
        }
        if (!saved) {
            const newCount = accountCount + 1;
            GM_setValue('duo_multi_account_count', newCount);
            GM_setValue(`duo_multi_token_${newCount}`, token);
            GM_setValue(`duo_multi_name_${newCount}`, username);
            GM_setValue(`duo_multi_date_${newCount}`, today);
            if (!isSilent) showToast(`Đã tạo và lưu token vào ô mới: "${username}".`, 3000, 'success');
        }
        return true;
    }

    function runAutomaticSaveCheck() {
        const currentToken = getCookie('jwt_token');
        if (!currentToken) return;
        const accountCount = GM_getValue('duo_multi_account_count', 5);
        let isAlreadySaved = false;
        for (let i = 1; i <= accountCount; i++) {
            if (GM_getValue(`duo_multi_token_${i}`, '') === currentToken) { isAlreadySaved = true;
            break; }
        }
        if (!isAlreadySaved) {
            if (autoSaveCurrentToken(true)) showToast('Tài khoản mới đã được tự động lưu!', 3000, 'success');
        }
    }

    function updateAccountNameIfNeeded() {
        const currentToken = getCookie('jwt_token');
        const currentUsername = getCurrentUsername();
        if (!currentToken || !currentUsername) return;
        const accountCount = GM_getValue('duo_multi_account_count', 5);
        for (let i = 1; i <= accountCount; i++) {
            if (GM_getValue(`duo_multi_token_${i}`, '') === currentToken) {
                const savedName = GM_getValue(`duo_multi_name_${i}`, '');
                if (savedName !== currentUsername && (savedName.startsWith('Tài khoản') || savedName === '')) {
                    GM_setValue(`duo_multi_name_${i}`, currentUsername);
                    showToast(`Đã tự động cập nhật tên tài khoản thành: ${currentUsername}`, 4000, 'success');
                }
                break;
            }
        }
    }

    // =========================================================================
    // SECTION: QUẢN LÝ TÀI KHOẢN
    // =========================================================================
    function loginWithManagedToken(accountIndex) {
        const token = GM_getValue(`duo_multi_token_${accountIndex}`);
        if (token) {
            document.cookie = `jwt_token=${token}; path=/; domain=.duolingo.com; expires=Fri, 31 Dec 9999 23:59:59 GMT; Secure; SameSite=Lax`;
            showToast('Đang đăng nhập...', 0, 'info');
            setTimeout(() => { window.location.href = 'https://www.duolingo.com/'; }, 1000);
        } else { showToast('Không tìm thấy token cho tài khoản này.', 3000, 'error');
        }
    }

    function backupAccounts() {
        if (!confirm('Bạn có muốn sao lưu tất cả tài khoản thành một file JSON không?')) return;
        const accountCount = GM_getValue('duo_multi_account_count', 5);
        let accountsToBackup = [];
        for (let i = 1; i <= accountCount; i++) {
            const name = GM_getValue(`duo_multi_name_${i}`);
            if (name) {
                accountsToBackup.push({ name: name, token: GM_getValue(`duo_multi_token_${i}`, ''), date: GM_getValue(`duo_multi_date_${i}`, '') });
            }
        }
        if (accountsToBackup.length === 0) return showToast('Không có tài khoản nào để sao lưu.', 3000, 'info');
        const backupData = { scriptVersion: SCRIPT_VERSION, backupDate: new Date().toISOString(), accounts: accountsToBackup };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `duolingo_accounts_backup_${getFormattedDate().replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Đã sao lưu ${accountsToBackup.length} tài khoản!`, 3000, 'success');
    }

    function restoreAccounts() {
        if (!confirm('Khôi phục sẽ GHI ĐÈ dữ liệu. Bạn có chắc chắn muốn tiếp tục?')) return;
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json,application/json'; input.style.display = 'none';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    if (!backupData.accounts || !Array.isArray(backupData.accounts)) throw new Error('File sao lưu không hợp lệ.');
                    backupData.accounts.forEach((account, index) => {
                        const i = index + 1;
                        GM_setValue(`duo_multi_name_${i}`, account.name);
                        GM_setValue(`duo_multi_token_${i}`, account.token);
                        GM_setValue(`duo_multi_date_${i}`, account.date);
                    });
                    const currentCount = GM_getValue('duo_multi_account_count', 5);
                    if (backupData.accounts.length > currentCount) GM_setValue('duo_multi_account_count', backupData.accounts.length);
                    showToast(`Đã khôi phục ${backupData.accounts.length} tài khoản.`, 4000, 'success');
                    renderAccountList();
                } catch (error) { showToast(`Lỗi khôi phục: ${error.message}`, 4000, 'error');
                }
            };
            reader.readAsText(file);
            document.body.removeChild(input);
        };
        document.body.appendChild(input);
        input.click();
    }

    function createAccountManagerElements() {
        const { panel, showPanel, hidePanel, content } = createPanel('thien-manager-panel', 'Quản lý Tài khoản', 'thien-manager-close');
        if (content && !content.querySelector('#thien-account-list-container')) {
            content.innerHTML = `<div id="thien-account-list-container" style="max-height: 50vh; overflow-y: auto;"></div><div id="thien-manager-footer" class="thien-panel-footer" style="padding: 10px; display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 10px;"></div>`;
        }
    }

    function renderAccountList() {
        const container = document.getElementById('thien-account-list-container');
        const footer = document.getElementById('thien-manager-footer');
        if (!container || !footer) return;
        const accountCount = GM_getValue('duo_multi_account_count', 5);
        const currentToken = getCookie('jwt_token');
        let allAccounts = [];
        for (let i = 1; i <= accountCount; i++) {
            const name = GM_getValue(`duo_multi_name_${i}`);
            if (!name) continue;
            allAccounts.push({ name, token: GM_getValue(`duo_multi_token_${i}`, ''), date: GM_getValue(`duo_multi_date_${i}`, 'Ngày không xác định'), originalIndex: i });
        }
        const panelTitle = document.querySelector('#thien-manager-panel .thien-panel-title');
        if (panelTitle) panelTitle.textContent = `Quản lý Tài khoản (Số lượng: ${allAccounts.length})`;
        const groupedAccounts = allAccounts.reduce((groups, account) => {
            const date = account.date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(account);
            return groups;
        }, {});
        let listHTML = '';
        const sortedDates = Object.keys(groupedAccounts).sort((a, b) => {
            if (a === 'Ngày không xác định') return 1; if (b === 'Ngày không xác định') return -1;
            const [dayA, monthA, yearA] = a.split('/').map(Number);
            const [dayB, monthB, yearB] = b.split('/').map(Number);
            return new Date(2000 + yearB, monthB - 1, dayB) - new Date(2000 + yearA, monthA - 1, dayA);
        });
        for (const date of sortedDates) {
            listHTML += `<div class="thien-date-header" style="font-size:13px; font-weight:600; color:var(--thien-gray); padding:15px 8px 5px 8px;">${date}</div>`;
            groupedAccounts[date].forEach(account => {
                const { name, token, originalIndex } = account;
                const isActive = token && token === currentToken;
                listHTML += `
                <div class="thien-account-item ${isActive ? 'is-active' : ''}">
                    <div style="display: flex; align-items: center; justify-content: space-between; width:100%;">
                        <div class="thien-account-name-wrapper"><span class="thien-account-name">${name}</span></div>
                        <div style="display: flex; gap: 8px;">
                            <button class="thien-action-btn thien-login-btn" data-account="${originalIndex}" style="background-color: var(--thien-blue); color: white; border:none;">LOGIN</button>
                            <button class="thien-action-btn" data-action="edit" data-account="${originalIndex}" style="background-color: var(--thien-gray); color: white; border:none;">EDIT</button>
                            <button class="thien-action-btn thien-delete-btn" data-account="${originalIndex}" style="background-color: var(--thien-red); color: white; border:none;">XÓA</button>
                        </div>
                    </div>
                </div>`;
            });
        }
        container.innerHTML = listHTML;
        footer.innerHTML = `
            <button id="thien-backup-btn" class="thien-btn thien-btn-warning" style="color:white; margin: 5px;">Sao lưu</button>
            <button id="thien-restore-btn" class="thien-btn thien-btn-secondary" style="color:white; margin: 5px;">Khôi phục</button>
            <button id="thien-reset-btn" class="thien-btn thien-btn-danger" style="color:white; margin: 5px;">Reset</button>
            <button id="thien-add-account-btn" title="Thêm tài khoản mới" style="background-color: var(--thien-blue); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 24px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); margin: 5px;">+</button>
        `;
    }

    function getPanelElements(panelId) {
        const panel = document.getElementById(panelId);
        const overlay = document.getElementById(`${panelId}-overlay`);
        return { panel, overlay };
    }

    function showAccountManagerPanel() { const { panel, overlay } = getPanelElements('thien-manager-panel');
        renderAccountList(); if(overlay) overlay.style.display = 'block'; if(panel) panel.style.display = 'flex'; }
    function hideAccountManager() { const { panel, overlay } = getPanelElements('thien-manager-panel');
        if(overlay) overlay.style.display = 'none'; if(panel) panel.style.display = 'none'; }
    function editManagedToken(accountIndex) { const currentToken = GM_getValue(`duo_multi_token_${accountIndex}`, '');
        const newToken = prompt(`Chỉnh sửa Token cho "${GM_getValue(`duo_multi_name_${accountIndex}`)}":`, currentToken); if (newToken !== null) { GM_setValue(`duo_multi_token_${accountIndex}`, newToken.trim()); renderAccountList();
        showToast(`Đã cập nhật token.`, 2000, 'success'); } }
    function deleteManagedAccount(accountIndex) { const accountCount = GM_getValue('duo_multi_account_count', 5);
        const customName = GM_getValue(`duo_multi_name_${accountIndex}`, `Tài khoản ${accountIndex}`); if (!confirm(`Bạn có chắc chắn muốn xóa "${customName}" không?`)) return;
        for (let i = parseInt(accountIndex); i < accountCount; i++) { GM_setValue(`duo_multi_token_${i}`, GM_getValue(`duo_multi_token_${i + 1}`, '')); GM_setValue(`duo_multi_name_${i}`, GM_getValue(`duo_multi_name_${i + 1}`, ''));
        GM_setValue(`duo_multi_date_${i}`, GM_getValue(`duo_multi_date_${i + 1}`, '')); } GM_deleteValue(`duo_multi_token_${accountCount}`); GM_deleteValue(`duo_multi_name_${accountCount}`); GM_deleteValue(`duo_multi_date_${accountCount}`); GM_setValue('duo_multi_account_count', accountCount - 1); renderAccountList();
        showToast(`Đã xóa tài khoản "${customName}".`, 3000, 'success'); }
    function resetAccounts() { if (!confirm('BẠN CÓ CHẮC CHẮN MUỐN RESET KHÔNG?\n\nToàn bộ tài khoản đã lưu sẽ bị xóa vĩnh viễn!')) return;
        const accountCount = GM_getValue('duo_multi_account_count', 5); for (let i = 1; i <= accountCount; i++) { GM_deleteValue(`duo_multi_token_${i}`); GM_deleteValue(`duo_multi_name_${i}`); GM_deleteValue(`duo_multi_date_${i}`);
        } GM_setValue('duo_multi_account_count', 5); renderAccountList(); showToast('Đã reset toàn bộ tài khoản.', 3000, 'success');
    }

    // =========================================================================
    // SECTION: HACKDUO (DUOVIP) - UI & MANAGEMENT (GRID LAYOUT)
    // =========================================================================
    function createDuoVipPanel() {
        const { panel, showPanel, hidePanel, content } = createPanel('thien-duovip-panel', 'HackDuo Control', 'thien-duovip-close', '650px');
        if (!content) return { showPanel, hidePanel };

        const currentSubMode = GM_getValue('thien_subscription_mode', 'none');

        content.innerHTML = `
            <div id="duovip-status-indicator" style="padding: 8px; border-radius: 12px; margin: 0 10px 10px; text-align: center; font-size: 13px; font-weight: 600; background: rgba(0,0,0,0.05);">Status: Sẵn sàng</div>

            <div class="duovip-grid">
                <div class="duovip-card duovip-full-width">
                    <span class="duovip-label">Nhận Vật Phẩm</span>
                    <div class="duovip-items-row">
                        <button id="duovip-grant-xp-boost" class="thien-btn thien-btn-primary duovip-item-btn">
                            <span class="duovip-icon">⚡</span> <span>x2 XP</span>
                        </button>
                        <button id="duovip-grant-hearts" class="thien-btn thien-btn-danger duovip-item-btn">
                            <span class="duovip-icon">❤️</span> <span>Trái Tim</span>
                        </button>
                        <button id="duovip-grant-streak-freeze" class="thien-btn thien-btn-secondary duovip-item-btn">
                            <span class="duovip-icon">❄️</span> <span>Streak Băng</span>
                        </button>
                    </div>
                </div>

                <div class="duovip-card duovip-full-width">
                    <span class="duovip-label">Gói Đăng Ký (Reload để áp dụng)</span>
                    <div class="duovip-sub-group">
                        <div class="duovip-sub-option">
                            <input type="radio" id="sub-none" name="duovip-sub-mode" value="none" ${currentSubMode === 'none' ? 'checked' : ''}>
                            <label for="sub-none">Tắt</label>
                        </div>
                        <div class="duovip-sub-option">
                            <input type="radio" id="sub-super" name="duovip-sub-mode" value="super" ${currentSubMode === 'super' ? 'checked' : ''}>
                            <label for="sub-super" style="color: #FF9500;">Super</label>
                        </div>
                        <div class="duovip-sub-option">
                            <input type="radio" id="sub-max" name="duovip-sub-mode" value="max" ${currentSubMode === 'max' ? 'checked' : ''}>
                            <label for="sub-max" style="color: #1c1c1e; font-weight:800;">MAX</label>
                        </div>
                    </div>
                </div>

                <div class="duovip-card">
                    <span class="duovip-label">Kinh Nghiệm (XP)</span>
                    <div class="duovip-farm-row">
                        <input type="number" min="1" placeholder="Số lần" id="duovip-xp-loops-input" class="thien-input">
                    </div>
                    <button id="duovip-start-xp-farm" class="thien-btn thien-btn-primary duovip-farm-btn" style="width:100%">Chạy XP</button>
                </div>

                <div class="duovip-card">
                    <span class="duovip-label">Gems (Đá quý)</span>
                    <div class="duovip-farm-row">
                        <input type="number" min="1" placeholder="Số lần" id="duovip-gem-loops-input" class="thien-input">
                    </div>
                    <button id="duovip-start-gem-farm" class="thien-btn thien-btn-secondary duovip-farm-btn" style="width:100%">Chạy Gems</button>
                </div>

                <div class="duovip-card">
                    <span class="duovip-label">Sửa Streak (Ngày)</span>
                    <div class="duovip-farm-row">
                        <input type="number" min="1" placeholder="Số ngày" id="duovip-streak-days-input" class="thien-input">
                    </div>
                    <button id="duovip-start-streak-farm" class="thien-btn thien-btn-warning duovip-farm-btn" style="width:100%">Sửa Streak</button>
                </div>

                 <div class="duovip-card">
                    <span class="duovip-label">Tốc độ (ms)</span>
                    <div class="duovip-farm-row">
                        <input type="number" min="100" placeholder="ms" id="duovip-loop-delay-input" class="thien-input" title="Độ trễ mỗi lần chạy">
                    </div>
                </div>

                <div class="duovip-card duovip-full-width">
                    <span class="duovip-label">Nhiệm Vụ & Huy Hiệu</span>
                    <div style="display: flex; gap: 10px;">
                        <button id="duovip-run-daily-quests-btn" class="thien-btn thien-btn-primary" style="flex:1; margin:0; font-size:12px;">
                            📅 NV Ngày (Auto)
                        </button>
                        <button id="duovip-run-full-quests-btn" class="thien-btn thien-btn-purple" style="flex:1; margin:0; font-size:12px;">
                            🏆 NV Tháng (All)
                        </button>
                    </div>
                </div>
            </div>
        `;
        return { showPanel, hidePanel };
    }

    function createTaskManagerPanel() {
        if (document.getElementById('thien-task-manager')) return;
        const taskManagerHTML = `<div id="thien-task-manager" class="thien-task-manager" style="display: none; position: fixed; bottom: 20px; right: 20px; z-index: 10001; width: 320px; flex-direction: column; padding: 15px; gap: 10px;"><h3 class="thien-task-manager-title" style="font-size:18px; font-weight:700; margin:0;">Tác vụ đang chạy</h3><div id="thien-task-list" style="display:flex; flex-direction:column; gap:8px;"></div></div>`;
        document.body.insertAdjacentHTML('beforeend', taskManagerHTML);
    }
    function showDuoVipPanel() { const { panel, overlay } = getPanelElements('thien-duovip-panel'); if(overlay) overlay.style.display = 'block'; if(panel) panel.style.display = 'flex';
    }
    function hideDuoVipPanel() { const { panel, overlay } = getPanelElements('thien-duovip-panel'); if(overlay) overlay.style.display = 'none';
    if(panel) panel.style.display = 'none'; }

    // =========================================================================
    // SECTION: HACKDUO (DUOVIP) - LOGIC & API CALLS
    // =========================================================================
    const activeFarms = new Map();
    const parseJwt = (token) => { try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; } };
    function getDuoHeaders(jwt) { return { 'Accept': 'application/json, text/plain, */*', 'user-agent': navigator.userAgent, 'authorization': `Bearer ${jwt}`, 'content-type': 'application/json' };
    }

    function getUserData(jwt, sub) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET", url: `https://www.duolingo.com/2017-06-30/users/${sub}?fields=learningLanguage,fromLanguage,streakData,timezone`, headers: { 'authorization': `Bearer ${jwt}` },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        const data = JSON.parse(response.responseText);
                        resolve({ fromLanguage: data.fromLanguage || 'en', learningLanguage: data.learningLanguage || 'es', streakStartDate: data.streakData?.currentStreak?.startDate, timezone: data.timezone || data.tz || 'UTC' });
                    } else { reject(new Error(`HTTP error! status: ${response.status}`));
                    }
                }, onerror: (error) => reject(error)
            });
        });
    }

    async function grantShopItem(itemName, friendlyName) {
        showToast(`Đang nhận ${friendlyName}...`, 2000, 'info');
        const jwt = getCookie('jwt_token');
        if (!jwt) return showToast('Lỗi: Chưa đăng nhập!', 3000, 'error');
        const userId = parseJwt(jwt)?.sub;
        if (!userId) return showToast('Lỗi: Token không hợp lệ!', 3000, 'error');
        const userData = await getUserData(jwt, userId).catch(() => null);
        if (!userData) return showToast('Lỗi: Không lấy được dữ liệu người dùng!', 3000, 'error');
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST', url: `https://www.duolingo.com/2017-06-30/users/${userId}/shop-items`, headers: getDuoHeaders(jwt),
                data: JSON.stringify({ itemName: itemName, isFree: true, fromLanguage: userData.fromLanguage, learningLanguage: userData.learningLanguage }),
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) { showToast(`Nhận ${friendlyName} thành công!`, 3000, 'success'); resolve(true); }
                    else { showToast(`Lỗi khi nhận ${friendlyName}.`, 3000, 'error'); resolve(false); }
                }, onerror: () => { showToast('Lỗi mạng, không thể nhận vật phẩm.', 3000, 'error'); resolve(false); }
            });
        });
    }

    function updateMasterStatus() {
        const indicator = document.getElementById('duovip-status-indicator');
        const taskManager = document.getElementById('thien-task-manager');
        const farmCount = activeFarms.size;
        if (indicator) {
            if (farmCount > 0) {
                indicator.textContent = `Đang chạy (${farmCount} tác vụ)`;
                indicator.style.backgroundColor = 'var(--thien-orange)'; indicator.style.color = 'white'; if(taskManager) taskManager.style.display = 'flex';
            } else {
                indicator.textContent = 'Status: Sẵn sàng';
                indicator.style.backgroundColor = 'rgba(0,0,0,0.05)'; indicator.style.color = 'inherit'; if(taskManager) taskManager.style.display = 'none';
            }
        }
    }

    function addFarmUI(farmId, message) {
        const container = document.getElementById('thien-task-list');
        if (!container) return;
        let farmBox = document.getElementById(`farm-status-${farmId}`);
        if (!farmBox) {
            farmBox = document.createElement('div');
            farmBox.id = `farm-status-${farmId}`;
            farmBox.className = 'thien-task-item';
            farmBox.innerHTML = `<span class="thien-task-item-text" style="font-size:14px;">${message}</span><button data-farm-id="${farmId}" class="thien-task-item-stop-btn" style="font-size: 12px; padding: 4px 10px; border-radius: 8px; color: white; background-color: var(--thien-red); border: none; cursor: pointer; font-weight: bold;">Dừng</button>`;
            const stopBtn = farmBox.querySelector('.thien-task-item-stop-btn');
            if (stopBtn) stopBtn.addEventListener('click', () => stopFarm(farmId));
            container.appendChild(farmBox);
        } else { updateFarmStatus(farmId, message);
        }
        updateMasterStatus();
    }

    function updateFarmStatus(farmId, message) {
        const farmBox = document.getElementById(`farm-status-${farmId}`);
        const textElement = farmBox?.querySelector('.thien-task-item-text');
        if (textElement) textElement.textContent = message;
    }

    function finalizeFarmUI(farmId, finalMessage) {
        const farmBox = document.getElementById(`farm-status-${farmId}`);
        if (farmBox) {
            const textElement = farmBox.querySelector('.thien-task-item-text');
            const stopBtn = farmBox.querySelector('.thien-task-item-stop-btn');
            if (textElement) textElement.textContent = finalMessage;
            if (stopBtn) { stopBtn.disabled = true; stopBtn.style.backgroundColor = 'var(--thien-gray)';
            }
            setTimeout(() => { if (farmBox) farmBox.remove(); updateMasterStatus(); }, 5000);
        }
    }

    function stopFarm(farmId, isManual = true) {
        if (!activeFarms.has(farmId)) return;
        activeFarms.set(farmId, false);
        activeFarms.delete(farmId);
        // Reset button state
        const btnMap = {
            'xp': 'duovip-start-xp-farm',
            'gem': 'duovip-start-gem-farm',
            'streak': 'duovip-start-streak-farm',
            'full-quests': 'duovip-run-full-quests-btn',
            'daily-quests': 'duovip-run-daily-quests-btn'
        };
        const btnId = btnMap[farmId];
        if(btnId) {
             const btn = document.getElementById(btnId);
             if(btn) { btn.disabled = false; btn.style.opacity = 1; }
        }

        if (isManual) finalizeFarmUI(farmId, "Đã dừng.");
        else updateMasterStatus();
    }

    async function farmXp(jwt, fromLang, toLang, count, loopDelay) {
        const farmId = 'xp';
        if (activeFarms.has(farmId)) return;
        activeFarms.set(farmId, true);
        const startBtn = document.getElementById('duovip-start-xp-farm');
        if (startBtn) { startBtn.disabled = true; startBtn.style.opacity = 0.5;
        }
        addFarmUI(farmId, "Bắt đầu farm XP...");
        let totalXp = 0, i = 0;
        const isInfinite = count === 0;

        while (isInfinite || i < count) {
            if (!activeFarms.get(farmId)) break;
            const now_ts = Math.floor(Date.now() / 1000);
            const payload = { "awardXp": true, "completedBonusChallenge": true, "fromLanguage": fromLang, "learningLanguage": toLang, "hasXpBoost": false, "illustrationFormat": "svg", "isFeaturedStoryInPracticeHub": true, "isLegendaryMode": true, "isV2Redo": false, "isV2Story": false, "masterVersion": true, "maxScore": 0, "score": 0, "happyHourBonusXp": 469, "startTime": now_ts, "endTime": now_ts };
            const response = await new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: "POST", url: "https://stories.duolingo.com/api2/stories/fr-en-le-passeport/complete", headers: getDuoHeaders(jwt), data: JSON.stringify(payload),
                    onload: res => resolve(res), onerror: () => resolve(null)
                });
            });

            if (response && response.status === 200) {
                totalXp += JSON.parse(response.responseText).awardedXp || 0;
                const statusCount = isInfinite ? `Lần ${i + 1}` : `${i + 1}/${count}`;
                updateFarmStatus(farmId, `XP ${statusCount} | Tổng: ${totalXp}`);
            } else { updateFarmStatus(farmId, `Lỗi ở lần ${i + 1}.`); break;
            }
            await new Promise(r => setTimeout(r, loopDelay));
            i++;
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, "✔ Đã Hoàn Thành");
    }

    async function farmGems(jwt, uid, fromLang, toLang, count, loopDelay) {
        const farmId = 'gem';
        if (activeFarms.has(farmId)) return;
        activeFarms.set(farmId, true);
        const startBtn = document.getElementById('duovip-start-gem-farm');
        if (startBtn) { startBtn.disabled = true; startBtn.style.opacity = 0.5;
        }
        addFarmUI(farmId, "Bắt đầu farm Gems...");
        let totalGems = 0, i = 0;
        const isInfinite = count === 0;

        while (isInfinite || i < count) {
            if (!activeFarms.get(farmId)) break;
            for (const reward of ["SKILL_COMPLETION_BALANCED-...-2-GEMS", "SKILL_COMPLETION_BALANCED-...-2-GEMS"]) {
                await new Promise(resolve => {
                    GM_xmlhttpRequest({
                        method: 'PATCH', url: `https://www.duolingo.com/2017-06-30/users/${uid}/rewards/${reward}`, headers: getDuoHeaders(jwt), data: JSON.stringify({ "consumed": true, "fromLanguage": fromLang, "learningLanguage": toLang }),
                        onload: () => resolve(), onerror: () => resolve()
                    });
                });
            }
            totalGems += 60;
            const statusCount = isInfinite ? `Lần ${i + 1}` : `${i + 1}/${count}`;
            updateFarmStatus(farmId, `Gems ${statusCount} | Tổng: ~${totalGems}`);
            await new Promise(r => setTimeout(r, loopDelay));
            i++;
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, "✔ Đã Hoàn Thành");
    }

    async function farmStreak(jwt, uid, fromLang, toLang, days, loopDelay) {
        const farmId = 'streak';
        if (activeFarms.has(farmId)) return;
        activeFarms.set(farmId, true);
        const startBtn = document.getElementById('duovip-start-streak-farm');
        if (startBtn) { startBtn.disabled = true; startBtn.style.opacity = 0.5;
        }
        addFarmUI(farmId, "Lấy dữ liệu người dùng...");
        const userData = await getUserData(jwt, uid).catch(() => null);
        if (!userData) { stopFarm(farmId, false);
        finalizeFarmUI(farmId, "Lỗi: Không thể lấy dữ liệu người dùng."); return;
        }

        const startDate = userData.streakStartDate ? new Date(userData.streakStartDate) : new Date();
        let loopShouldContinue = true;
        const isInfinite = days === 0;
        let i = 0;
        while (isInfinite || i < days) {
            if (!activeFarms.get(farmId)) { loopShouldContinue = false;
            break; }
            const simDay = new Date(startDate);
            simDay.setDate(simDay.getDate() - i);
            const statusCount = isInfinite ? `Ngày ${i + 1}` : `${i + 1}/${days}`;
            updateFarmStatus(farmId,`Sửa ${statusCount}: ${simDay.toISOString().split('T')[0]}`);
            await new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: 'POST', url: "https://www.duolingo.com/2017-06-30/sessions", headers: getDuoHeaders(jwt), data: JSON.stringify({ "challengeTypes": [], "fromLanguage": fromLang, "isFinalLevel": false, "isV2": true, "juicy": true, "learningLanguage": toLang, "type": "GLOBAL_PRACTICE" }),
                    onload: (r1) => {
                        if (r1.status !== 200) { loopShouldContinue = false; return resolve(); }
                        const sessionData = JSON.parse(r1.responseText);
                        const putPayload = { ...sessionData, "heartsLeft": 5, "startTime": Math.floor(simDay.getTime() / 1000 - 60), "endTime": Math.floor(simDay.getTime() / 1000), "failed": false };
                        GM_xmlhttpRequest({
                            method: 'PUT', url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, headers: getDuoHeaders(jwt), data: JSON.stringify(putPayload),
                            onload: (r2) => { if (r2.status !== 200) loopShouldContinue = false;
                            resolve(); },
                            onerror: () => { loopShouldContinue = false;
                            resolve(); }
                        });
                    }, onerror: () => { loopShouldContinue = false; resolve(); }
                });
            });
            if (!loopShouldContinue) break;
            await new Promise(r => setTimeout(r, loopDelay));
            i++;
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, loopShouldContinue ? "✔ Đã Hoàn Thành" : "Đã dừng.");
    }

    function fetchAllMetrics(jwt) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET", url: 'https://goals-api.duolingo.com/schema?ui_language=en', headers: getDuoHeaders(jwt), timeout: 15000,
                ontimeout: () => reject(new Error('Yêu cầu hết hạn khi lấy metrics')),
                onload: res => {
                    if (res.status === 200) {
                        try { const schema = JSON.parse(res.responseText); const metrics = new Set(schema.goals.map(g => g.metric).filter(Boolean)); resolve(metrics); } catch (e) { reject(new Error('Không thể phân tích phản hồi schema.')); }
                    } else { reject(new Error(`Lỗi lấy metrics (Status: ${res.status})`)); }
                }, onerror: (err) => reject(new Error('Lỗi mạng khi lấy metrics.'))
            });
        });
    }

    function postProgressUpdate(jwt, uid, payload) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST', url: `https://goals-api.duolingo.com/users/${uid}/progress/batch`, headers: getDuoHeaders(jwt), data: JSON.stringify(payload), timeout: 15000,
                ontimeout: () => resolve(false), onload: (res) => resolve(res.status === 200), onerror: () => resolve(false)
            });
        });
    }

    function generateQuestDates() {
        const dates = [];
        const now = new Date();
        const startDay = now.getDate();
        const endDate = new Date(2021, 0, 1);
        let currentDate = new Date(now);
        while (currentDate >= endDate) {
            let targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), startDay, now.getHours(), now.getMinutes(), now.getSeconds());
            if (targetDate.getMonth() !== currentDate.getMonth()) { targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            }
            dates.push(targetDate);
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() - 1);
        }
        return dates;
    }

    async function runFullQuestCompletion(jwt, uid, timezone) {
        const farmId = 'full-quests';
        if (activeFarms.has(farmId)) return;
        activeFarms.set(farmId, true);
        const startBtn = document.getElementById('duovip-run-full-quests-btn');
        if (startBtn) { startBtn.disabled = true; startBtn.style.opacity = 0.5;
        }
        addFarmUI(farmId, 'Bắt đầu quá trình hoàn thành...');
        try {
            updateFarmStatus(farmId, 'Đang lấy quest metrics...');
            const metrics = await fetchAllMetrics(jwt);
            if (!metrics || metrics.size === 0) throw new Error('Không tìm thấy quest metrics.');
            const dates = generateQuestDates();
            updateFarmStatus(farmId, `Tìm thấy ${dates.length} tháng để xử lý...`);
            const metricUpdates = [...metrics].map(m => ({ "metric": m, "quantity": 2000 }));
            if (!metrics.has("QUESTS")) metricUpdates.push({ "metric": "QUESTS", "quantity": 1 });
            let successCount = 0;
            for (let i = 0; i < dates.length; i++) {
                if (!activeFarms.get(farmId)) { finalizeFarmUI(farmId, 'Đã dừng bởi người dùng.');
                stopFarm(farmId, false); return; }
                const targetDate = dates[i];
                const monthStr = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                updateFarmStatus(farmId, `[${i + 1}/${dates.length}] Gửi cho ${monthStr}...`);
                const timestamp = targetDate.toISOString();
                const payload = { "metric_updates": metricUpdates, "timestamp": timestamp, "timezone": timezone };
                const success = await postProgressUpdate(jwt, uid, payload);
                if (success) successCount++;
                await new Promise(r => setTimeout(r, 1000));
            }
            finalizeFarmUI(farmId, `✔ Đã Hoàn Thành (${successCount}/${dates.length} thành công)`);
        } catch (e) {
            console.error('DuoVip: Lỗi hoàn thành nhiệm vụ:', e);
        finalizeFarmUI(farmId, `Lỗi: ${e.message || 'Lỗi không xác định'}`);
        }
        stopFarm(farmId, false);
    }

    // =========================================================================
    // SECTION: TXT EDITOR (EDITED: KEEP FILENAME)
    // =========================================================================
    function createTxtEditorPanel() {
        const { panel, showPanel, hidePanel, content } = createPanel('thien-txt-editor-panel', 'Txt-editor', 'thien-txt-editor-panel-close');
        if (!content) return { showPanel, hidePanel };

        content.innerHTML = `
            <div class="thien-txt-editor-section">
                <label class="thien-txt-editor-label">Xóa các dòng đầu tiên</label>
                <input type="file" id="txt-delete-input" accept=".txt" class="thien-input" style="margin-top: 10px; padding: 5px;">
                <input type="number" min="1" id="txt-delete-count" placeholder="VD: 10" class="thien-input" style="margin-top: 10px;">
                <button id="txt-delete-run" class="thien-btn thien-btn-primary" style="width: 100%; margin: 10px 0 0 0;">Xóa Dòng</button>
                <div id="thien-txt-editor-results-delete"></div>
            </div>
            <div class="thien-txt-editor-section">
                <label class="thien-txt-editor-label">Cắt file TXT (Tự động tải)</label>
                <div style="font-size:12px; margin-bottom:5px;">Số dòng mỗi file con:</div>
                <input type="number" id="txt-cut-lines" value="150" class="thien-input" style="margin-bottom:10px;">
                <input type="file" id="txt-cut-input" accept=".txt" class="thien-input" style="margin-top: 10px; padding: 5px;">
                <button id="txt-cut-run" class="thien-btn thien-btn-secondary" style="width: 100%; margin: 10px 0 0 0;">Cắt & Tải Tất Cả</button>
                <div id="thien-txt-editor-results-cut"></div>
            </div>
        `;
        return { showPanel, hidePanel };
    }

    function addTxtEditorEventListeners() {
        const deleteBtn = document.getElementById('txt-delete-run');
        const cutBtn = document.getElementById('txt-cut-run');

        if (deleteBtn) deleteBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('txt-delete-input');
            const countInput = document.getElementById('txt-delete-count');
            const resultsDiv = document.getElementById('thien-txt-editor-results-delete');
            const file = fileInput?.files?.[0];

            if (!file) return showToast('Vui lòng chọn một file.', 3000, 'error');
            if (!countInput || !resultsDiv) return;

            const deleteCount = parseInt(countInput.value.trim(), 10);
            if (isNaN(deleteCount) || deleteCount <= 0) return showToast('Số dòng không hợp lệ.', 4000, 'error');
            const reader = new FileReader();
            reader.onload = (e) => {
                const lines = e.target.result.split('\n');
                if (lines.length <= deleteCount) return showToast('File quá ngắn!', 4000, 'error');
                lines.splice(0, deleteCount);
                const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const downloadName = file.name;

                resultsDiv.innerHTML = `<a href="${url}" download="${downloadName}" class="thien-btn thien-btn-primary">Tải xuống kết quả</a>`;
                showToast('Xử lý thành công!', 3000, 'success');
            };
            reader.readAsText(file);
        });
        if (cutBtn) cutBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('txt-cut-input');
            const linesInput = document.getElementById('txt-cut-lines');
            const resultsDiv = document.getElementById('thien-txt-editor-results-cut');
            const file = fileInput?.files?.[0];
            const linesPerFile = parseInt(linesInput.value) || 150;

            if (!file) return showToast('Vui lòng chọn file .txt', 3000, 'error');
            resultsDiv.innerHTML = '<div style="text-align:center; padding:10px;">⏳ Đang xử lý...</div>';

            const reader = new FileReader();
            reader.onload = (e) => {
                const lines = e.target.result.split('\n');
                const totalFiles = Math.ceil(lines.length / linesPerFile);
                const baseName = file.name.replace(/\.txt$/i, '');

                resultsDiv.innerHTML = `Đang tải xuống <b>${totalFiles}</b> file...<br><small>(Vui lòng chọn "Cho phép" nếu trình duyệt hỏi)</small>`;
                for (let i = 0; i < totalFiles; i++) {
                    setTimeout(() => {
                        const chunk = lines.slice(i * linesPerFile, (i + 1) * linesPerFile).join('\n');
                        const blob = new Blob([chunk], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${baseName}_part_${i + 1}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        if(i === totalFiles - 1) {
                            showToast('Đã tải xong tất cả!', 3000, 'success');
                            resultsDiv.innerHTML = `<span style="color:green">✅ Đã tải xong ${totalFiles} file.</span>`;
                        }
                    }, i * 300);
                }
            };
            reader.readAsText(file);
        });
    }

    // =========================================================================
    // SECTION: EVENT LISTENERS VÀ KHỞI TẠO
    // =========================================================================
    function addManagerEventListeners() {
        const managerPanel = document.getElementById('thien-manager-panel');
        const managerCloseBtn = document.getElementById('thien-manager-close');
        const managerOverlay = document.getElementById('thien-manager-overlay');

        if(managerCloseBtn) managerCloseBtn.addEventListener('click', hideAccountManager);
        if(managerOverlay) managerOverlay.addEventListener('click', hideAccountManager);
        if(managerPanel) managerPanel.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            if (target.id === 'thien-backup-btn') return backupAccounts();
            if (target.id === 'thien-restore-btn') return restoreAccounts();
            if (target.id === 'thien-reset-btn') return resetAccounts();
            if (target.id === 'thien-add-account-btn') {
                let count = GM_getValue('duo_multi_account_count', 5);
                GM_setValue('duo_multi_account_count', ++count);
                renderAccountList();
                return;
            }
            const accountBtn = target.closest('[data-account]');
            if (accountBtn) {
                const accountIndex = accountBtn.dataset.account;
                if(target.classList.contains('thien-login-btn')) return loginWithManagedToken(accountIndex);
                if(target.classList.contains('thien-delete-btn')) return deleteManagedAccount(accountIndex);
                if(target.dataset.action === 'edit') return editManagedToken(accountIndex);
            }
        });
    }

    function addDuoVipEventListeners() {
        const duovipPanel = document.getElementById('thien-duovip-panel');
        if (!duovipPanel) return;

        // UI Buttons
        const closeBtn = duovipPanel.querySelector('#thien-duovip-close');
        const overlay = document.getElementById('thien-duovip-overlay');
        const xpBoostBtn = duovipPanel.querySelector('#duovip-grant-xp-boost');
        const freezeBtn = duovipPanel.querySelector('#duovip-grant-streak-freeze');
        const heartsBtn = duovipPanel.querySelector('#duovip-grant-hearts');

        // Inputs & Controls
        const loopDelayInput = duovipPanel.querySelector('#duovip-loop-delay-input');
        const startXpBtn = duovipPanel.querySelector('#duovip-start-xp-farm');
        const startGemBtn = duovipPanel.querySelector('#duovip-start-gem-farm');
        const startStreakBtn = duovipPanel.querySelector('#duovip-start-streak-farm');
        const startMonthlyQuestsBtn = duovipPanel.querySelector('#duovip-run-full-quests-btn');
        const startDailyQuestsBtn = duovipPanel.querySelector('#duovip-run-daily-quests-btn');
        const subRadios = duovipPanel.querySelectorAll('input[name="duovip-sub-mode"]');

        // Close Panel Logic
        if(closeBtn) closeBtn.addEventListener('click', hideDuoVipPanel);
        if(overlay) overlay.addEventListener('click', hideDuoVipPanel);

        // Subscription Logic (Radio Change)
        subRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    GM_setValue('thien_subscription_mode', this.value);
                    showToast(`Đã chọn chế độ: ${this.value.toUpperCase()}. Đang tải lại...`, 1000, 'info');
                    setTimeout(() => window.location.reload(), 800);
                }
            });
        });

        // Items Logic
        if(xpBoostBtn) xpBoostBtn.addEventListener('click', () => grantShopItem('general_xp_boost', 'XP Boost'));
        if(freezeBtn) freezeBtn.addEventListener('click', () => grantShopItem('streak_freeze', 'Streak Freeze'));
        if(heartsBtn) heartsBtn.addEventListener('click', () => grantShopItem('health_refill', 'Heart Refill'));

        // Delay Input Logic
        if(loopDelayInput) {
            loopDelayInput.value = GM_getValue('thien_duovip_loop_delay', 200);
            loopDelayInput.addEventListener('change', () => {
                let newValue = parseInt(loopDelayInput.value, 10);
                if (isNaN(newValue) || newValue < 100) newValue = 100;
                loopDelayInput.value = newValue;
                GM_setValue('thien_duovip_loop_delay', newValue);
            });
        }

        // Main Farming Logic
        async function handleFarmAction(action) {
            const jwt = getCookie('jwt_token');
            if (!jwt || !parseJwt(jwt)?.sub) return showToast('Lỗi: Không tìm thấy thông tin đăng nhập.', 4000, 'error');
            const userId = parseJwt(jwt).sub;
            const loopDelay = parseInt(GM_getValue('thien_duovip_loop_delay', 200), 10);

            showToast('Đang lấy dữ liệu...', 1000, 'info');
            const userData = await getUserData(jwt, userId).catch(() => null);
            if (!userData) return showToast('Lỗi: Không thể lấy dữ liệu người dùng.', 4000, 'error');

            const getCount = (inputId) => {
                const inputElement = document.getElementById(inputId);
                const rawValue = inputElement ? inputElement.value : '';
                const count = rawValue.trim() === '' ? 0 : parseInt(rawValue, 10);
                return (isNaN(count) || count < 0) ? null : count;
            };

            switch(action) {
                case 'xp': {
                    const count = getCount('duovip-xp-loops-input');
                    if (count !== null) farmXp(jwt, userData.fromLanguage, 'fr', count, loopDelay);
                    else showToast('Vui lòng nhập số lần hợp lệ.', 3000, 'error');
                    break;
                }
                case 'gem': {
                    const count = getCount('duovip-gem-loops-input');
                    if (count !== null) farmGems(jwt, userId, userData.fromLanguage, userData.learningLanguage, count, loopDelay);
                    else showToast('Vui lòng nhập số lần hợp lệ.', 3000, 'error');
                    break;
                }
                case 'streak': {
                    const count = getCount('duovip-streak-days-input');
                    if (count !== null) farmStreak(jwt, userId, userData.fromLanguage, userData.learningLanguage, count, loopDelay);
                    else showToast('Vui lòng nhập số ngày hợp lệ.', 3000, 'error');
                    break;
                }
                case 'monthly-quests': {
                    // Chạy badge các tháng cũ
                    runFullQuestCompletion(jwt, userId, userData.timezone);
                    break;
                }
                case 'daily-quests': {
                    // Chạy 10 bài XP thường sẽ hoàn thành nhiệm vụ ngày
                    showToast('Đang tự động chạy 10 bài để làm nhiệm vụ ngày...', 2000, 'info');
                    farmXp(jwt, userData.fromLanguage, 'fr', 10, loopDelay);
                    break;
                }
            }
        }

        if(startXpBtn) startXpBtn.addEventListener('click', () => handleFarmAction('xp'));
        if(startGemBtn) startGemBtn.addEventListener('click', () => handleFarmAction('gem'));
        if(startStreakBtn) startStreakBtn.addEventListener('click', () => handleFarmAction('streak'));
        if(startMonthlyQuestsBtn) startMonthlyQuestsBtn.addEventListener('click', () => handleFarmAction('monthly-quests'));
        if(startDailyQuestsBtn) startDailyQuestsBtn.addEventListener('click', () => handleFarmAction('daily-quests'));
    }

    function createControlPanel() {
        if (document.getElementById('thien-control-panel')) { return document.getElementById('thien-control-panel');
        }
        const panel = document.createElement('div');
        panel.id = 'thien-control-panel';
        panel.className = 'thien-panel';
        Object.assign(panel.style, {
            position: 'fixed', top: '80px', right: '20px', zIndex: '9999', width: '280px',
            transition: 'opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            display: 'none', opacity: '0', transform: 'translateX(-15px) scale(0.95)', transformOrigin: 'left center'
        });
        panel.innerHTML = `<div class="thien-panel-header"><h3 class="thien-panel-title">Thiên</h3><button id="thien-theme-toggle" title="Đổi giao diện" style="background: none; border: none; cursor: pointer; font-size: 20px;">🌙</button></div><div id="thien-main-buttons-container" style="padding: 10px;"></div><div class="thien-version-info" style="text-align: center; font-size: 12px; margin-top: 15px; padding: 10px 0 5px 0; color: var(--thien-gray);">Phiên bản: ${SCRIPT_VERSION}</div>`;
        document.body.appendChild(panel);
        return panel;
    }

    function createLoginPanel() {
        const { showPanel, hidePanel, content } = createPanel('thien-login-panel', 'Login', 'thien-login-panel-close');
        if (!content) return { showPanel: () => {} };
        if (!content.querySelector('.thien-btn-secondary[onclick*="showAccountManagerPanel"]')) {
            content.innerHTML = '';
            addButton('Quản lý Tài khoản', () => { hidePanel(); showAccountManagerPanel(); }, content, 'thien-btn-secondary');
            addButton('Auto Login với Token', autoLoginWithToken, content, 'thien-btn-primary');
            addButton('Copy Token Hiện Tại', copyToken, content, 'thien-btn-primary');
            addButton('Sao chép Username', copyUsername, content, 'thien-btn-primary');
            addButton('Tự động lưu Token', () => autoSaveCurrentToken(false), content, 'thien-btn-warning');
        }
        return { showPanel };
    }

     function createSettingsPanel(showTxtEditorFunc) {
        const { panel, showPanel, hidePanel, content } = createPanel('thien-settings-panel', 'Cài đặt', 'thien-settings-panel-close');
        if (content) {
            addButton('Txt-editor', () => { hidePanel(); if(showTxtEditorFunc) showTxtEditorFunc(); }, content, 'thien-btn-secondary');
            content.insertAdjacentHTML('beforeend', `<div class="thien-settings-option"><label for="logout-popup-toggle" style="margin-left:8px;">Hiện pop-up Đăng xuất</label><input type="checkbox" id="logout-popup-toggle" style="width: 18px; height: 18px; cursor: pointer;"></div>`);
            addButton('Đăng Xuất', logoutAccount, content, 'thien-btn-danger');
        }
        return { showPanel, hidePanel };
    }

     function createLogoutPopup() {
        if (document.getElementById('thien-logout-popup')) return;
        const popupHTML = `<div id="thien-logout-popup" class="thien-popup" style="position: fixed; z-index: 9998; display: none; padding: 10px; cursor: grab;"><div style="display: flex; justify-content: flex-end;"><button id="thien-logout-popup-close" class="thien-panel-close-btn" title="Đóng">&times;</button></div><button id="thien-logout-popup-btn" class="thien-btn thien-btn-danger">Đăng xuất</button></div>`;
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        const popup = document.getElementById('thien-logout-popup');
        popup.style.top = GM_getValue('thien_logout_popup_pos_top', '150px');
        popup.style.left = GM_getValue('thien_logout_popup_pos_left', '20px');
        const logoutBtn = document.getElementById('thien-logout-popup-btn');
        if (logoutBtn) logoutBtn.onclick = logoutAccount;

        let isDragging = false, offsetX, offsetY;
        popup.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            offsetX = e.clientX - popup.getBoundingClientRect().left;
            offsetY = e.clientY - popup.getBoundingClientRect().top;
            popup.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            popup.style.left = `${e.clientX - offsetX}px`;
            popup.style.top = `${e.clientY - offsetY}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                popup.style.cursor = 'grab';
                GM_setValue('thien_logout_popup_pos_top', popup.style.top);
                GM_setValue('thien_logout_popup_pos_left', popup.style.left);
            }
        });
    }

    function createFinalButton(panel) {
        if (document.getElementById('thien-final-toggle-button')) return;
        const toggleButton = document.createElement('div');
        toggleButton.id = 'thien-final-toggle-button';
        Object.assign(toggleButton.style, {
            position: 'fixed', top: GM_getValue('thien_button_pos_top', '80px'), left: GM_getValue('thien_button_pos_left', '20px'),
            width: '55px', height: '55px', borderRadius: '50%', cursor: 'grab', zIndex: '10000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'transform 0.3s ease-in-out',
            animation: 'thien-breathe 3s infinite cubic-bezier(0.4, 0, 0.6, 1)',
            backgroundImage: `url('https://i.postimg.cc/3NBkgRwh/Paimon-Icon.webp')`, backgroundSize: 'cover', backgroundPosition: 'center'
        });
        let isDragging = false, moved = false, startX, startY;
        const onInteractionStart = (e) => {
            isDragging = true;
            moved = false;
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            const rect = toggleButton.getBoundingClientRect();
            startX = clientX; startY = clientY;
            const offsetX = clientX - rect.left;
            const offsetY = clientY - rect.top;
            const onInteractionMove = (moveEvent) => {
                const moveClientX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const moveClientY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
                if (!moved && (Math.abs(moveClientX - startX) > 5 || Math.abs(moveClientY - startY) > 5)) moved = true;
                if (moved) {
                    toggleButton.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, moveClientX - offsetX))}px`;
                    toggleButton.style.top = `${Math.max(0, Math.min(window.innerHeight - rect.height, moveClientY - offsetY))}px`;
                }
            };
            const onInteractionEnd = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onInteractionMove); document.removeEventListener('mouseup', onInteractionEnd);
                document.removeEventListener('touchmove', onInteractionMove); document.removeEventListener('touchend', onInteractionEnd);
                if (moved) {
                    GM_setValue('thien_button_pos_top', toggleButton.style.top);
                    GM_setValue('thien_button_pos_left', toggleButton.style.left);
                } else {
                    if (panel) {
                        const isHidden = panel.style.opacity === '0' || panel.style.display === 'none';
                        if (isHidden) {
                            positionPanel(panel, toggleButton);
                            panel.style.display = 'block';
                            requestAnimationFrame(() => { panel.style.transform = 'translateX(0) scale(1)'; panel.style.opacity = '1'; });
                        } else {
                            panel.style.transform = 'translateX(-15px) scale(0.95)';
                            panel.style.opacity = '0';
                            setTimeout(() => { panel.style.display = 'none'; }, 300);
                        }
                    }
                }
            };
            document.addEventListener('mousemove', onInteractionMove); document.addEventListener('mouseup', onInteractionEnd);
            document.addEventListener('touchmove', onInteractionMove, { passive: false }); document.addEventListener('touchend', onInteractionEnd);
            if (e.type === 'touchstart') e.preventDefault();
        };
        toggleButton.addEventListener('mousedown', onInteractionStart);
        toggleButton.addEventListener('touchstart', onInteractionStart, { passive: false });
        document.body.appendChild(toggleButton);
    }

    function positionPanel(panel, toggleBtn) {
        if (!panel || !toggleBtn) return;
        const rect = toggleBtn.getBoundingClientRect();
        panel.style.left = `${rect.right + 15}px`;
        panel.style.top = `${rect.top}px`;
    }
    function applyTheme() { const theme = GM_getValue('thien_theme', 'light'); document.body.classList.toggle('thien-dark-mode', theme === 'dark'); const toggle = document.getElementById('thien-theme-toggle');
        if(toggle) toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    function applyLogoutPopupSetting() {
        const popup = document.getElementById('thien-logout-popup');
        const checkbox = document.getElementById('logout-popup-toggle');
        const show = GM_getValue('thien_logout_popup_visible', false);
        if(popup) popup.style.display = show ? 'block' : 'none';
        if(checkbox) checkbox.checked = show;
    }

    function initialize() {
        const subMode = GM_getValue('thien_subscription_mode', 'none');
        if (subMode !== 'none') injectSubscriptionInterceptor(subMode);
        injectStyles();

        let uiBuilt = false;
        const buildUI = () => {
            if (!document.body || uiBuilt) return;
            uiBuilt = true;

            const controlPanel = createControlPanel();
            if (!controlPanel) return;
            const mainButtonsContainer = document.getElementById('thien-main-buttons-container');
            if (!mainButtonsContainer) return;

            createFinalButton(controlPanel);
            createAccountManagerElements();
            const { showPanel: showDuoVip, hidePanel: hideDuoVip } = createDuoVipPanel();
            createTaskManagerPanel();
            const { showPanel: showLogin } = createLoginPanel();
            const { showPanel: showTxtEditor, hidePanel: hideTxtEditor } = createTxtEditorPanel();
            const { showPanel: showSettings } = createSettingsPanel(showTxtEditor);

            // [UPDATE] TỰ ĐỘNG BẬT SUPER MAKER PANEL NẾU Ở TRANG SETTINGS/SUPER
            if (window.location.pathname.includes('/settings/super')) {
                createPersistentSuperPanel();
                setupSuperMakerLogic();
            } else if (GM_getValue('thien_super_visible', false)) {
                createPersistentSuperPanel();
                setupSuperMakerLogic();
            }

            createLogoutPopup();
            if (showDuoVip) addButton('HackDuo', showDuoVip, mainButtonsContainer, 'thien-btn-purple');
            if (showLogin) addButton('Login', showLogin, mainButtonsContainer, 'thien-btn-primary');

            addButton('Super Maker', toggleSuperPanel, mainButtonsContainer, 'thien-btn-warning');
            if (showSettings) addButton('Cài đặt', showSettings, mainButtonsContainer, 'thien-btn-secondary');

            addManagerEventListeners();
            addDuoVipEventListeners();
            addTxtEditorEventListeners();

            const themeToggle = document.getElementById('thien-theme-toggle');
            if (themeToggle) themeToggle.addEventListener('click', () => {
                const newTheme = GM_getValue('thien_theme', 'light') === 'light' ? 'dark' : 'light';
                GM_setValue('thien_theme', newTheme);
                applyTheme();
            });
            const logoutPopupToggle = document.getElementById('logout-popup-toggle');
            if (logoutPopupToggle) logoutPopupToggle.addEventListener('change', (e) => {
                GM_setValue('thien_logout_popup_visible', e.target.checked);
                applyLogoutPopupSetting();
            });
            const logoutPopupCloseBtn = document.getElementById('thien-logout-popup-close');
            if (logoutPopupCloseBtn) logoutPopupCloseBtn.addEventListener('click', () => {
                GM_setValue('thien_logout_popup_visible', false);
                applyLogoutPopupSetting();
            });
            applyTheme();
            applyLogoutPopupSetting();

            let attempts = 0;
            const startupCheck = setInterval(() => {
                if (document.querySelector('a[href^="/profile/"]') || attempts > 20) {
                    clearInterval(startupCheck);
                    if (GM_getValue('thien_autosave_mode', 'automatic') === 'automatic') runAutomaticSaveCheck();
                    updateAccountNameIfNeeded();
                }
                attempts++;
            }, 500);
        };

        const observer = new MutationObserver((mutationsList, observer) => {
             if (!document.getElementById('thien-final-toggle-button')) { buildUI(); }
             if (uiBuilt) { observer.disconnect(); }
        });
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
        buildUI();
    }

    initialize();
})();
