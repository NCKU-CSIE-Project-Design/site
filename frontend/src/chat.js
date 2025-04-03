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

const ChatWidget = ({ setError, setOutfitImage, selectedFile, setSelectedFile,setResultMessage}) => {
    const [open, setOpen] = useState(false);
    const [chatmessage, setchatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    const toggleChat = () => {
        setOpen(!open);
    };

    const sendMessage = async () => {
        setChatHistory((prevHistory) => [
            ...prevHistory,
            { text: chatmessage, sender: 'user' },
        ]);
        setchatMessage(''); // 清空輸入框
    if (!selectedFile) {
        setChatHistory((prevHistory) => [
            ...prevHistory,
            { text: '請上傳圖片', sender: 'bot' },
        ]);
        return;
    }

    if (chatmessage.trim() || selectedFile) {
        const formData = new FormData();
        formData.append("user_prompt", chatmessage);
        if (selectedFile) {
            formData.append("image", selectedFile);
        }

        setChatHistory((prevHistory) => [
            ...prevHistory,
            { text: '生成中...', sender: 'bot' },
        ]);

        try {
            const response = await fetch("https://api.coloranalysis.fun/analyze", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setOutfitImage(null);
                setOutfitImage(data.image);
                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { text: '生成完畢', sender: 'bot' },
                ]);
                setResultMessage('您的個人化穿搭已顯示在左側')
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
    return (
        <>
            <StyledChatButton onClick={toggleChat}>
                <StyledChatIcon />
            </StyledChatButton>

            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <StyledChatPaper>
                    <StyledChatHeader>
                        <StyledHeaderText variant="h6">AI穿搭助手</StyledHeaderText>
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
                            value={chatmessage}
                            onChange={(e) => setchatMessage(e.target.value)}
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
                </StyledChatPaper>
            </Slide>
        </>
    );
};

export default ChatWidget;
