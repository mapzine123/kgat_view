import { Box, Paper, Typography, Divider, Avatar, AvatarGroup, Tooltip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import ChatWebSocket from "./ChatWebSocket";
import { getMessages, getChannelMembers, api } from "./chatApi";
import { useStore } from "../../redux/store/store";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { chatPath, chattingPath } from "../../util/constant";
import MemberSelection from "./MemberSelection";
import { current } from "@reduxjs/toolkit";

const ChatArea = ({currentChannel, setCurrentChannel, channels, setChannels}) => {
// 스크롤을 위한 ref 추가
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [showMembersList, setShowMembersList] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const token = localStorage.getItem('jwt'); 
    const { userId } = useStore();
    const [webSocket, setWebSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [previousMembers, setPreviousMembers] = useState([]);
    const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

    // 메시지가 바뀔 때마다 스크롤을 아래로 이동
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]); // 메시지가 변경될 때마다 실행


    useEffect(() => {
        const ws = new ChatWebSocket(token);

        if(!token || !currentChannel?.id) {
            return;
        }
        try {
            ws.connect();

            const unsubscribeOpen = ws.onOpen(() => {
                setIsConnected(true);
            })

            const unsubscribeClose = ws.onClose(() => {
                setIsConnected(false);
            })

            // 메시지 수신 처리
            const unsubscribeMessage = ws.onMessage((message) => {
                // 현재 채팅방의 메시지만 표시
                if(message.roomId === currentChannel?.id) {
                    // ENTER 메시지 필터링 - 클라이언트 단에서도 처리
                    if (message.type === 'ENTER' && message.senderId === userId) {
                        // 이미 멤버인 경우 ENTER 메시지 무시
                        if (isMember) {
                            return;
                        }
                    }
                    
                    const newMessage = {
                        id: Date.now(),
                        type: message.type,
                        content: message.content,
                        senderId: message.senderId,
                        senderName: message.senderName,
                        createAt: message.timestamp
                    };

                    // 사용자 입장/퇴장 메시지인 경우 멤버 목록 갱신
                    if (message.type === 'ENTER' || message.type === 'LEAVE') {
                        fetchChannelMembers();
                    }

                    setMessages(prev => {
                        const updated = [...prev, newMessage];
                        return updated;
                    });
                }
            });
    
            setWebSocket(ws);

            return () => {
                unsubscribeMessage();
                unsubscribeOpen();
                unsubscribeClose();
                ws.disconnect();
                setIsConnected(false);
            };
        } catch(error) {
            console.error('WebSocket initialization error: ', error);
            setIsConnected(false);
        }

    }, [token, currentChannel?.id, isMember, userId]);

    // 채널 멤버 목록이 변경될 때마다 다시 불러오기
    useEffect(() => {
        fetchChannelMembers();
    }, [members.length]); // 멤버 수가 변경될 때마다 실행

    // 채팅방이 변경되면 멤버십 확인 및 채팅방 입장
    useEffect(() => {
        if(!currentChannel?.id) {
            return;
        }

        // 채널 멤버십 확인
        checkMembership();

        // 이전 메시지 초기화
        setMessages([]);

        // 서버에서 채팅방의 이전 메시지들을 가져옵니다
        getMessages(currentChannel.id)
        .then(previousMessage => {
            setMessages(previousMessage);
        })
        .catch(error => {
            console.error("이전 메시지 로딩 실패 : ", error);
        });

        // 채팅방 멤버 목록을 가져옵니다
        fetchChannelMembers();
    }, [currentChannel?.id]);

    // 웹소켓 연결 후 채팅방 입장
    useEffect(() => {
        if(!webSocket || !currentChannel?.id || !isConnected) {
            return;
        }

        // enterRoom 함수를 수정하여 isMember 정보를 전달
        enterRoom(currentChannel.id, userId);
    }, [webSocket, currentChannel?.id, isConnected, isMember]);

    // 채널 멤버십 확인 함수
    const checkMembership = async () => {
        const token = localStorage.getItem('jwt'); 

        if (!currentChannel?.id || !userId) return;
        try {
            // API 호출
            const members = await api.get(`chat/rooms/${currentChannel.id}`).json();
            const isCurrentUserMember = members.some(member => member.id === userId);
            setIsMember(isCurrentUserMember);
            setMembers(members);
        } catch (error) {
            console.error("멤버십 확인 실패 : ", error);
            // setIsMember(false);
        }
    };

    const handleOpenExitDialog = () => {
        setIsExitDialogOpen(true);
    };
    
    const handleCloseExitDialog = () => {
        setIsExitDialogOpen(false);
    };

    // 수정된 enterRoom 함수
    const enterRoom = (roomId, userId) => {
        if(webSocket?.socket?.readyState === WebSocket.OPEN) {
            // 이미 멤버인 경우 silent 모드로 입장 (서버에도 알림)
            webSocket.socket.send(JSON.stringify({
                type: 'ENTER',
                roomId: roomId,
                senderId: userId,
                message: '',
                timestamp: new Date().toISOString(),
                silent: isMember // 이미 멤버인 경우 silent 플래그 설정
            }));
        }
    };

    // 채널 멤버 목록을 가져오는 함수
    const fetchChannelMembers = async () => {
        if (!currentChannel?.id) return;
    
        try {
            const membersList = await getChannelMembers(currentChannel.id);
    
            // 새로 추가된 멤버 확인
            if (previousMembers.length > 0) {
                const newMembers = membersList.filter(member => 
                    !previousMembers.some(prevMember => prevMember.id === member.id)
                );
    
                if (newMembers.length > 0) {
                    newMembers.forEach(newMember => {
                        const systemMessage = {
                            id: Date.now(),
                            type: 'SYSTEM',
                            content: `${newMember.name || newMember.username}님이 초대되었습니다.`,
                            senderId: 'system',
                            senderName: 'System',
                            timestamp: new Date().toISOString()
                        };
                        setMessages(prev => [...prev, systemMessage]);
                    });
                }
            }
    
            setMembers(membersList);
            setPreviousMembers(membersList);
        } catch (error) {
            console.error("채널 멤버 로딩 실패 : ", error);
        }
    };

    // MessageInput으로 전달할 메시지 전송 함수
    const handleSendMessage = (content) => {
        if(!currentChannel?.id || !content.trim()) {
            console.error("채널 ID 또는 메시지 내용이 없습니다.");
            return;
        }

        if(!webSocket) {
            console.error("Websocket이 연결되지 않았습니다.");
            return;
        }

        try {
            webSocket.sendMessage(currentChannel.id, content.trim());
        } catch(error) {
            console.error("메시지 전송 중 오류 발생 : ", error);
        }
    };

    const toggleMembersList = () => {
        setShowMembersList(!showMembersList);
    };

    const handleAddMember = () => {
        setIsMemberModalOpen(true);
    }

    const handleConfirmExit = async () => {
        try {
            await api.delete(`chat/rooms/user?roomId=${currentChannel.id}&userId=${userId}`);
    
            setChannels(prevChannels => 
                prevChannels.filter(channel => channel.id !== currentChannel.id)
            );
            setCurrentChannel(null);
        } catch (error) {
            console.error("채널 나가기 오류:", error);
        } finally {
            setIsExitDialogOpen(false);
        }
    };

    return (
    <Box
        component="main"
        sx={{
            display: 'flex',
            height: '100%',
            width: '100%',
        }}
    >
        {/* Main Chat Area */}
        <Box
            sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRight: '1px solid #e0e0e0',
            }}
        >
            {/* Channel Header */}
            <Paper
            elevation={0}
            sx={{
                p: 2,
                backgroundColor: '#ffffff',
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
            >
                <Typography variant="h6">{currentChannel?.name}</Typography>
                
                {/* Show/Hide Member List on mobile */}
                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                    <Tooltip title="채널 멤버 목록">
                    <IconButton onClick={toggleMembersList} size="small">
                        <PeopleIcon />
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                            {members.length}
                        </Typography>
                    </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* Messages Area */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    my: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    px: 2
                }}
                >
                {messages.map((message) => (
                    <MessageBubble 
                    key={message.id}
                    message={message}
                    isMyMessage={message.senderId === userId}
                    />
                ))}
                <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <MessageInput 
                    roomId={currentChannel?.id}
                    onSendMessage={handleSendMessage}
                />
            </Box>

            {/* Right Sidebar - Member List */}
            <Box
                sx={{
                width: { xs: '100%', md: 280 },
                height: '100%',
                display: { xs: showMembersList ? 'flex' : 'none', md: 'flex' },
                flexDirection: 'column',
                backgroundColor: '#f9f9f9',
                position: { xs: 'absolute', md: 'relative' },
                right: 0,
                zIndex: { xs: 1200, md: 1 },
                }}
            >
                {/* Member List Header */}
                <Box
                sx={{
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f0f0f0'
                }}
                >
                <Typography variant="subtitle1">채널 멤버 ({members.length}명)</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Add Member Button */}
                    <Tooltip title="멤버 추가">
                    <IconButton size="small" color="primary" onClick={handleAddMember}>
                        <PersonAddIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                    {/* Close Member List on Mobile */}
                    <IconButton 
                    size="small" 
                    sx={{ display: { xs: 'flex', md: 'none' } }}
                    onClick={toggleMembersList}
                    >
                    <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                </Box>

                {/* Member List */}
                <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}
                >
                {members.map((member) => (
                    <Box 
                    key={member.id} 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { backgroundColor: '#f0f0f0' }
                    }}
                    >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                        alt={member.name || member.username}
                        sx={{ width: 32, height: 32 }}
                        >
                        {(member.name || member.username).charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                        {member.name || member.username}
                        {member.id === userId && " (나)"}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {member.department || "부서 없음"}
                    </Typography>
                    </Box>
                ))}
                </Box>


            {/* Leave Channel Button */}
            <Box
            sx={{
                p: 2.5,
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'center'
            }}
            >
                <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<ExitToAppIcon />}
                    size="small"
                    fullWidth
                    onClick={handleOpenExitDialog} // 클릭 시 모달 열림
                >
                    채팅방 나가기
                </Button>
            </Box>
        </Box>
        <MemberSelection 
            open={isMemberModalOpen} 
            onClose={() => setIsMemberModalOpen(false)} 
            channelId={currentChannel?.id} 
            currentMembers={members}
            onMembersAdded={fetchChannelMembers} 
        />

        <Dialog
            open={isExitDialogOpen}
            onClose={handleCloseExitDialog}
        >
            <DialogTitle>채팅방 나가기</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    정말로 이 채팅방을 나가시겠습니까? <br />
                    나가면 다시 초대받아야 참여할 수 있습니다.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseExitDialog} color="primary">취소</Button>
                <Button onClick={handleConfirmExit} color="error">나가기</Button>
            </DialogActions>
        </Dialog>
    </Box>
    )
}

