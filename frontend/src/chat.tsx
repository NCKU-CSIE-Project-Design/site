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
    textFieldStyles,
    sendButtonStyles
} from './styles/chat';

interface ChatMessage {
    text: string;
    sender: 'user' | 'bot';
}

interface ChatWidgetProps {
    setError: (error: string) => void;
    setOutfitImage: (image: any) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    setResultMessage: (message: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
    setError, 
    setOutfitImage, 
    selectedFile, 
    setSelectedFile,
    setResultMessage 
}) => {
    const [open, setOpen] = useState<boolean>(false);
    const [chatmessage, setchatMessage] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    const toggleChat = (): void => {
        setOpen(!open);
    };

    const sendMessage = async (): Promise<void> => {
        setChatHistory((prevHistory) => [
            ...prevHistory,
            { text: chatmessage, sender: 'user' },
        ]);
        setchatMessage('');

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
                    setResultMessage('您的個人化穿搭已顯示在左側');
                }
            } catch (error) {
                console.error("上傳失敗:", error);
            }
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
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
                        {chatHistory.map((message, index) => (
                            message.sender === 'user' ? (
                                <StyledUserMessage key={index}>
                                    {message.text}
                                </StyledUserMessage>
                            ) : (
                                <StyledBotMessage key={index}>
                                    {message.text}
                                </StyledBotMessage>
                            )
                        ))}
                    </StyledChatContent>

                    <StyledChatInput>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="輸入您的問題..."
                            value={chatmessage}
                            onChange={(e) => setchatMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            sx={textFieldStyles}
                        />
                        <IconButton
                            color="primary"
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