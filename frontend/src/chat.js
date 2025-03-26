import React, { useState } from 'react';
import { IconButton, TextField, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import {
    StyledChatButton,
    StyledChatIcon,
    StyledChatPaper,
    StyledChatHeader,
    StyledHeaderText,
    StyledCloseButton,
    StyledChatContent,
    StyledUserMessage,
    StyledBotMessage,
    StyledChatInput,
    StyledFileInput,
    textFieldStyles,
    sendButtonStyles
} from './styles/chat';

const ChatWidget = ({ setError, setOutfitImage }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    const toggleChat = () => {
        setOpen(!open);
    };

    const sendMessage = async () => {
        if (!selectedFile) {
            setChatHistory([
                ...chatHistory,
                { text: '請上傳圖片', sender: 'bot' },
            ]);
        }
        if (message.trim() || selectedFile) {
            setChatHistory([...chatHistory, { text: message, sender: 'user' }]);
            setMessage('');

            const formData = new FormData();
            formData.append("user_text", message);
            if (selectedFile) {
                formData.append("image", selectedFile);
            }
            setChatHistory([
                ...chatHistory,
                { text: '生成中...', sender: 'bot' },
            ]);
            try {
                const response = await fetch("http://localhost:3001/analyze", {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setOutfitImage(null);
                    setOutfitImage(data.image);
                    setChatHistory([
                        ...chatHistory,
                        { text: '生成完畢', sender: 'bot' },
                    ]);
                }
            } catch (error) {
                console.error("上傳失敗:", error);
            }
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
        } else {
            alert('請上傳圖片文件！');
        }
    };

    return (
        <>
            <StyledChatButton onClick={toggleChat}>
                <StyledChatIcon />
            </StyledChatButton>

            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <StyledChatPaper>
                    <StyledChatHeader>
                        <StyledHeaderText variant="h6">AI助手</StyledHeaderText>
                        <StyledCloseButton size="small" onClick={toggleChat}>
                            <CloseIcon />
                        </StyledCloseButton>
                    </StyledChatHeader>

                    <StyledChatContent>
                        {chatHistory.map((chat, index) => (
                            chat.sender === 'user' ? (
                                <StyledUserMessage key={index}>{chat.text}</StyledUserMessage>
                            ) : (
                                <StyledBotMessage key={index}>{chat.text}</StyledBotMessage>
                            )
                        ))}
                    </StyledChatContent>

                    <StyledChatInput>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="輸入您想要的穿搭..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            sx={textFieldStyles}
                        />
                        <IconButton 
                            onClick={sendMessage}
                            sx={sendButtonStyles}
                        >
                            <SendIcon />
                        </IconButton>
                    </StyledChatInput>

                    <StyledFileInput
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </StyledChatPaper>
            </Slide>
        </>
    );
};

export default ChatWidget;
