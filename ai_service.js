/**
 * ArtThink AI Service
 * Handles Image-to-Image (AI Stylization) API calls.
 */
const AIService = {
    // SiliconFlow API Credentials
    API_KEY: 'sk-sqxojohxfwbdfqfigozgmdxojobkofclepgjqcbpaneokwkb',
    API_URL: 'https://api.siliconflow.cn/v1/images/generations',

    /**
     * Sends a stylization request to SiliconFlow using Qwen-Image-Edit.
     */
    async stylize(canvas, customPrompt, customNegPrompt) {
        this.showLoading();

        try {
            // 1. Capture canvas data (Base64)
            const dataUrl = canvas.toDataURL('image/png');
            
            const defaultPrompt = "请将这张简笔画线条作品，根据原有构图，优化为色彩丰富、充满童趣和艺术感的水彩风格插画。保持线条的主体形状不变，进行高质量的上色和背景美化。";
            
            const payload = {
                model: "Qwen/Qwen-Image-Edit-2509",
                prompt: customPrompt || defaultPrompt,
                image: dataUrl,
                image_size: "1024x1024",
                batch_size: 1,
                num_inference_steps: 20
            };

            if (customNegPrompt) {
                payload.negative_prompt = customNegPrompt;
            }

            // 2. Prepare the SiliconFlow request for Qwen-Image-Edit
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`硅基流动模型异常: ${errorText}`);
            }

            const result = await response.json();
            console.log("Qwen AI Result:", result);

            // 3. Handle the generated image
            const imageUrl = result.images?.[0]?.url || result.data?.[0]?.url;
            if (imageUrl) {
                this.applyResultToCanvas(canvas, imageUrl);
                this.showSuccessNotification();
            } else {
                throw new Error("模型未返回有效图片地址，请检查配额或提示词。");
            }

        } catch (error) {
            console.error("AI Stylization Failed:", error);
            // Show more readable error from JSON if possible
            let msg = error.message;
            try {
                const json = JSON.parse(error.message.split('异常: ')[1]);
                msg = json.message || msg;
            } catch (e) { }
            alert(`✨ 魔法施展失败：\n${msg}`);
        } finally {
            this.hideLoading();
        }
    },

    showLoading() {
        const overlay = document.getElementById('ai-loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    },

    hideLoading() {
        const overlay = document.getElementById('ai-loading-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    applyResultToCanvas(canvas, imageUrl) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Smoothly transition the canvas
            canvas.style.opacity = '0.3';
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.style.opacity = '1';

                // Save to undo stack
                if (window.saveUndoState) window.saveUndoState();

                // Success Glow Effect
                canvas.style.filter = 'brightness(1.1) saturate(1.2)';
                canvas.style.boxShadow = '0 0 40px rgba(0, 132, 208, 0.6)';
                setTimeout(() => {
                    canvas.style.filter = 'none';
                    canvas.style.boxShadow = 'none';
                }, 4000);
            }, 300);
        };
        img.src = imageUrl;
    },

    showSuccessNotification() {
        const msg = document.createElement('div');
        msg.className = 'ai-success-toast';
        msg.innerText = '✨ 魔法实验室：创作完成！';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
};

window.stylizeCanvas = function (customPrompt, customNegPrompt) {
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
        AIService.stylize(canvas, customPrompt, customNegPrompt);
    }
};



