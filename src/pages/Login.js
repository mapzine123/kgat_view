import React, { useState } from "react";
import { Container, Typography, TextField, Button, Box, Paper } from "@mui/material";
import { LoginOutlined } from '@mui/icons-material';
import { useNavigate, Link } from "react-router-dom";
import ky from "ky";
import { useStore } from "../redux/store/store";
import { authPath } from "../util/constant";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [wrongInfo, setWrongInfo] = useState(false);

  const { userId, setUserId } = useStore();
  const { authenticated, setAuthenticated } = useStore();
  const { userImagePath, setUserImagePath } = useStore();

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "id") setId(value);
    if (name === "password") setPassword(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await ky.post(`${authPath}/login`, {
        json: { id, password },
      });

      const data = await response.json();
      const token = data.token;
      const userData = data.user;

      localStorage.setItem("jwt", token);
      
      // zustand 상태에 사용자 정보 저장
      
      setUserId(userData.id);
      setAuthenticated(true);
      setUserImagePath(userData.profileImagePath);

      sessionStorage.setItem("userId", JSON.stringify(userData.id));

      // 로그인 성공 시 index.js로 이동
      navigate("/");
    } catch (error) {
      setWrongInfo(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 65px)',
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#FAFAFA',
        py: 8
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 6 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white'
          }}
        >
          {/* 로고 영역 */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1976D2',
                mb: 1
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#666' }}
            >
              서비스를 이용하시려면 로그인해주세요
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
          <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="id"
              label="아이디"
              name="id"
              autoFocus
              value={id}
              onChange={handleChange}
              autoComplete="off"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#E0E0E0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#BDBDBD'
                  }
                },
                '& .MuiInputBase-input': {  // 입력 텍스트 색상
                  color: '#333'
                },
                '& .MuiInputLabel-root': {  // placeholder(label) 색상
                  color: '#666'
                },
                '& .MuiInputLabel-root.Mui-focused': {  // 포커스시 label 색상
                  color: '#1976D2'
                }
              }}
            />
            <TextField
              variant="outlined"
              required
              fullWidth
              id="password"
              label="비밀번호"
              name="password"
              type="password"
              value={password}
              onChange={handleChange}
              autoComplete="off"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#E0E0E0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#BDBDBD'
                  }
                },
                '& .MuiInputBase-input': {  
                  color: '#333'  // 입력 텍스트 색상
                },
                '& .MuiInputLabel-root': {  
                  color: '#666'  // placeholder 색상
                },
                '& .MuiInputLabel-root.Mui-focused': {  
                  color: '#1976D2'  // 포커스시 label 색상
                }
              }}
            />
            
            {wrongInfo && (
              <Typography 
                variant="body2" 
                color="error" 
                sx={{ 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                아이디 혹은 비밀번호가 일치하지 않습니다.
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginOutlined />}
              sx={{
                py: 1.5,
                bgcolor: '#1976D2',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#1565C0'
                }
              }}
            >
              로그인
            </Button>
          </form>

          {/* 회원가입 링크 */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              계정이 없으신가요?{' '}
              <Link 
                to="/signup" 
                style={{ 
                  color: '#1976D2', 
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                회원가입
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
