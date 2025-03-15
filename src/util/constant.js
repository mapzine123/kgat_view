// .env.development, .env.production 파일 등에서 관리
export const API = {
    BASE: 'http://localhost:8080/api',
    ARTICLES: "/articles",
    USERS: "/users",
    AUTH: "/auth",
    TODOS: "/todos",
    COMMENTS: "/comments",
    CHATS: "/chat/rooms"
};

export const articlePath = API.BASE + API.ARTICLES;
export const userPath = API.BASE + API.USERS;
export const authPath = API.BASE + API.AUTH;
export const todoPath = API.BASE + API.TODOS;
export const commentPath = API.BASE + API.COMMENTS;
export const chatPath = API.BASE + API.CHATS;

export const writeMode = "write";
export const modifyMode = "modify";



export const MODES = {
    WRITE: "write",
    MODIFY: "modify"
};

export const getApiUrl = (endpoint) => `${API.BASE}${endpoint}`;
