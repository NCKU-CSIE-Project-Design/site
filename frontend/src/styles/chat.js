import { styled, Box, IconButton, Paper, Typography } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

// Chat Button Styles
export const StyledChatButton = styled(IconButton)({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  backgroundColor: '#303030',
  color: 'white',
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '50%',
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: '#303030',
  },
});

export const StyledChatIcon = styled(ChatIcon)({
  fontSize: '50px',
  color: 'white',
});

// Chat Paper Styles
export const StyledChatPaper = styled(Paper)({
  position: 'fixed',
  bottom: 0,
  right: '20px',
  width: '600px',
  height: '900px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#212121',
});

// Header Styles
export const StyledChatHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#171616',
  color: 'white',
  padding: '16px',
});

export const StyledHeaderText = styled(Typography)({
  color: 'white',
  margin: 0,
});

export const StyledCloseButton = styled(IconButton)({
  color: 'white',
});

// Content Styles
export const StyledChatContent = styled(Box)({
  flex: 1,
  padding: '16px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
});

// Message Styles
export const StyledUserMessage = styled(Typography)({
  alignSelf: 'flex-end',
  backgroundColor: '#303030',
  color: 'white',
  padding: '8px',
  borderRadius: '8px',
  maxWidth: '80%',
  marginBottom: '8px',
});

export const StyledBotMessage = styled(Typography)({
  alignSelf: 'flex-start',
  backgroundColor: '#303030',
  color: 'rgb(247, 243, 243)',
  padding: '8px',
  borderRadius: '8px',
  maxWidth: '80%',
  marginBottom: '8px',
});

// Input Styles
export const StyledChatInput = styled(Box)({
  display: 'flex',
  padding: '16px',
  border: 'none',
  borderRadius: '16px',
  backgroundColor: '#303030',
  alignItems: 'center',
  margin: '10px',
});

export const StyledFileInput = styled('input')({
  marginTop: '10px',
  color: 'white',
});

// TextField Styles
export const textFieldStyles = {
  '& .MuiInputBase-root': {
    color: 'white',
  },
  '& .MuiOutlinedInput-root': {
    color: 'white',
  },
  '& .MuiOutlinedInput-input': {
    color: 'white',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'gray',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'gray',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'gray',
  },
  '& .MuiInputBase-input::placeholder': {
    color: 'white',
    opacity: 1,
  },
};

// Send Button Styles
export const sendButtonStyles = {
  color: '#808080',
  '&:hover': {
    backgroundColor: 'rgba(128, 128, 128, 0.04)',
  },
}; 