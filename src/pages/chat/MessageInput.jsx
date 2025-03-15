import { AttachFile } from "@mui/icons-material";
import { Box, IconButton, TextField } from "@mui/material";
import { useState } from "react"
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SendIcon from '@mui/icons-material/Send';
import {useSnackbar} from 'notistack';
import { sendMessage } from "./chatApi";
import { useStore } from "../../redux/store/store";

const MessageInput = ({roomId, onSendMessage}) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const {enqueueSnackbar} = useSnackbar();

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!message.trim() || !roomId) {
            return;
        }

        setIsLoading(true);

        try {
            onSendMessage(message);
            setMessage('');
        } catch(error) {
            console.error('메시지 전송 실패:', error);
            enqueueSnackbar('메시지 전송에 실패했습니다.', {variant: 'error'});
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                p: 2,
                backgroundColor: '#fff',
                borderRadius: 1,
                boxShadow: 1,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#fff'
                        }
                    }}
                />
                <IconButton
                    color="primary"
                    type="submit"
                    disabled={!message.trim() || isLoading}
                >
                    <SendIcon />
                </IconButton>
                </Box>
        </Box>
    )
}

export default MessageInput;