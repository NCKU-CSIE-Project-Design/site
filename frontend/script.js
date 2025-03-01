document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const resultContent = document.getElementById('result-content');

    // 點擊上傳區域觸發文件選擇
    document.querySelector('.image-preview').addEventListener('click', () => {
        fileInput.click();
    });

    // 處理拖放上傳
    const dropZone = document.querySelector('.image-preview');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--secondary-color)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-color)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 處理文件選擇
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            alert('請上傳圖片文件！');
        }
    }

    // 處理分析請求
    analyzeBtn.addEventListener('click', async () => {
        loading.style.display = 'block';
        result.style.display = 'none';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        try {
            const response = await fetch('http://localhost:8001/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            loading.style.display = 'none';
            result.style.display = 'block';
            resultContent.textContent = data.analysis;
            analyzeBtn.disabled = false;
        } catch (error) {
            console.error('Error:', error);
            alert('分析過程中發生錯誤，請稍後再試！');
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    });
}); 