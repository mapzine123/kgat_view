import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Checkbox, ListItemIcon, Slide } from "@mui/material";
import { api } from "./chatApi";

const Transition = (props) => {
    return <Slide direction="up" {...props} />;
};

const MemberSelection = ({ open, onClose, channelId, currentMembers, onMembersAdded }) => {
    const [availableMembers, setAvailableMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        if (open) {
            fetchAvailableMembers();
        }
    }, [open]);

    const fetchAvailableMembers = async () => {
        try {
            const members = await api.get(`users`).json();
            const filteredMembers = members.filter(member => 
                !currentMembers.some(current => current.id === member.id)
            );
            setAvailableMembers(filteredMembers);
        } catch (error) {
            console.error("멤버 불러오기 실패: ", error);
        }
    };

    const handleToggle = (memberId) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
        );
    };

    const handleAddMembers = async () => {
        try {
            const data = {
                users: selectedMembers,
                roomId: channelId
            }

            const response = await api.post(`chat/rooms/user`, {
                json: data
            })
            onMembersAdded();
            onClose();
        } catch (error) {
            console.error("멤버 추가 실패: ", error);
        }
    };


    
    return (
        <Dialog open={open} onClose={onClose} TransitionComponent={Transition} keepMounted>
            <DialogTitle>멤버 추가</DialogTitle>
            <DialogContent>
                <List>
                    {availableMembers.map((member) => (
                        <ListItem key={member.id} button onClick={() => handleToggle(member.id)}>
                            <ListItemIcon>
                                <Checkbox checked={selectedMembers.includes(member.id)} />
                            </ListItemIcon>
                            <ListItemText 
                                primary={`${member.name} (${member.id})`} 
                                secondary={member.department} 
                            />
                        </ListItem>
                    ))}
                    {currentMembers.map((member) => (
                        <ListItem key={member.id} disabled>
                            <ListItemText 
                                primary={`${member.name} (${member.id})`} 
                                secondary={`${member.department} - 이미 참여 중`} 
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">취소</Button>
                <Button onClick={handleAddMembers} color="primary" disabled={selectedMembers.length === 0}>
                    추가하기
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MemberSelection;