// 메세지 컴포넌트
const MessageBubble = ({message, isMyMessage}) => {
    const isSystemMessage = message.type === 'ENTER' || message.type === 'LEAVE';
    const formattedDate = new Date(message.createAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).replace(/\. /g, '-').replace(/\./g, '');
    

    return (
        <Box
            sx={{
                alignSelf: isSystemMessage
                ? 'center'
                : (isMyMessage ? 'flex-end' : 'flex-start'),
                maxWidth: isSystemMessage ? '100%' : '70%',
                backgroundColor: isSystemMessage
                ? 'transparent'
                : (isMyMessage ? '#007AFF' : '#e9ECEF'),
                color: isSystemMessage
                ? 'gray'
                : (isMyMessage ? 'white' : 'black'),
                borderRadius: 2,
                p: isSystemMessage ? 1 : 1.5,
                px: isSystemMessage ? 1 : 2,
                textAlign: isSystemMessage ? 'center' : 'left'
            }}
        >
            {!isMyMessage && !isSystemMessage && (
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 'bold'
                    }}
                >
                    {message.senderName}
                </Typography>
            )}
            <Typography>
                {message.content}
            </Typography>
            {!isSystemMessage && (
                <Typography variant="caption" sx={{opacity: 0.7}}>
                    {formattedDate}
                </Typography>
            )}
        </Box>
    )
}

export default ChatArea;