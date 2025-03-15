import ky from 'ky';
import { useStore } from '../../redux/store/store';

const token = localStorage.getItem('jwt'); 

export const api = ky.create({
    prefixUrl: 'http://localhost:8080/api',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
});

export const sendMessage = async (messageData) => {
    try {
        const response = await api.post('messages', {
            json: {
                content: messageData.content,
                roomId: messageData.roomId,
                senderId: messageData.senderId,
                type: 'MESSAGE'
            }
        }).json();

        console.log(response);

        return response;
    } catch(error) {
        console.error('메시지 전송 실패 :', error);
        throw error;
    }
};

export const getMessages = async (roomId) => {
    try {
        const response = await api.get(`chat/rooms/messages/${roomId}`).json();
        return response;
    } catch(error) {
        console.error('메시지 조회 실패 : ', error);
        throw error;
    }
}

export const getChannelMembers = async (channelId) => {
    const response = await api.get(`chat/rooms/${channelId}`, {
        headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch channel members');
    return response.json();
};
