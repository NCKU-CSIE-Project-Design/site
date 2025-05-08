'use client';

import React, { useState, useEffect } from 'react';
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
} from '../styles/chat';

interface OutfitImages {
    [key: string]: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatWidgetProps {
    setError: (error: string) => void;
    setOutfitImage: (image: OutfitImages | null) => void;
    selectedFile: File | null;
    setResultMessage: (message: string) => void;
    setSelectedStyle: (selectedStyle: string | null) => void;
}

export default function ChatWidget({ 
    setError, 
    setOutfitImage, 
    selectedFile,
    setResultMessage,
    setSelectedStyle
}: ChatWidgetProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [chatmessage, setchatMessage] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [loadingDots, setLoadingDots] = useState<string>('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].content.startsWith('生成中')) {
            interval = setInterval(() => {
                setLoadingDots(prev => {
                    const newDots = prev === '...' ? '' : 
                                  prev === '..' ? '...' : 
                                  prev === '.' ? '..' : '.';
                    setChatHistory(prevHistory => {
                        const newHistory = [...prevHistory];
                        newHistory[newHistory.length - 1] = {
                            role: 'assistant',
                            content: `生成中${newDots}`
                        };
                        return newHistory;
                    });
                    return newDots;
                });
            }, 500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [chatHistory]);

    const toggleChat = (): void => {
        setOpen(!open);
    };

    const sendMessage = async (): Promise<void> => {
        if(!chatmessage.trim()) {
            setChatHistory((prevHistory) => [
                ...prevHistory,
                { role: 'assistant', content: '請輸入文字' },
            ]);
            return;
        }

        setChatHistory((prevHistory) => [
            ...prevHistory,
            { role: 'user', content: chatmessage },
        ]);
        setchatMessage('');

        if (!selectedFile) {
            setChatHistory((prevHistory) => [
                ...prevHistory,
                { role: 'assistant', content: '請先上傳圖片' },
            ]);
            return;
        }

        if (chatmessage.trim()) {
            const formData = new FormData();
            formData.append("user_prompt", chatmessage);
            if (selectedFile) {
                formData.append("image", selectedFile);
            }

            setChatHistory((prevHistory) => [
                ...prevHistory,
                { role: 'assistant', content: `生成中${loadingDots}` },
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
                    const outfitImages: OutfitImages = {};
                    data.image.forEach((item: { style: string; image: string }) => {
                        outfitImages[item.style] = item.image;
                    });
                    setOutfitImage(outfitImages);
                    if (data.image && data.image.length > 0) {
                        setSelectedStyle(data.image[0].style);
                    }
                    setChatHistory((prevHistory) => [
                        ...prevHistory,
                        { role: 'assistant', content: '生成完畢' },
                    ]);
                    setResultMessage('您的個人化穿搭已顯示在左側');
                }
            } catch (error) {
                console.error("上傳失敗:", error);
            }
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.nativeEvent.isComposing) return;
        
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
                            message.role === 'user' ? (
                                <StyledUserMessage key={index}>
                                    {message.content}
                                </StyledUserMessage>
                            ) : (
                                <StyledBotMessage key={index}>
                                    {message.content}
                                </StyledBotMessage>
                            )
                        ))}
                    </StyledChatContent>

                    <StyledChatInput>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="請輸入想要改變的穿搭..."
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