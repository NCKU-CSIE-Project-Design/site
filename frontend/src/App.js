import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
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

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
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

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data.analysis);
    } catch (error) {
      console.error('Error:', error);
      alert('分析過程中發生錯誤，請稍後再試！');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" color="primary" gutterBottom>
          韓式個人色彩分析
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          上傳您的照片，讓AI為您打造專屬的色彩建議
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Box>
          <UploadBox
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input').click()}
          >
            {preview ? (
              <PreviewImage src={preview} alt="預覽圖" />
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 60, color: '#f8b195', mb: 2 }} />
                <Typography>點擊或拖曳照片至此處</Typography>
              </>
            )}
            <HiddenInput
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </UploadBox>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!selectedFile || loading}
            onClick={handleAnalyze}
          >
            開始分析
          </Button>
        </Box>

        <Paper sx={{ p: 3, height: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>分析中，請稍候...</Typography>
            </Box>
          ) : result ? (
            <>
              <Typography variant="h5" gutterBottom>分析結果</Typography>
              <Typography sx={{ whiteSpace: 'pre-line' }}>{result}</Typography>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                上傳照片後的分析結果將顯示在此處
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App; 