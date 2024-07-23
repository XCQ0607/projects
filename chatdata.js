// ==UserScript==
// @name New Header Modifier
// @namespace http://tampermonkey.net/
// @version 1.0
// @description Modify request headers for a specific website
// @author 逆向达人  XCQ(修改)
// @match https://chat.chatdata.online/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    let authValue = '';
    let deviceIdValue = '';
    let userSystemValue = '';

    // 工具类：生成随机值
    class RandomHeaderGenerator {
        static generateDeviceId() {
            return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        }

        static generateUserSystem() {
            const systemInfo = {
                core_product: "chrome",
                core_version: "126",
                version: "126",
                os_type: "pc",
                os: "win32",
                os_version: "10.0"
            };
            return btoa(JSON.stringify(systemInfo));
        }
    }

    function isTargetUrl(url) {
        return url.includes('/api/v2.0/chat/');
    }

    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        open.apply(this, arguments);
    };

    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        if (isTargetUrl(this._url)) {
            this.setRequestHeader('Authorization', authValue);
            this.setRequestHeader('Oai-Device-Id', deviceIdValue);
            this.setRequestHeader('User-System', userSystemValue);
        }
        send.apply(this, arguments);
    };

    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        let url = typeof input === 'string' ? input : input.url;
        if (isTargetUrl(url)) {
            if (!init) init = {};
            if (!init.headers) init.headers = {};
            init.headers['Authorization'] = authValue;
            init.headers['Oai-Device-Id'] = deviceIdValue;
            init.headers['User-System'] = userSystemValue;
        }
        return originalFetch(input, init);
    };

    // 弹出确认或取消弹窗来更新请求头值
    async function confirmHeaderUpdate() {
        try {
            const newDeviceId = RandomHeaderGenerator.generateDeviceId();
            const newUserSystem = RandomHeaderGenerator.generateUserSystem();

            const response = await fetch('https://chat.chatdata.online/api/v2.0/user/guest', {
                method: 'POST',
                headers: {
                    'Oai-Device-Id': newDeviceId,
                    'User-System': newUserSystem
                }
            });

            if (response.ok) {
                const data = await response.json();
                authValue = `Bearer ${data.token}`;
                deviceIdValue = newDeviceId;
                userSystemValue = newUserSystem;
                alert('请求头值已更新');
            } else {
                alert('获取新的 Authorization 值失败');
            }
        } catch (error) {
            console.error('Error fetching new header values:', error);
            alert('获取新的请求头值失败');
        }
    }

    // 在页面加载时直接调用确认或取消弹窗来更新请求头值
    window.addEventListener('load', function() {
        if (confirm('是否要更新请求头值？')) {
            confirmHeaderUpdate();
        } else {
            alert('未更新请求头值');
        }
    });

})();
