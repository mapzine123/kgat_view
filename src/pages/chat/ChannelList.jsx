import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import TagIcon from '@mui/icons-material/Tag';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from "react";
import { api } from "./chatApi";
import { enqueueSnackbar } from "notistack";
import UserSelectionDialog from "./UserSelectionDialog";
import { getUserId } from "../../util/constant";


const ChannelList = ({channels, setChannels, currentChannel, setCurrentChannel}) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [openUserSelection, setOpenUserSelection] = useState(false);
    const drawerWidth = 240;
    const token = localStorage.getItem('jwt'); 

    useEffect(() => {
        let isSubscribed = true;
        // 포함되어있는 채팅방 목록 불러오기
        const fetchChatRooms = async () => {
            if(!token) {
                return;
            }
            try {
                const response = await api.get('chat/rooms', {
                    timeout: 5000
                });
                const responseData = await response.json();
                
                // 응답 데이터를 channels 형식에 맞게 변환
                if(isSubscribed) {
                    const formattedChannels = responseData.map(room => ({
                        id: room.id,
                        name: room.name
                    }));
    
                    setChannels(formattedChannels);
                }


            } catch(error) {
                console.error("채팅방 목록 조회 실패:", error);
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                enqueueSnackbar('채팅방 목록을 불러오는데 실패했습니다.', {
                    variant: 'error'
                });
            }
        }

        fetchChatRooms();
    }, [token, setChannels]);

    const handleCreateChannel = async () => {
        if(newChannelName.trim()) {
            try {
                const response = await api.post('chat/rooms', {
                    json: {
                        chatRoomName: newChannelName.trim(),
                        users: selectedUsers.map(user => user.id)
                    }, 
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }).json();
                const newChannel = {
                    id: response.roomId,
                    name: newChannelName.trim(),
                };

                setChannels(prev => [...prev, newChannel]);
                setCurrentChannel(newChannel);
                resetForm();
            } catch(error) {
                console.error('채널 생성 실패:', error);
                enqueueSnackbar('채널 생성에 실패했습니다.', {variant: 'error'});
            }
        }
    }

    const resetForm = () => {
        setNewChannelName('');
        setSelectedUsers([]);
        setOpenDialog(false);
    }

    return (
        <>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiPaper-root': {  // Paper 컴포넌트 스타일 직접 지정
                            position: 'relative',
                            left: 'unset',
                            width: drawerWidth,
                            backgroundColor: '#2c2d30',
                            color: 'white',
                            height: 'calc(100vh - 65px)',
                            borderRight: '1px solid #e0e0e0'
                        }
                    }}
            >
                <Box
                    sx={{
                        overflow: 'auto',
                        p: 2
                    }}
                >
                    <Box 
                        sx={{
                            display: 'flex',
                            alineItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant="h6">Channels</Typography>
                        <IconButton
                            onClick={() => setOpenDialog(true)}
                            size="small"
                            sx={{
                                color: 'white'
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Box>  
                    <List>
                        {channels.map((channel) => (
                            <ListItem 
                                button 
                                key={channel.id}
                                selected={currentChannel?.id === channel.id}
                                onClick={() => setCurrentChannel(channel)}
                            >
                                <TagIcon sx={{mr: 1}} />
                                <ListItemText primary={channel.name} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            {/* 채널 생성 다이얼로그 */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create a channel</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus
                        margin="dense"
                        label="Channel name"
                        fullWidth
                        autoComplete="off"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        sx={{mt: 2}}
                    />
                    
                    {selectedUsers.length > 0 && (
                        <Box sx={{mt: 2}}>
                            <Typography variant="subtitle2" color="text.secondary">
                                선택된 멤버 ({selectedUsers.length})
                            </Typography>
                            <Box sx={{mt: 1}}>
                                {selectedUsers.map(user => (
                                    <Chip 
                                        key={user.id}
                                        label={`${user.name} (${user.id})`}
                                        onDelete={() => {
                                            setSelectedUsers(prev => 
                                                prev.filter(u => u.id !== user.id)
                                            );
                                        }}
                                        sx={{m: 0.5}}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    <Button
                        variant="outlined"
                        onClick={() => setOpenUserSelection(true)}
                        sx={{mt: 2}}
                        fullWidth
                    >
                        멤버 선택
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        resetForm();
                        setOpenDialog(false);
                    }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateChannel}
                        variant="contained"
                        disabled={!newChannelName.trim() || selectedUsers.length === 0}
                    >
                        Create Channel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 사용자 선택 다이얼로그 */}
            <UserSelectionDialog 
                open={openUserSelection}
                selectedUsers={selectedUsers}
                onSelectUsers={(users) => {
                    setSelectedUsers(users);
                    setOpenUserSelection(false);
                }}
                onClose={() => setOpenUserSelection(false)}
            />
        </>
    );
};

export default ChannelList;