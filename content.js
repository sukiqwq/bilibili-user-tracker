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
        const fansEl = document.querySelector('.nav-statistics__item-num');

        return {
            username: usernameEl ? usernameEl.textContent.trim() : '未知用户',
            fans: fansEl ? fansEl.textContent.trim() : '0',
            fanTitle: fansEl ? fansEl.getAttribute('title') : '', // 完整粉丝数（如2,163,722）
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

        return new Promise((resolve) => {
            chrome.storage.local.set({[`user_${uid}`]: existingUser}, resolve);
        });
    }

    showUserHistory(existingUser, currentInfo) {
        const historyText = `
🔍 找到记录的用户！

UID: ${existingUser.uid}
历史用户名: ${existingUser.usernames.join(' → ')}
当前用户名: ${currentInfo.username}
首次记录: ${existingUser.firstSeen}
上次出现: ${existingUser.lastSeen}
粉丝数: ${existingUser.fans} ${existingUser.fanTitle ? `(${existingUser.fanTitle})` : ''}
${existingUser.notes ? `备注: ${existingUser.notes}` : ''}
        `.trim();

        this.showModal(historyText, '用户历史记录');
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
        if (!title.includes('历史记录') && !title.includes('调试信息')) {
            setTimeout(() => {
                if (modal.parentNode) modal.remove();
            }, 3000);
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
                    debugText += `• ${currentName} (${user.uid})\n`;
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