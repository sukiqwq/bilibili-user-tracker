// B站用户记录插件 - 内容脚本

class BilibiliUserTracker {
    constructor() {
        this.init();
    }

    async init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTracker());
        } else {
            this.setupTracker();
        }
    }

    async setupTracker() {
        // 检查是否为用户空间页面
        const uid = this.extractUID();
        if (!uid) return;

        // 等待用户信息加载
        setTimeout(() => this.addTrackerButton(uid), 2000);
    }

    extractUID() {
        // 从URL提取UID
        const match = window.location.href.match(/space\.bilibili\.com\/(\d+)/);
        return match ? match[1] : null;
    }

    getUserInfo() {
        // 获取页面上的用户信息
        const usernameEl = document.querySelector('.nickname');
        
        // 正确获取粉丝数 - 查找包含"粉丝数"文本的元素
        let fansEl = null;
        const statsItems = document.querySelectorAll('.nav-statistics__item');
        
        for (const item of statsItems) {
            const textEl = item.querySelector('.nav-statistics__item-text');
            if (textEl && textEl.textContent.includes('粉丝数')) {
                fansEl = item.querySelector('.nav-statistics__item-num');
                break;
            }
        }

        return {
            username: usernameEl ? usernameEl.textContent.trim() : '未知用户',
            fans: fansEl ? fansEl.textContent.trim() : '0',
            fanTitle: fansEl ? fansEl.getAttribute('title') : '', // 完整粉丝数
            recordTime: new Date().toLocaleString()
        };
    }

    addTrackerButton(uid) {
        // 避免重复添加
        if (document.getElementById('user-tracker-btn')) return;

        // 查找.interactions容器
        const interactionsEl = document.querySelector('.interactions');
        
        if (!interactionsEl) {
            console.log('未找到.interactions容器，尝试其他位置');
            // 备用位置
            const fallbackEl = document.querySelector('.h-action') || 
                              document.querySelector('.user-info') ||
                              document.querySelector('.space-info');
            if (fallbackEl) {
                this.insertButtonToFallback(fallbackEl, uid);
            }
            return;
        }

        // 创建下拉菜单容器
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'user-tracker-dropdown';
        dropdownContainer.setAttribute('data-v-1d6394a2', '');

        // 主按钮
        const mainButton = document.createElement('button');
        mainButton.id = 'user-tracker-btn';
        mainButton.className = 'user-tracker-button';
        mainButton.setAttribute('data-v-1d6394a2', '');
        mainButton.innerHTML = `
            <i class="vui_icon sic-BDC-bookmark_line" style="font-size: 16px; margin-right: 4px;"></i>
            记录用户
            <i class="vui_icon sic-BDC-arrow_down_line dropdown-arrow" style="font-size: 12px; margin-left: 4px;"></i>
        `;

        // 下拉菜单
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'user-tracker-menu';
        dropdownMenu.innerHTML = `
            <div class="menu-item" data-action="record">
                <i class="vui_icon sic-BDC-bookmark_line" style="font-size: 14px; margin-right: 6px;"></i>
                记录用户
            </div>
            <div class="menu-item" data-action="nickname">
                <i class="vui_icon sic-BDC-edit_line" style="font-size: 14px; margin-right: 6px;"></i>
                设置昵称
            </div>
            <div class="menu-item" data-action="debug">
                <i class="vui_icon sic-BDC-code_line" style="font-size: 14px; margin-right: 6px;"></i>
                调试信息
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item menu-item-danger" data-action="clear">
                <i class="vui_icon sic-BDC-delete_line" style="font-size: 14px; margin-right: 6px;"></i>
                清空数据
            </div>
        `;

        // 组装下拉容器
        dropdownContainer.appendChild(mainButton);
        dropdownContainer.appendChild(dropdownMenu);

        // 绑定事件
        this.bindDropdownEvents(dropdownContainer, uid);

        // 插入到页面
        const messageBtn = interactionsEl.querySelector('.message-btn');
        const moreActions = interactionsEl.querySelector('.more-actions');
        
        if (messageBtn && moreActions) {
            interactionsEl.insertBefore(dropdownContainer, moreActions);
        } else {
            interactionsEl.appendChild(dropdownContainer);
        }

        console.log(`已添加记录按钮下拉菜单 - UID: ${uid}`);
    }

    bindDropdownEvents(container, uid) {
        const button = container.querySelector('.user-tracker-button');
        const menu = container.querySelector('.user-tracker-menu');
        const menuItems = container.querySelectorAll('.menu-item');

        // 点击主按钮切换菜单显示
        button.onclick = (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains('show');
            
            // 关闭其他下拉菜单
            document.querySelectorAll('.user-tracker-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
            
            menu.classList.toggle('show', !isOpen);
        };

        // 菜单项点击事件
        menuItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                
                menu.classList.remove('show');
                
                switch (action) {
                    case 'record':
                        this.handleUserRecord(uid);
                        break;
                    case 'nickname':
                        this.handleNicknameSet(uid);
                        break;
                    case 'debug':
                        this.showDebugInfo();
                        break;
                    case 'clear':
                        this.clearAllData();
                        break;
                }
            };
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', () => {
            menu.classList.remove('show');
        });

        // 阻止菜单内部点击冒泡
        menu.onclick = (e) => e.stopPropagation();
    }

    insertButtonToFallback(targetEl, uid) {
        // 为备用位置创建简化版按钮（只有记录功能）
        const button = document.createElement('button');
        button.id = 'user-tracker-btn';
        button.className = 'user-tracker-button';
        button.innerHTML = `
            <i class="vui_icon sic-BDC-bookmark_line" style="font-size: 16px; margin-right: 4px;"></i>
            记录用户
        `;
        button.onclick = () => this.handleUserRecord(uid);
        targetEl.appendChild(button);
        console.log(`已添加记录按钮到备用位置 - UID: ${uid}`);
    }

    async handleUserRecord(uid) {
        try {
            const userInfo = this.getUserInfo();
            const existingUser = await this.getUserFromDB(uid);

            if (existingUser) {
                // 用户已存在，显示历史信息
                this.showUserHistory(existingUser, userInfo);
                // 更新最后出现时间和当前用户名
                await this.updateUser(uid, userInfo);
            } else {
                // 新用户，保存到数据库
                await this.saveUser(uid, userInfo);
                this.showSaveSuccess(userInfo);
            }
        } catch (error) {
            console.error('处理用户记录时出错:', error);
            this.showError('操作失败，请重试');
        }
    }

    async getUserFromDB(uid) {
        return new Promise((resolve) => {
            chrome.storage.local.get([`user_${uid}`], (result) => {
                resolve(result[`user_${uid}`] || null);
            });
        });
    }

    async saveUser(uid, userInfo) {
        const userData = {
            uid: uid,
            usernames: [userInfo.username],
            nickname: '', // 固化昵称，初始为空
            firstSeen: userInfo.recordTime,
            lastSeen: userInfo.recordTime,
            fans: userInfo.fans,
            fanTitle: userInfo.fanTitle, // 保存完整粉丝数
            notes: ''
        };

        return new Promise((resolve) => {
            chrome.storage.local.set({[`user_${uid}`]: userData}, resolve);
        });
    }

    async updateUser(uid, currentInfo) {
        const existingUser = await this.getUserFromDB(uid);
        if (!existingUser) return;

        // 更新用户名历史（如果是新用户名）
        if (!existingUser.usernames.includes(currentInfo.username)) {
            existingUser.usernames.push(currentInfo.username);
        }

        existingUser.lastSeen = currentInfo.recordTime;
        existingUser.fans = currentInfo.fans;
        existingUser.fanTitle = currentInfo.fanTitle;

        // 保持原有的固化昵称不变
        if (!existingUser.hasOwnProperty('nickname')) {
            existingUser.nickname = '';
        }

        return new Promise((resolve) => {
            chrome.storage.local.set({[`user_${uid}`]: existingUser}, resolve);
        });
    }

    showUserHistory(existingUser, currentInfo) {
        const displayName = existingUser.nickname || existingUser.usernames[existingUser.usernames.length - 1];
        const nicknameInfo = existingUser.nickname ? `固化昵称: ${existingUser.nickname}` : '无固化昵称';
        
        const historyText = `
🔍 找到记录的用户！

${nicknameInfo}
UID: ${existingUser.uid}
历史用户名: ${existingUser.usernames.join(' → ')}
当前用户名: ${currentInfo.username}
首次记录: ${existingUser.firstSeen}
上次出现: ${existingUser.lastSeen}
粉丝数: ${existingUser.fans} ${existingUser.fanTitle ? `(${existingUser.fanTitle})` : ''}
${existingUser.notes ? `备注: ${existingUser.notes}` : ''}
        `.trim();

        this.showModal(historyText, `用户历史记录 - ${displayName}`);
    }

    showSaveSuccess(userInfo) {
        const successText = `
✅ 用户已保存！

用户名: ${userInfo.username}
记录时间: ${userInfo.recordTime}
粉丝数: ${userInfo.fans} ${userInfo.fanTitle ? `(${userInfo.fanTitle})` : ''}
        `.trim();

        this.showModal(successText, '保存成功');
    }

    showError(message) {
        this.showModal(`❌ ${message}`, '错误');
    }

    showModal(content, title) {
        // 移除现有modal
        const existingModal = document.getElementById('user-tracker-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建modal
        const modal = document.createElement('div');
        modal.id = 'user-tracker-modal';
        modal.className = 'user-tracker-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <pre>${content}</pre>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 绑定关闭事件
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // 3秒后自动关闭（除非是历史记录或调试信息）
        if (!title.includes('历史记录') && !title.includes('调试信息') && !title.includes('设置昵称')) {
            setTimeout(() => {
                if (modal.parentNode) modal.remove();
            }, 3000);
        }
    }

    async handleNicknameSet(uid) {
        try {
            const userInfo = this.getUserInfo();
            const existingUser = await this.getUserFromDB(uid);

            if (!existingUser) {
                // 如果用户不存在，先保存用户信息
                await this.saveUser(uid, userInfo);
                this.showNicknameInput(uid, userInfo.username, '');
            } else {
                // 用户已存在，显示设置昵称界面
                const currentNickname = existingUser.nickname || '';
                const displayName = existingUser.usernames[existingUser.usernames.length - 1];
                this.showNicknameInput(uid, displayName, currentNickname);
            }
        } catch (error) {
            console.error('处理昵称设置时出错:', error);
            this.showError('操作失败，请重试');
        }
    }

    showNicknameInput(uid, username, currentNickname) {
        // 移除现有modal
        const existingModal = document.getElementById('user-tracker-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建昵称设置modal
        const modal = document.createElement('div');
        modal.id = 'user-tracker-modal';
        modal.className = 'user-tracker-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💭 设置固化昵称</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="nickname-form">
                        <p><strong>用户：</strong>${username}</p>
                        <p><strong>UID：</strong>${uid}</p>
                        <br>
                        <label for="nickname-input">固化昵称：</label>
                        <input type="text" id="nickname-input" value="${currentNickname}" 
                               placeholder="输入专属昵称，留空则不设置" maxlength="20">
                        <br>
                        <p class="help-text">💡 固化昵称不会随用户改名而变化，方便识别老观众</p>
                        <div class="button-group">
                            <button class="save-btn" id="save-nickname">保存</button>
                            <button class="cancel-btn" id="cancel-nickname">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 获取输入框并聚焦
        const input = modal.querySelector('#nickname-input');
        input.focus();
        input.select();

        // 绑定事件
        const closeBtn = modal.querySelector('.close');
        const saveBtn = modal.querySelector('#save-nickname');
        const cancelBtn = modal.querySelector('#cancel-nickname');

        const closeModal = () => modal.remove();

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // 保存昵称
        saveBtn.onclick = async () => {
            const nickname = input.value.trim();
            await this.saveNickname(uid, nickname);
            closeModal();
        };

        // 回车保存
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        };
    }

    async saveNickname(uid, nickname) {
        try {
            const existingUser = await this.getUserFromDB(uid);
            if (!existingUser) {
                this.showError('用户数据不存在');
                return;
            }

            existingUser.nickname = nickname;
            
            await new Promise((resolve) => {
                chrome.storage.local.set({[`user_${uid}`]: existingUser}, resolve);
            });

            const displayName = nickname || existingUser.usernames[existingUser.usernames.length - 1];
            
            if (nickname) {
                this.showModal(`✅ 昵称设置成功！\n\n固化昵称: ${nickname}\n\n现在无论用户如何改名，都会显示这个昵称。`, '设置成功');
            } else {
                this.showModal(`✅ 昵称已清除！\n\n已移除固化昵称，将显示用户的真实用户名。`, '设置成功');
            }

            console.log(`昵称已更新: UID ${uid} -> "${nickname}"`);
            
        } catch (error) {
            console.error('保存昵称失败:', error);
            this.showError('保存昵称失败，请重试');
        }
    }

    async showDebugInfo() {
        try {
            const allData = await new Promise((resolve) => {
                chrome.storage.local.get(null, resolve);
            });

            const userKeys = Object.keys(allData).filter(key => key.startsWith('user_'));
            
            let debugText = `📊 调试信息\n\n`;
            debugText += `已记录用户数量: ${userKeys.length}\n\n`;
            
            if (userKeys.length > 0) {
                debugText += `用户列表:\n`;
                userKeys.forEach(key => {
                    const user = allData[key];
                    const currentName = user.usernames[user.usernames.length - 1];
                    const displayName = user.nickname || currentName;
                    
                    debugText += `• ${displayName} (${user.uid})\n`;
                    if (user.nickname) {
                        debugText += `  固化昵称: ${user.nickname}\n`;
                    }
                    debugText += `  历史名: ${user.usernames.join(' → ')}\n`;
                    debugText += `  粉丝: ${user.fans}\n`;
                    debugText += `  最后出现: ${user.lastSeen}\n\n`;
                });

                // 存储使用情况
                const bytesUsed = await new Promise((resolve) => {
                    chrome.storage.local.getBytesInUse(null, resolve);
                });
                debugText += `\n存储使用: ${bytesUsed} 字节 (${(bytesUsed/1024).toFixed(2)} KB)`;
            } else {
                debugText += `暂无用户数据\n\n`;
                debugText += `操作建议:\n`;
                debugText += `1. 点击"记录用户"按钮保存当前用户\n`;
                debugText += `2. 访问其他用户空间页面进行记录`;
            }

            this.showModal(debugText, '调试信息');
            
            // 同时在控制台输出详细数据
            console.log('=== B站用户记录插件调试信息 ===');
            console.log('用户数量:', userKeys.length);
            console.log('详细数据:', allData);
            
        } catch (error) {
            console.error('获取调试信息失败:', error);
            this.showError('获取调试信息失败');
        }
    }

    // 清除所有数据的方法
    async clearAllData() {
        if (!confirm('确定要清除所有用户数据吗？\n\n此操作不可撤销！已记录的所有用户信息将被永久删除。')) {
            return;
        }

        try {
            await new Promise((resolve) => {
                chrome.storage.local.clear(resolve);
            });
            
            this.showModal('✅ 所有数据已清除\n\n所有用户记录已被删除。', '操作成功');
            console.log('所有用户数据已清除');
            
        } catch (error) {
            console.error('清除数据失败:', error);
            this.showError('清除数据失败，请重试');
        }
    }
}

// 初始化插件
const bilibiliTracker = new BilibiliUserTracker();

// 将实例暴露到全局，供调试使用
window.bilibiliTracker = bilibiliTracker;