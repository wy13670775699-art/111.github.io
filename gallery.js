const GalleryService = {
    STORAGE_KEY: 'artthink_gallery',
    INTERACTIONS_KEY: 'artthink_gallery_interactions',
    
    // Some hardcoded default works to populate the gallery initially
    defaultWorks: [
        { id: 'g1', title: '阳光下的森林', student: '三年级 晓明', studentColor: 'blue', pinColor: 'red', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
        { id: 'g2', title: '未来的城堡', student: '二年级 悦悦', studentColor: 'pink', pinColor: 'blue', image: 'https://images.unsplash.com/photo-1510312608405-b0ae9f1d07c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', aspect: '1/1' },
        { id: 'g3', title: '午睡的猫咪', student: '一年级 小雨', studentColor: 'blue', pinColor: 'yellow', image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', tall: true },
        { id: 'g4', title: '飞翔的颜色', student: '三年级 浩然', studentColor: 'yellow', pinColor: 'red', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', filter: 'hue-rotate(90deg)' }
    ],

    getGalleryWorks() {
        let sentWorks = localStorage.getItem(this.STORAGE_KEY);
        sentWorks = sentWorks ? JSON.parse(sentWorks) : [];
        
        // combine sent works with default works
        return [...sentWorks, ...this.defaultWorks];
    },

    getInteractions() {
        let stored = localStorage.getItem(this.INTERACTIONS_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    saveInteractions(interactions) {
        localStorage.setItem(this.INTERACTIONS_KEY, JSON.stringify(interactions));
    },

    getInteractionData(workId) {
        const data = this.getInteractions();
        if (!data[workId]) {
            data[workId] = { likes: 0, flowers: 0, hasLiked: false, hasFlowered: false };
        }
        return data[workId];
    },

    like(workId) {
        const interactions = this.getInteractions();
        const data = this.getInteractionData(workId);
        
        if (!data.hasLiked) {
            data.likes++;
            data.hasLiked = true;
            WorkService.showToast('点赞成功！你的鼓励充满了力量');
        } else {
            data.likes--;
            data.hasLiked = false;
        }
        
        interactions[workId] = data;
        this.saveInteractions(interactions);
        this.renderGalleryGrid('gallery-grid');
    },

    flower(workId) {
        const interactions = this.getInteractions();
        const data = this.getInteractionData(workId);
        
        if (!data.hasFlowered) {
            data.flowers++;
            data.hasFlowered = true;
            WorkService.showToast('送花成功！送人鲜花，手有余香');
        } else {
            data.flowers--;
            data.hasFlowered = false;
        }
        
        interactions[workId] = data;
        this.saveInteractions(interactions);
        this.renderGalleryGrid('gallery-grid');
    },

    comment(workId) {
        WorkService.showToast('评价功能已开启，留下你的精彩点评吧！');
    },

    renderGalleryGrid(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const allWorks = this.getGalleryWorks();

        // Split works into 3 columns
        const cols = [[], [], []];
        allWorks.forEach((work, index) => {
            cols[index % 3].push(work);
        });

        const renderCol = (colWorks) => {
            return colWorks.map(work => {
                const intData = this.getInteractionData(work.id);
                const isStudent = !work.studentColor; // Our own works won't have the mocked colors

                const pinColor = work.pinColor || WorkService.getRandomColor();
                const studentLabel = work.student || "三年级 晓明";
                const studentColor = work.studentColor || "green";
                
                const styleAspect = work.aspect ? `aspect-ratio: ${work.aspect};` : '';
                const styleFilter = work.filter ? `filter: ${work.filter};` : '';
                const styleImg = styleAspect || styleFilter ? `style="${styleAspect} ${styleFilter}"` : '';

                const likeIconStyle = intData.hasLiked ? `background: #FFE5EB; color: #FF4081;` : ``;
                const likeTextStyle = intData.hasLiked ? `color: #FF4081;` : ``;
                const likeCountText = intData.likes > 0 ? `点赞(${intData.likes})` : `点赞`;

                const flowerIconStyle = intData.hasFlowered ? `background: #FFF4E5; color: #FF9800;` : ``;
                const flowerTextStyle = intData.hasFlowered ? `color: #FF9800;` : ``;
                const flowerCountText = intData.flowers > 0 ? `送花(${intData.flowers})` : `送花`;

                return `
                <div class="artwork-card ${work.tall ? 'tall' : ''}">
                    <svg class="pin ${pinColor}" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>
                    <img src="${work.image}" alt="${work.title}" class="artwork-img" ${styleImg} onclick="WorkService.showImageModal(this.src)" style="cursor: zoom-in;">
                    <div class="artwork-info">
                        <h3>${work.title}</h3>
                        <span class="student-tag ${studentColor}">${studentLabel}</span>
                    </div>
                    <div class="artwork-actions">
                        <button class="action-btn btn-like" onclick="GalleryService.like('${work.id}')">
                            <div class="action-icon" style="${likeIconStyle}">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            </div>
                            <span style="${likeTextStyle}">${likeCountText}</span>
                        </button>
                        <button class="action-btn btn-flower" onclick="GalleryService.flower('${work.id}')">
                            <div class="action-icon" style="${flowerIconStyle}">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22A10 10 0 1 1 12 2a10 10 0 0 1 0 20zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>
                            </div>
                            <span style="${flowerTextStyle}">${flowerCountText}</span>
                        </button>
                        <button class="action-btn btn-comment" onclick="GalleryService.comment('${work.id}')">
                            <div class="action-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                            </div>
                            <span>评价</span>
                        </button>
                    </div>
                </div>`;
            }).join('');
        };

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:40px;">${renderCol(cols[0])}</div>
            <div style="display:flex; flex-direction:column; gap:40px;">${renderCol(cols[1])}</div>
            <div style="display:flex; flex-direction:column; gap:40px;">${renderCol(cols[2])}</div>
        `;
    }
};
