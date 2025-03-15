import "./App.css";
import Main from "./pages/Main";
import Login from "./pages/Login";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./pages/Signup";
import Menubar from "./components/Menubar";
import { createTheme, CssBaseline, Snackbar, ThemeProvider } from "@mui/material";
import { usePersistedStore, useStore } from "./redux/store/store";
import { SnackbarProvider } from "notistack";
import WriteArticle from "./pages/article/WriteArticle";
import ContentView from "./pages/article/ContentView";
import ChatMain from "./pages/chat/ChatMain";
import ToDoList from "./pages/todoList/TodoList";
import MyPage from "./pages/myPage/MyPage";

const lightTheme = createTheme({
 palette: {
   mode: "light",
   primary: {
     main: '#1976D2',      // 메인 컬러
     light: '#42a5f5',
     dark: '#1565C0'
   },
   secondary: {
     main: '#9c27b0',      // 보조 컬러
     light: '#ba68c8',
     dark: '#7b1fa2'
   },
   background: {
     default: '#FAFAFA',   // 전체 배경색
     paper: '#FFFFFF'      // 카드, 패널 등의 배경색
   },
   text: {
     primary: '#333333',   // 주요 텍스트
     secondary: '#666666'  // 보조 텍스트
   },
   divider: '#E0E0E0',    // 구분선 색상
 },
 typography: {
   fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
   h1: {
     fontWeight: 600
   },
   h2: {
     fontWeight: 600
   },
   h3: {
     fontWeight: 600
   }
 },
 shape: {
   borderRadius: 8
 },
 components: {
   MuiButton: {
     styleOverrides: {
       root: {
         textTransform: 'none',
         fontWeight: 500
       }
     }
   },
   MuiCard: {
     styleOverrides: {
       root: {
         boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
       }
     }
   }
 }
});


function App() {
  const { userId, setUserId } = useStore();

 usePersistedStore();

 return (
   <ThemeProvider theme={lightTheme}>
     <CssBaseline />
     <SnackbarProvider maxSnack={3}>
      <Router>
        <Menubar />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/write" element={<WriteArticle />} />
          <Route path="/myPage" element={<MyPage />} />
          <Route path="/contentView" element={<ContentView />} />
          <Route path="/todoList" element={<ToDoList />} />
          <Route path="/chat" element={<ChatMain />} />
        </Routes>
      </Router>
    </SnackbarProvider>
   </ThemeProvider>
 );
}

export default App;