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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './styles/App.css';
import {
    UploadBox,
    HiddenInput,
    PreviewImage,
    MarkdownContainer,
    ColorDisplay
} from './styles/App';
import ChatWidget from './chat';

interface Colors {
    [key: string]: string;
}

interface OutfitImages {
    [key: string]: string;
}

const App: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>('');
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [colors, setColors] = useState<Colors | null>(null);
    const [customColors, setCustomColors] = useState<Colors | null>(null);
    const [colorsChanged, setColorsChanged] = useState<boolean>(false);
    const [outfitImage, setOutfitImage] = useState<OutfitImages | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("上傳照片或拍攝照片後的分析結果將顯示在此處");
    const videoRef = useRef<HTMLVideoElement>(null);

    const startCamera = async (): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setIsCameraActive(true);

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

    const stopCamera = (): void => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    const takePhoto = (): void => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
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
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('請上傳圖片文件！');
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async (): Promise<void> => {
        if (!selectedFile) return;

        setLoading(true);
        setResult('');
        setError('');
        setColors(null);
        setOutfitImage(null);
        setSelectedStyle(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch(`https://api.coloranalysis.fun/analyze`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log(data)
            
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data.analysis);
                setColors(data.colors);

                const outfitImages: OutfitImages = {};
                data.image.forEach((item: { style: string; image: string }) => {
                    outfitImages[item.style] = item.image;
                });
                setOutfitImage(outfitImages);
                if (data.image && data.image.length > 0) {
                    setSelectedStyle(data.image[0].style);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            setError('網路連線錯誤，請稍後再試！');
        } finally {
            setLoading(false);
        }
    };

    const handleColorChange = (part: string, newColor: string): void => {
        setCustomColors(prevColors => {
            const baseColors = prevColors || colors;
            return {
                ...baseColors,
                [part]: newColor
            };
        });
        setColorsChanged(true);
    };

    useEffect(() => {
        if (customColors) {
            setColorsChanged(true);
        }
    }, [customColors]);

    const handleReanalyze = async (): Promise<void> => {
        if (!selectedFile) {
            setError('找不到圖片檔案');
            return;
        }
        setOutfitImage(null); 
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
                setColors(data.colors);
                setOutfitImage(data.image);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('網路連線錯誤，請稍後再試！');
        } finally {
            setLoading(false);
            setColorsChanged(false);
        }
    };

    const resetUpload = (): void => {
        if (isCameraActive) {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            setIsCameraActive(false);
        }

        setPreview('');
        setSelectedFile(null);
        setResult('');
        setError('');
        setColors(null);
        setCustomColors(null);
        setOutfitImage(null);
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
                        onClick={() => !isCameraActive && document.getElementById('file-input')?.click()}
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
                    {outfitImage && selectedStyle && (
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                推薦穿搭
                            </Typography>
                            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {Object.keys(outfitImage).map((style) => (
                                    <Button
                                        key={style}
                                        variant={selectedStyle === style ? "contained" : "outlined"}
                                        onClick={() => setSelectedStyle(style)}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {style}
                                    </Button>
                                ))}
                            </Box>
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    p: 2, 
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                    borderRadius: 2
                                }}
                            >
                                <img 
                                    src={`data:image/png;base64,${outfitImage[selectedStyle]}`}
                                    alt={`${selectedStyle}穿搭`}
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        const overlay = document.createElement('div');
                                        overlay.style.position = 'fixed';
                                        overlay.style.top = '0';
                                        overlay.style.left = '0';
                                        overlay.style.width = '100vw';
                                        overlay.style.height = '100vh';
                                        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                                        overlay.style.display = 'flex';
                                        overlay.style.justifyContent = 'center';
                                        overlay.style.alignItems = 'center';
                                        overlay.style.zIndex = '1000';

                                        const fullScreenImage = document.createElement('img');
                                        fullScreenImage.src = `data:image/png;base64,${outfitImage[selectedStyle]}`;
                                        fullScreenImage.style.maxWidth = '100%';
                                        fullScreenImage.style.maxHeight = 'auto';
                                        fullScreenImage.style.objectFit = 'contain';
                                        fullScreenImage.style.borderRadius = '8px';

                                        const closeButton = document.createElement('button');
                                        closeButton.innerText = '×';
                                        closeButton.style.position = 'absolute';
                                        closeButton.style.top = '20px';
                                        closeButton.style.right = '20px';
                                        closeButton.style.backgroundColor = 'transparent';
                                        closeButton.style.color = 'white';
                                        closeButton.style.border = 'none';
                                        closeButton.style.fontSize = '2rem';
                                        closeButton.style.cursor = 'pointer';

                                        const closeOverlay = () => {
                                            document.body.removeChild(overlay);
                                        };

                                        closeButton.onclick = closeOverlay;
                                        overlay.onclick = (e) => {
                                            if (e.target === overlay) {
                                                closeOverlay();
                                            }
                                        };

                                        overlay.appendChild(fullScreenImage);
                                        overlay.appendChild(closeButton);
                                        document.body.appendChild(overlay);
                                    }}
                                />
                            </Paper>
                        </Box>
                    )}
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
                                                        
                                                        input.oninput = (e) => {
                                                            handleColorChange(part, (e.target as HTMLInputElement).value);
                                                        };
                                                        
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
                                {message}
                            </Typography>
                        </Box>
                    )}
                </Paper>
                <ChatWidget 
                    setError={setError} 
                    setOutfitImage={setOutfitImage} 
                    selectedFile={selectedFile} 
                    setSelectedFile={setSelectedFile} 
                    setResultMessage={setMessage} 
                />
            </Box>
        </Container>
    );
};

export default App; 