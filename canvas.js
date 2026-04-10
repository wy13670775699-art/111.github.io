document.addEventListener('DOMContentLoaded', () => {
    // --- Layer & Canvas Setup ---
    const graffitiCanvas = document.getElementById('drawing-canvas');
    const photoLayerHtml = document.getElementById('photo-layer-html');
    const bgCanvas = document.getElementById('bg-layer');
    if (!graffitiCanvas) return;

    const gCtx = graffitiCanvas.getContext('2d');
    const bCtx = bgCanvas.getContext('2d');

    function resizeAll() {
        const container = graffitiCanvas.parentElement;
        const w = container.clientWidth;
        const h = container.clientHeight;

        [graffitiCanvas, bgCanvas].forEach(el => {
            el.width = w;
            el.height = h;
        });

        gCtx.lineCap = 'round';
        gCtx.lineJoin = 'round';

        // Initial Background
        bCtx.fillStyle = '#ffffff';
        bCtx.fillRect(0, 0, w, h);
    }

    window.addEventListener('resize', resizeAll);
    resizeAll();

    // --- Drawing State ---
    let isDrawing = false;
    let currentX = 0;
    let currentY = 0;
    let currentBrush = 'crayon';
    let currentColor = '#005086';
    let colorHistory = ['#005086', '#FF4081', '#FFD400', '#4CAF50', '#000000', '#FFFFFF'];

    const brushSettings = {
        pencil: { width: 3, alpha: 0.8 },
        crayon: { width: 12, alpha: 0.5 },
        marker: { width: 22, alpha: 0.2 },
        eraser: { width: 35, alpha: 1 }
    };

    // --- Undo System ---
    let undoStack = [];
    const MAX_UNDO = 20;

    window.saveUndoState = function () {
        if (undoStack.length >= MAX_UNDO) undoStack.shift();
        undoStack.push(gCtx.getImageData(0, 0, graffitiCanvas.width, graffitiCanvas.height));
    }

    window.saveUndoState();

    window.undo = function () {
        if (undoStack.length > 1) {
            undoStack.pop();
            const previousState = undoStack[undoStack.length - 1];
            gCtx.putImageData(previousState, 0, 0);
        }
    };

    // --- Drawing Logic ---
    let lastStampX = 0;
    let lastStampY = 0;

    function startDrawing(e) {
        if (graffitiCanvas.style.display === 'none') return;
        isDrawing = true;
        const pos = getMousePos(graffitiCanvas, e);
        currentX = pos.x;
        currentY = pos.y;
        lastStampX = pos.x; // Force first stamp
        lastStampY = pos.y;
        
        if (['leaf', 'branch', 'dirt', 'mushroom', 'vine', 'ice'].includes(currentBrush)) {
            draw(e); // Draw immediately on touch/click
        }
    }

    window.setBrush = function(b) {
        currentBrush = b;
    };

    function draw(e) {
        if (!isDrawing) return;
        const pos = getMousePos(graffitiCanvas, e);
        if (currentBrush === 'crayon') {
            drawCrayon(currentX, currentY, pos.x, pos.y);
        } else if (currentBrush === 'leaf') {
            drawLeaf(currentX, currentY, pos.x, pos.y);
        } else if (currentBrush === 'branch') {
            drawBranch(currentX, currentY, pos.x, pos.y);
        } else if (currentBrush === 'dirt') {
            drawDirt(currentX, currentY, pos.x, pos.y);
        } else if (currentBrush === 'mushroom') {
            drawMushroom(currentX, currentY, pos.x, pos.y);
        } else if (currentBrush === 'vine') {
            drawVine(currentX, currentY, pos.x, pos.y);
        } else if (currentBrush === 'ice') {
            drawIce(currentX, currentY, pos.x, pos.y);
        } else {
            drawStandard(currentX, currentY, pos.x, pos.y);
        }
        currentX = pos.x;
        currentY = pos.y;
    }

    function drawStandard(x1, y1, x2, y2) {
        if (currentBrush === 'eraser') {
            gCtx.globalCompositeOperation = 'destination-out';
            gCtx.globalAlpha = 1;
            gCtx.lineWidth = brushSettings.eraser.width;
        } else {
            gCtx.globalCompositeOperation = 'source-over';
            gCtx.globalAlpha = brushSettings[currentBrush]?.alpha || 1;
            gCtx.lineWidth = brushSettings[currentBrush]?.width || 5;
            gCtx.strokeStyle = currentColor;
        }
        gCtx.beginPath();
        gCtx.moveTo(x1, y1);
        gCtx.lineTo(x2, y2);
        gCtx.stroke();
        gCtx.globalCompositeOperation = 'source-over';
    }

    function drawCrayon(x1, y1, x2, y2) {
        gCtx.globalAlpha = brushSettings.crayon.alpha;
        gCtx.fillStyle = currentColor;
        const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1);
        for (let i = 0; i < dist; i += 1.5) {
            const x = x1 + Math.cos(angle) * i;
            const y = y1 + Math.sin(angle) * i;
            for (let j = 0; j < 4; j++) {
                const offsetX = (Math.random() - 0.5) * 12;
                const offsetY = (Math.random() - 0.5) * 12;
                gCtx.beginPath();
                gCtx.arc(x + offsetX, y + offsetY, Math.random() * 1.5, 0, Math.PI * 2);
                gCtx.fill();
            }
        }
    }

    /* --- Nature Brushes Logic (Emoji Stickers) --- */
    window.customBrushSize = 35;
    window.customBrushSpacing = 30;
    window.customBrushRandomRot = true;

    function drawEmojiSticker(x, y, emoji, spacing, size, randomRot = true) {
        const dist = Math.sqrt(Math.pow(x - lastStampX, 2) + Math.pow(y - lastStampY, 2));
        
        // Stamp if we moved far enough, or if it is exactly the same spot (happens on mousedown)
        if (dist >= spacing || (lastStampX === x && lastStampY === y && isDrawing)) {
            gCtx.save();
            gCtx.translate(x, y);
            if (randomRot) {
                // If random rotation is requested, calculate random angle
                gCtx.rotate((Math.random() - 0.5) * Math.PI * 2);
            } else {
                // If directional rotation is requested (not random), point character towards stroke direction
                let angle = Math.atan2(y - lastStampY, x - lastStampX);
                // default upright orientation when not moving much
                if (lastStampX === x && lastStampY === y) angle = -Math.PI/2; 
                // Emojis point "up" usually, so drawing them aligned to path might need + 90deg offset
                gCtx.rotate(angle + Math.PI/2);
            }
            gCtx.font = `${size}px Arial`;
            gCtx.textAlign = 'center';
            gCtx.textBaseline = 'middle';
            gCtx.globalAlpha = 1;
            gCtx.fillText(emoji, 0, 0);
            gCtx.restore();
            
            lastStampX = x;
            lastStampY = y;
        }
    }

    function drawLeaf(x1, y1, x2, y2) {
        const leaves = ['🍃', '🍂', '🌿'];
        const emoji = leaves[Math.floor(Math.random() * leaves.length)];
        drawEmojiSticker(x2, y2, emoji, window.customBrushSpacing, window.customBrushSize, window.customBrushRandomRot);
    }

    function drawBranch(x1, y1, x2, y2) {
        drawEmojiSticker(x2, y2, '🪵', window.customBrushSpacing, window.customBrushSize, window.customBrushRandomRot);
    }

    function drawDirt(x1, y1, x2, y2) {
        const dirts = ['🪨', '🌰', '🤎'];
        const emoji = dirts[Math.floor(Math.random() * dirts.length)];
        drawEmojiSticker(x2, y2, emoji, window.customBrushSpacing, window.customBrushSize, window.customBrushRandomRot);
    }

    function drawMushroom(x1, y1, x2, y2) {
        drawEmojiSticker(x2, y2, '🍄', window.customBrushSpacing, window.customBrushSize, window.customBrushRandomRot);
    }

    function drawVine(x1, y1, x2, y2) {
        // Changed to leafy vine as requested
        drawEmojiSticker(x2, y2, '🌿', window.customBrushSpacing, window.customBrushSize, window.customBrushRandomRot);
    }

    function drawIce(x1, y1, x2, y2) {
        drawEmojiSticker(x2, y2, '🧊', window.customBrushSpacing, window.customBrushSize, window.customBrushRandomRot);
    }

    function stopDrawing() {
        if (isDrawing) saveUndoState();
        isDrawing = false;
        gCtx.globalAlpha = 1;
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        if (evt.touches && evt.touches.length > 0) {
            return { x: evt.touches[0].clientX - rect.left, y: evt.touches[0].clientY - rect.top };
        }
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    graffitiCanvas.addEventListener('mousedown', startDrawing);
    graffitiCanvas.addEventListener('mousemove', draw);
    graffitiCanvas.addEventListener('mouseup', stopDrawing);
    graffitiCanvas.addEventListener('mouseout', stopDrawing);

    // --- Dual Tab Treasure Box ---
    const listPersonal = document.getElementById('asset-list-personal');
    const listTask = document.getElementById('asset-list-task');
    const syncNotif = document.getElementById('sync-notification');
    const canvasContainer = document.getElementById('main-canvas-container');
    const treasureSidebar = document.getElementById('treasure-sidebar');

    // Tab Switching Logic
    const tabPersonalBtn = document.getElementById('tab-personal');
    const tabTaskBtn = document.getElementById('tab-task');
    const uploadHint = document.getElementById('upload-hint');
    const fileUploadBtn = document.getElementById('file-upload');

    tabPersonalBtn.addEventListener('click', () => {
        tabPersonalBtn.classList.add('active');
        tabTaskBtn.classList.remove('active');
        listPersonal.style.display = 'flex';
        listTask.style.display = 'none';
        uploadHint.style.display = 'inline';
    });

    tabTaskBtn.addEventListener('click', () => {
        tabTaskBtn.classList.add('active');
        tabPersonalBtn.classList.remove('active');
        listTask.style.display = 'flex';
        listPersonal.style.display = 'none';
        uploadHint.style.display = 'none'; // No upload in task tab currently
    });

    window.handleFileUpload = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                MaterialService.addMaterial(e.target.result);
                addPhotoToSidebar(e.target.result, listPersonal, 'new-photo');
                syncNotif.style.display = 'block';
                setTimeout(() => syncNotif.style.display = 'none', 3000);
            };
            reader.readAsDataURL(file);
        }
    };

    function addPhotoToSidebar(imgUrl, container, type) {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail';
        thumb.style.touchAction = 'none'; 
        thumb.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; border-radius:12px; object-fit:cover; pointer-events:none;">`;
        
        setupDraggable(thumb, type, { src: imgUrl });
        container.prepend(thumb);
    }

    // Load photos from Material Library
    const initialPhotos = MaterialService.getMaterials();
    initialPhotos.forEach(url => addPhotoToSidebar(url, listPersonal, 'new-photo'));

    // Load Task Photos
    const taskPhotos = [
        typeof TASK1_B64 !== 'undefined' ? TASK1_B64 : '照片素材/task1.jpg',
        typeof TASK2_B64 !== 'undefined' ? TASK2_B64 : '照片素材/task2.jpg',
        typeof TASK3_B64 !== 'undefined' ? TASK3_B64 : '照片素材/task3.jpg',
        '照片素材/悬索桥.jpg',
        '照片素材/拱桥.jpg',
        '照片素材/斜拉桥.jpg',
        '照片素材/梁桥.jpg',
        '照片素材/校园地图.jpg'
    ];
    taskPhotos.forEach(url => addPhotoToSidebar(url, listTask, 'task-photo'));

    // --- Custom Touch/Mouse Drag System ---
    let activeDrag = null; 

    function setupDraggable(el, type, dataFn) {
        el.addEventListener('pointerdown', (e) => {
            if(e.button !== 0 && e.type !== 'touchstart' && e.pointerType !== 'touch') return;
            e.preventDefault();
            const data = typeof dataFn === 'function' ? dataFn() : dataFn;
            startDrag(e, type, data, el);
        });
    }

    function createPolaroid(src, x, y) {
        const id = 'photo-' + Date.now();
        const frame = document.createElement('div');
        frame.id = id;
        frame.className = 'polaroid-frame';
        frame.style.position = 'absolute';
        frame.style.left = (x - 31) + 'px'; 
        frame.style.top = (y - 31) + 'px';
        frame.style.transform = `rotate(${(Math.random() - 0.5) * 10}deg)`;
        frame.style.touchAction = 'none';

        frame.innerHTML = `<img src="${src}" style="width: 150px; height: 150px; pointer-events:none; border-radius:4px; object-fit: cover;">`;
        photoLayerHtml.appendChild(frame);

        setupDraggable(frame, 'existing-polaroid', () => ({ id: frame.id }));
    }

    let currentBgImage = null;
    window.currentBgOpacity = 1.0;

    window.drawBackgroundWithOpacity = function(img, opacity) {
        bCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bCtx.fillStyle = '#ffffff';
        bCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        if (img) {
            bCtx.globalAlpha = opacity;
            const scale = Math.min(bgCanvas.width / img.width, bgCanvas.height / img.height);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const dx = (bgCanvas.width - drawWidth) / 2;
            const dy = (bgCanvas.height - drawHeight) / 2;
            
            bCtx.drawImage(img, dx, dy, drawWidth, drawHeight);
            bCtx.globalAlpha = 1.0;
        }
    };

    window.setBgOpacity = function(val) {
        window.currentBgOpacity = val / 100;
        if (document.getElementById('bg-opacity-val')) {
            document.getElementById('bg-opacity-val').innerText = val + '%';
        }
        window.drawBackgroundWithOpacity(currentBgImage, window.currentBgOpacity);
    };

    function setCanvasBackground(src, skipConfirm = false) {
        const applyBackground = () => {
            const img = new Image();
            img.onload = () => {
                currentBgImage = img;
                window.drawBackgroundWithOpacity(currentBgImage, window.currentBgOpacity);
            };
            img.src = src;
        };

        if (skipConfirm) {
            applyBackground();
        } else {
            WorkService.showConfirmModal("是否替换画板底图？", applyBackground);
        }
    }

    // Exported for bottom delete button
    window.clearBackground = function() {
        WorkService.showConfirmModal("确定要删除当前置入的背景图吗？", () => {
            currentBgImage = null;
            window.drawBackgroundWithOpacity(null, 1.0);
        }, true);
    };

    function startDrag(e, type, data, sourceElement) {
        activeDrag = {
            type,
            data,
            sourceElement,
            hasMoved: false,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: 0,
            offsetY: 0,
            ghost: null
        };
        
        const rect = sourceElement.getBoundingClientRect();
        activeDrag.offsetX = e.clientX - rect.left;
        activeDrag.offsetY = e.clientY - rect.top;

        document.addEventListener('pointermove', onDragMove, {passive: false});
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
    }

    function onDragMove(e) {
        if (!activeDrag) return;
        e.preventDefault(); 
        
        if (!activeDrag.hasMoved) {
            const dist = Math.hypot(e.clientX - activeDrag.startX, e.clientY - activeDrag.startY);
            if (dist > 5) {
                activeDrag.hasMoved = true;
                
                if (activeDrag.type === 'existing-polaroid') {
                    activeDrag.sourceElement.style.opacity = '0.5';
                    activeDrag.ghost = activeDrag.sourceElement.cloneNode(true);
                    activeDrag.ghost.style.opacity = '0.8';
                    activeDrag.ghost.style.transform = activeDrag.sourceElement.style.transform + ' scale(1.05)';
                } else {
                    activeDrag.ghost = activeDrag.sourceElement.cloneNode(true);
                    activeDrag.ghost.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                }
                
                activeDrag.ghost.style.position = 'fixed';
                activeDrag.ghost.style.zIndex = '99999';
                activeDrag.ghost.style.pointerEvents = 'none';
                activeDrag.ghost.style.margin = '0'; 
                document.body.appendChild(activeDrag.ghost);
            }
        }

        if (activeDrag.hasMoved && activeDrag.ghost) {
            activeDrag.ghost.style.left = (e.clientX - activeDrag.offsetX) + 'px';
            activeDrag.ghost.style.top = (e.clientY - activeDrag.offsetY) + 'px';
        }
    }

    function onDragEnd(e) {
        if (!activeDrag) return;

        if (activeDrag.hasMoved && activeDrag.ghost && activeDrag.ghost.parentNode) {
            activeDrag.ghost.remove();
        }

        if (activeDrag.type === 'existing-polaroid') {
            activeDrag.sourceElement.style.opacity = '1';
        }

        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);

        if (activeDrag.hasMoved) {
            const containerRect = canvasContainer.getBoundingClientRect();
            const sidebarRect = treasureSidebar.getBoundingClientRect();
            
            const dropX = e.clientX;
            const dropY = e.clientY;

            // Dropped on canvas
            if (dropX >= containerRect.left && dropX <= containerRect.right && 
                dropY >= containerRect.top && dropY <= containerRect.bottom) {
                
                if (activeDrag.type === 'new-photo' || activeDrag.type === 'task-photo') {
                    const canvasX = dropX - containerRect.left;
                    const canvasY = dropY - containerRect.top;
                    const assetSrc = activeDrag.data.src;
                    
                    WorkService.showChoiceModal(
                        "你想怎么使用这张照片？",
                        "做成照片贴纸", () => createPolaroid(assetSrc, canvasX, canvasY),
                        "设为画板底图", () => setCanvasBackground(assetSrc, true)
                    );
                } else if (activeDrag.type === 'existing-polaroid') {
                    const canvasX = dropX - containerRect.left - activeDrag.offsetX;
                    const canvasY = dropY - containerRect.top - activeDrag.offsetY;
                    activeDrag.sourceElement.style.left = canvasX + 'px';
                    activeDrag.sourceElement.style.top = canvasY + 'px';
                }
            } 
            // Dropped on sidebar (Delete)
            else if (dropX >= sidebarRect.left && dropX <= sidebarRect.right && 
                     dropY >= sidebarRect.top && dropY <= sidebarRect.bottom) {
                
                if (activeDrag.type === 'existing-polaroid') {
                    activeDrag.sourceElement.classList.add('removing');
                    setTimeout(() => {
                        if (activeDrag.sourceElement.parentNode) {
                            activeDrag.sourceElement.remove();
                        }
                    }, 200);
                }
            }
        }

        activeDrag = null;
    }

    // --- Layer Controls ---
    window.toggleLayer = function (layerId) {
        const el = document.getElementById(layerId === 'graffiti' ? 'drawing-canvas' : layerId === 'bg' ? 'bg-layer' : 'photo-layer-html');
        const row = document.querySelector(`.layer-row[data-layer="${layerId}"]`);
        if (el.style.display === 'none') {
            el.style.display = 'block';
            row.classList.remove('hidden');
        } else {
            el.style.display = 'none';
            row.classList.add('hidden');
        }
    };

    // Tool Buttons
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('undo-btn')) { window.undo(); return; }
            const tool = btn.getAttribute('data-tool');
            if (!tool) return;
            if (tool === 'colors') {
                toggleColorPanel();
                return;
            }
            if (['pencil', 'crayon', 'marker', 'eraser'].includes(tool)) {
                currentBrush = tool;
                toolButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
        colorPicker.addEventListener('change', (e) => {
            const color = e.target.value;
            updateCurrentColor(color);
            addColorToHistory(color);
        });
    }

    function updateCurrentColor(color) {
        currentColor = color;
        const colorBtn = document.getElementById('color-wheel-btn');
        if (colorBtn) colorBtn.style.color = currentColor;
    }

    function addColorToHistory(color) {
        if (!colorHistory.includes(color)) {
            colorHistory.unshift(color);
            if (colorHistory.length > 8) colorHistory.pop();
            renderColorHistory();
        }
    }

    function renderColorHistory() {
        const historyRow = document.getElementById('color-history-row');
        if (!historyRow) return;
        historyRow.innerHTML = colorHistory.map(c => `
            <div class="color-dot" style="background:${c}" onclick="selectHistoryColor('${c}')"></div>
        `).join('');
    }

    window.selectHistoryColor = function(color) {
        updateCurrentColor(color);
        document.getElementById('color-picker').value = color;
        toggleColorPanel(false);
    };

    function toggleColorPanel(force) {
        let panel = document.getElementById('color-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'color-panel';
            panel.className = 'color-history-panel';
            panel.innerHTML = `
                <div class="color-history-title">选择颜色</div>
                <button class="modal-btn confirm" style="background:var(--primary-blue); color:#333; margin: 5px 0;" onclick="document.getElementById('color-picker').click()">打开调色盘</button>
                <div class="color-history-title" style="margin-top: 5px;">最近使用</div>
                <div id="color-history-row" class="color-history-row"></div>
            `;
            document.querySelector('.header-tools').appendChild(panel);
        }
        
        const isVisible = force !== undefined ? !force : panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'flex';
        if (panel.style.display === 'flex') renderColorHistory();
    }

    // --- Onboarding Tooltip Logic ---
    const tooltip = document.getElementById('drag-tooltip');
    if (tooltip) {
        // Show tooltip, then hide on interact
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 500);

        const dismissTooltip = () => {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 500);
            document.removeEventListener('pointerdown', dismissTooltip);
        };
        // Auto dismiss after 6 seconds or on click
        setTimeout(dismissTooltip, 6000);
        document.addEventListener('pointerdown', dismissTooltip);
    }

    window.clearCanvas = function () {
        gCtx.clearRect(0, 0, graffitiCanvas.width, graffitiCanvas.height);
        saveUndoState();
    };

    window.saveMergedCanvas = function () {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = graffitiCanvas.width;
        tmpCanvas.height = graffitiCanvas.height;
        const tmpCtx = tmpCanvas.getContext('2d');
        
        // 1. Draw Background
        tmpCtx.drawImage(bgCanvas, 0, 0);
        // 2. Draw Graffiti on top
        tmpCtx.drawImage(graffitiCanvas, 0, 0);
        
        try {
            // Test if canvas is tainted by a local file
            tmpCanvas.toDataURL('image/png');
            // Save the merged result via WorkService
            WorkService.saveWithNaming(tmpCanvas);
        } catch (e) {
            console.warn("Canvas tainted by local background image, falling back to foreground save:", e);
            
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = graffitiCanvas.width;
            fallbackCanvas.height = graffitiCanvas.height;
            const fCtx = fallbackCanvas.getContext('2d');
            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
            fCtx.drawImage(graffitiCanvas, 0, 0);
            
            WorkService.showToast('⚠️ 由于本地运行限制，暂只保存您的画作部分');
            setTimeout(() => {
                WorkService.saveWithNaming(fallbackCanvas);
            }, 800);
        }
    };
});
