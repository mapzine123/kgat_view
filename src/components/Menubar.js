import { Box, AppBar, Button, Toolbar, Container, Typography } from "@mui/material";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../redux/store/store";

export default function Menubar() {
  const navigate = useNavigate();

  const { userId, setUserId } = useStore();
  const { authenticated, setAuthenticated } = useStore();
  const { userImagePath, setUserImagePath } = useStore();


  
  const handleLogout = () => {
    setUserId(null);
    setAuthenticated(false);
    setUserImagePath(null);
    localStorage.removeItem("jwt");
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="md">
        <Toolbar 
          sx={{ 
            px: { xs: 0, sm: 2 },
            justifyContent: 'space-between',
            minHeight: '64px'
          }}
        >
          {/* 왼쪽: 로고/홈 */}
          <Typography 
            component={Link} 
            to="/"
            sx={{ 
              textDecoration: 'none',
              color: '#1976D2',
              fontWeight: 700,
              fontSize: '1.25rem'
            }}
          >
            로고
          </Typography>

          {/* 중앙: 네비게이션 메뉴 */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              alignItems: 'center'
            }}
          >
            <Button 
              component={Link} 
              to="/todoList"
              sx={{ 
                color: '#666',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { color: '#1976D2' }
              }}
            >
              Todo List
            </Button>

            <Button 
              component={Link} 
              to="/chat"
              sx={{ 
                color: '#666',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { color: '#1976D2' }
              }}
            >
              Chatting
            </Button>
          </Box>

          {/* 오른쪽: 인증 관련 버튼 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {userId ? (
              <>
                <Button 
                  component={Link} 
                  to="/mypage"
                  sx={{ 
                    color: '#666',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': { color: '#1976D2' }
                  }}
                >
                  My Page
                </Button>
                <Button 
                  onClick={handleLogout}
                  sx={{ 
                    color: '#666',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': { color: '#1976D2' }
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  component={Link} 
                  to="/login"
                  variant="outlined"
                  sx={{ 
                    borderColor: '#1976D2',
                    color: '#1976D2',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: '#1565C0',
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  Login
                </Button>
                <Button 
                  component={Link} 
                  to="/signup"
                  variant="contained"
                  sx={{ 
                    bgcolor: '#1976D2',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': { bgcolor: '#1565C0' }
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
