import { styled, Box, Paper } from '@mui/material';

// Upload Box Styles
export const UploadBox = styled(Paper)(({ theme }) => ({
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

// Hidden Input Styles
export const HiddenInput = styled('input')({
    display: 'none',
});

// Preview Image Styles
export const PreviewImage = styled('img')({
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
});

// Markdown Container Styles
export const MarkdownContainer = styled(Box)(({ theme }) => ({
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

// Color Display Styles
export const ColorDisplay = styled(Box)(({ theme }) => ({
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