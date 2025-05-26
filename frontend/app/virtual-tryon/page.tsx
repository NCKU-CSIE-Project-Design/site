"use client"

import React, { useState } from 'react';
import { Container, Box, Typography, Button, CircularProgress, Paper, Stack } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { UploadBox, HiddenInput, PreviewImage } from '../../styles/App';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function VirtualTryOn() {
    const router = useRouter();
    const [bodyImage, setBodyImage] = useState<File | null>(null);
    const [garmentImage, setGarmentImage] = useState<File | null>(null);
    const [bodyPreview, setBodyPreview] = useState<string>('');
    const [garmentPreview, setGarmentPreview] = useState<string>('');
    const [resultPreview, setResultPreview] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [selectedGarmentType, setSelectedGarmentType] = useState<string | null>(null);

    const handleBodyImageSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file && file.type.startsWith('image/')) {
            setBodyImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBodyPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file!');
        }
    };

    const handleGarmentImageSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file && file.type.startsWith('image/')) {
            setGarmentImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGarmentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file!');
        }
    };

    const handleBodyDrop = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setBodyImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBodyPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGarmentDrop = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setGarmentImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGarmentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTryOn = async (): Promise<void> => {
        if (!bodyImage || !garmentImage || !selectedGarmentType) {
            setError('Please upload both body and garment images and select a garment type');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('body_image', bodyImage);
        formData.append('garment_image', garmentImage);
        formData.append('garment_type', selectedGarmentType);

        try {
            const response = await fetch('https://api.coloranalysis.fun/virtual-tryon', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            setResultPreview(`data:image/png;base64,${data.result}`);
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error.message : 'Unknown Error');
        } finally {
            setLoading(false);
        }
    };

    const resetUploads = (): void => {
        setBodyImage(null);
        setGarmentImage(null);
        setBodyPreview('');
        setGarmentPreview('');
        setResultPreview('');
        setError('');
        setSelectedGarmentType(null);
    };

    return (
        <Container maxWidth="lg" sx={{ mb: 4 }}>
            <Box sx={{ my: 4, textAlign: 'center', position: 'relative' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/')}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        textTransform: 'none'
                    }}
                >
                    Back to Home
                </Button>
                <Typography variant="h3" component="h1" color="primary" gutterBottom>
                    Virtual Fitting Room
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    Upload your full-body photo and the garmenting item you want to try on
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                    <Typography variant="h6" gutterBottom>Model Photo</Typography>
                    <UploadBox
                        onDrop={handleBodyDrop}
                        onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
                        onClick={() => document.getElementById('body-input')?.click()}
                    >
                        {bodyPreview ? (
                            <PreviewImage src={bodyPreview} alt="Body Preview" />
                        ) : (
                            <>
                                <CloudUploadIcon sx={{ fontSize: 60, color: '#f8b195', mb: 2 }} />
                                <Typography>Upload model photo</Typography>
                            </>
                        )}
                        <HiddenInput
                            id="body-input"
                            type="file"
                            accept="image/*"
                            onChange={handleBodyImageSelect}
                        />
                    </UploadBox>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Garmenting Item</Typography>
                    {garmentImage && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Select Garment Type:
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                {['Upper Clothes', 'Lower Clothes', 'Dresses'].map((type) => (
                                    <Button
                                        key={type}
                                        variant={selectedGarmentType === type ? "contained" : "outlined"}
                                        onClick={() => setSelectedGarmentType(type)}
                                        fullWidth
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>
                    )}
                    <UploadBox
                        onDrop={handleGarmentDrop}
                        onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
                        onClick={() => document.getElementById('garment-input')?.click()}
                    >
                        {garmentPreview ? (
                            <PreviewImage src={garmentPreview} alt="Garment Preview" />
                        ) : (
                            <>
                                <CloudUploadIcon sx={{ fontSize: 60, color: '#f8b195', mb: 2 }} />
                                <Typography>Upload garmenting item</Typography>
                            </>
                        )}
                        <HiddenInput
                            id="garment-input"
                            type="file"
                            accept="image/*"
                            onChange={handleGarmentImageSelect}
                        />
                    </UploadBox>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        {(bodyPreview || garmentPreview) && (
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={resetUploads}
                                sx={{ textTransform: 'none' }}
                            >
                                Reset Uploads
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            fullWidth
                            disabled={!bodyImage || !garmentImage || !selectedGarmentType || loading}
                            onClick={handleTryOn}
                            sx={{ textTransform: 'none' }}
                        >
                            Try On
                        </Button>
                    </Stack>
                </Box>
                <Box>
                {error ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mt: 8,
                        color: 'error.main'
                    }}>
                        <Typography variant="h6" gutterBottom>
                            Error
                        </Typography>
                        <Typography>
                            {error}
                        </Typography>
                    </Box>
                ) : loading ? (
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
                            <CircularProgress />
                            <Typography sx={{ mt: 2 }}>Processing, please wait...</Typography>
                        </Box>
                    </Paper>
                ) : resultPreview ? (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Try-On Result
                        </Typography>
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                p: 2, 
                                display: 'inline-block',
                                maxWidth: '100%',
                                borderRadius: 2
                            }}
                        >
                            <Image
                                src={resultPreview}
                                alt="Try-On Result"
                                width={500}
                                height={500}
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
                                    fullScreenImage.src = resultPreview;
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
                ) : (
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography color="text.secondary">
                                Result will be displayed here after processing
                            </Typography>
                        </Box>
                    </Paper>
                )}
                </Box>
            </Box>
        </Container>
    );
} 