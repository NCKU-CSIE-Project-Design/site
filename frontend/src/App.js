import React, { useState, useRef, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Paper,
    Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

const UploadBox = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    textAlign: 'center',
    cursor: 'pointer',
    border: '2px dashed #f8b195',
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
        borderColor: '#f67280',
    },
}));

const HiddenInput = styled('input')({
    display: 'none',
});

const PreviewImage = styled('img')({
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
});



// 新增 Markdown 樣式組件
const MarkdownContainer = styled(Box)(({ theme }) => ({
    '& p': {
        marginBottom: theme.spacing(2),
    },
    '& h1, h2, h3, h4, h5, h6': {
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(3),
        color: theme.palette.primary.main,
    },
    '& ul, ol': {
        marginBottom: theme.spacing(2),
        paddingLeft: theme.spacing(3),
    },
    '& li': {
        marginBottom: theme.spacing(1),
    },
    '& code': {
        backgroundColor: theme.palette.grey[100],
        padding: theme.spacing(0.5, 1),
        borderRadius: theme.spacing(0.5),
        fontSize: '0.9em',
    },
    '& blockquote': {
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        margin: theme.spacing(2, 0),
        padding: theme.spacing(1, 2),
        backgroundColor: theme.palette.grey[50],
    },
}));

// 添加顏色顯示組件
const ColorDisplay = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    '& .color-box': {
        width: 40,
        height: 40,
        marginRight: theme.spacing(2),
        border: '1px solid #ddd',
        borderRadius: theme.spacing(1),
        position: 'relative',
    },
    '& .color-picker-button': {
        position: 'absolute',
        right: -20,
        top: '50%',
        transform: 'translateY(-50%)',
        minWidth: 'auto',
        padding: 4,
    },
}));

function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [error, setError] = useState('');
    const [colors, setColors] = useState(null);
    const [customColors, setCustomColors] = useState(null);
    const [colorsChanged, setColorsChanged] = useState(false);

    const videoRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setIsCameraActive(true);  // 先設置相機狀態為開啟

            // 使用 setTimeout 確保 video 元素已經渲染
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);

        } catch (error) {
            console.error('無法開啟相機:', error);
            setError('無法開啟相機，請確認已授予相機權限');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setPreview(dataUrl);

            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
                    setSelectedFile(file);
                });
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert('請上傳圖片文件！');
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setResult('');
        setError('');
        setColors(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch(`https://api.coloranalysis.fun/analyze`, {
                method: 'POST',
                body: formData

            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setResult(data.analysis);
                setColors(data.colors); // 儲存顏色資訊
            }
        } catch (error) {
            console.error('Error:', error);
            setError('網路連線錯誤，請稍後再試！');
        } finally {
            setLoading(false);
        }
    };

    const handleColorChange = (part, newColor) => {
        setCustomColors(prevColors => ({
            ...prevColors,
            [part]: newColor
        }));
        setColorsChanged(true); // 確保 colorsChanged 設為 true
    };
    
    // 使用 useEffect 監聽 customColors，確保顯示 "重新分析" 按鈕
    useEffect(() => {
        if (customColors) {
            setColorsChanged(true);
        }
    }, [customColors]);
    

    const handleReanalyze = async () => {
        if (!selectedFile) {
            setError('找不到圖片檔案');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('colors', JSON.stringify(customColors));
        
        setLoading(true);
        try {
            const response = await fetch(`https://api.coloranalysis.fun/analyze`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data.analysis);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('網路連線錯誤，請稍後再試！');
        } finally {
            setLoading(false);
            setColorsChanged(false);
        }
    };

    const resetUpload = () => {
        // 如果相機開啟中，先關閉相機
        if (isCameraActive) {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            setIsCameraActive(false);
        }

        // 重置所有狀態
        setPreview('');
        setSelectedFile(null);
        setResult('');
        setError('');
        setColors(null);
        setCustomColors(null);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, textAlign: 'center' }}>
                <Typography variant="h3" component="h1" color="primary" gutterBottom>
                    韓式個人色彩分析
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    上傳您的照片或拍攝照片，讓AI為您打造專屬的色彩建議
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                    <UploadBox
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => !isCameraActive && document.getElementById('file-input').click()}
                    >
                        {preview ? (
                            <PreviewImage src={preview} alt="預覽圖" />
                        ) : (
                            <>
                                {isCameraActive && (
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
                                        <video
                                            ref={videoRef}
                                            style={{
                                                maxWidth: '100%',
                                                height: 'auto',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </Box>
                                )}
                                {!isCameraActive && (
                                    <>
                                        <CloudUploadIcon sx={{ fontSize: 60, color: '#f8b195', mb: 2 }} />
                                        <Typography>點擊或拖曳照片至此處</Typography>
                                    </>
                                )}
                            </>
                        )}
                        <HiddenInput
                            id="file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </UploadBox>

                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        {preview && (
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={resetUpload}
                            >
                                重新上傳
                            </Button>
                        )}
                        {!isCameraActive ? (
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<CameraAltIcon />}
                                onClick={startCamera}
                            >
                                開啟相機
                            </Button>
                        ) : (
                            !preview && (
                                <>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        color="secondary"
                                        onClick={takePhoto}
                                    >
                                        拍照
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        color="error"
                                        onClick={stopCamera}
                                    >
                                        關閉相機
                                    </Button>
                                </>
                            )
                        )}
                        <Button
                            variant="contained"
                            fullWidth
                            disabled={!selectedFile || loading}
                            onClick={handleAnalyze}
                        >
                            開始分析
                        </Button>
                    </Stack>
                </Box>

                <Paper sx={{ p: 3, height: '100%' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
                            <CircularProgress />
                            <Typography sx={{ mt: 2 }}>分析中，請稍候...</Typography>
                        </Box>
                    ) : error ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mt: 8,
                            color: 'error.main'
                        }}>
                            <Typography variant="h6" gutterBottom>
                                錯誤提示
                            </Typography>
                            <Typography>
                                {error}
                            </Typography>
                        </Box>
                    ) : result ? (
                        <>
                            <Typography variant="h5" gutterBottom>分析結果</Typography>

                            {/* 添加顏色顯示區域 */}
                            {colors && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="h6" gutterBottom>偵測到的顏色：</Typography>
                                    {['頭髮', '膚色', '嘴唇'].map((part) => (
                                        <ColorDisplay key={part}>
                                            <Box className="color-box" sx={{ bgcolor: (customColors || colors)[part] }}>
                                                <Button
                                                    className="color-picker-button"
                                                    size="small"
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = (customColors || colors)[part];
                                                        
                                                        // 使用 oninput 來即時更新顏色顯示
                                                        input.oninput = (e) => {
                                                            handleColorChange(part, e.target.value);
                                                        };
                                                        
                                                        // 防止觸發其他事件
                                                        input.addEventListener('change', (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        });
                                                        
                                                        input.click();
                                                    }}
                                                >
                                                    <ColorizeIcon fontSize="small" />
                                                </Button>
                                            </Box>
                                            <Typography>{part}：{(customColors || colors)[part]}</Typography>
                                        </ColorDisplay>
                                    ))}
                                    {/* 只在顏色被修改後顯示重新分析按鈕 */}
                                    {colorsChanged && (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleReanalyze}
                                            sx={{ mt: 2 }}
                                        >
                                            重新分析
                                        </Button>
                                    )}
                                </Box>
                            )}

                            <MarkdownContainer>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {result}
                                </ReactMarkdown>
                            </MarkdownContainer>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography color="text.secondary">
                                上傳照片或拍攝照片後的分析結果將顯示在此處
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}
export default App; 
