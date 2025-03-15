import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  CircularProgress
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SaveIcon from "@mui/icons-material/Save";
import ky from "ky";
import { useNavigate } from "react-router-dom";
import { validatePassword } from "../../util/validator";
import { userPath } from "../../util/constant";
import { useStore } from "../../redux/store/store";
import { uploadProfileImage } from "../../aws/s3Storage";

const UserInfo = () => {
  // State management
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { userId } = useStore();
  const { userImagePath, setUserImagePath } = useStore();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

// 프로필 이미지 변경 핸들러
const handleProfileImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const token = localStorage.getItem('jwt');

  try {
    setImageLoading(true);
    setUserImagePath(URL.createObjectURL(file));
    
    // 프로필 전용 업로드 함수 사용
    const onProgress = (progress) => {
      setUploadProgress(progress);
    };
    
    const uploadResult = await uploadProfileImage(file, userId, onProgress);
    console.log("S3 프로필 이미지 업로드 결과:", uploadResult);
    
    // 서버에 프로필 이미지 경로 업데이트
    const updateData = {
      userId: userId,
      imagePath: uploadResult.path,
      imageUrl: uploadResult.url
    };
    
    // 백엔드 API 호출
    const response = await ky.post(`${userPath}/image`, {
      json: updateData,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    // 업로드 성공 후 서명된 URL로 이미지 경로 업데이트
    setUserImagePath(uploadResult.url);
    console.log("서명된 URL:", uploadResult.url);
    console.log("URL 길이:", uploadResult.url.length);
    console.log("URL 구성요소:", new URL(uploadResult.url));
    setAlertSeverity("success");
    setAlertMessage("프로필 이미지가 성공적으로 변경되었습니다.");
    setAlertOpen(true);
  } catch (error) {
    console.error("이미지 업로드 에러:", error);
    setAlertSeverity("error");
    setAlertMessage("이미지 업로드 중 오류가 발생했습니다.");
    setAlertOpen(true);
  } finally {
    setImageLoading(false);
    setUploadProgress(0);
  }
};

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!validatePassword(password)) {
      setAlertSeverity("error");
      setAlertMessage("비밀번호는 4글자 이상 16글자 이하로 설정해주세요.");
      setAlertOpen(true);
      return;
    }

    if (password !== confirmPassword) {
      setAlertSeverity("error");
      setAlertMessage("비밀번호가 일치하지 않습니다.");
      setAlertOpen(true);
      return;
    }

    setLoading(true);
    const data = {
      userId: userId,
      password: password,
    };

    try {
      const response = await ky.post(`${userPath}/password`, {
        json: data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        setAlertSeverity("success");
        setAlertMessage("비밀번호가 성공적으로 변경되었습니다.");
        setAlertOpen(true);
        
        // Clear password fields
        setPassword("");
        setConfirmPassword("");
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      setAlertSeverity("error");
      setAlertMessage("비밀번호 변경 중 오류가 발생했습니다.");
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h5" fontWeight="medium" color="primary" gutterBottom>
              계정 정보
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box mb={4}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                사용자 ID
              </Typography>
              <Typography variant="h6">
                {userId}
              </Typography>
            </Box>
            
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              비밀번호 변경
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                label="새 비밀번호"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="비밀번호는 4글자 이상 16글자 이하로 설정해주세요."
              />
              
              <TextField
                label="비밀번호 확인"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                error={confirmPassword !== "" && password !== confirmPassword}
                helperText={
                  confirmPassword !== "" && password !== confirmPassword
                    ? "비밀번호가 일치하지 않습니다."
                    : ""
                }
              />
              
              <Box mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  fullWidth={isMobile}
                  size="large"
                >
                  {loading ? "처리 중..." : "비밀번호 변경"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Typography variant="h5" fontWeight="medium" color="primary" gutterBottom align="center">
              프로필 이미지
            </Typography>
            <Divider sx={{ mb: 4, width: '100%' }} />
            
            <Box
              sx={{
                position: 'relative',
                mb: 3,
              }}
            >
              {imageLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1,
                    borderRadius: '50%',
                  }}
                >
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress variant="determinate" value={uploadProgress} color="primary" />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary">
                        {`${Math.round(uploadProgress)}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              <Avatar
                alt={`${userId}의 프로필`}
                src={userImagePath}
                sx={{
                  width: 200,
                  height: 200,
                  boxShadow: theme.shadows[4],
                  border: `4px solid ${theme.palette.background.paper}`,
                }}
              />
            </Box>
            
            <CardActions>
              <Button
                variant="contained"
                component="label"
                color="primary"
                startIcon={<PhotoCameraIcon />}
                disabled={imageLoading}
                size="large"
              >
                이미지 변경
                <input
                  type="file"
                  hidden
                  onChange={handleProfileImageChange}
                  accept="image/*"
                />
              </Button>
            </CardActions>
            
            {userImagePath && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                S3에 저장된 프로필 이미지 ({imageLoading ? '업로드 중...' : '완료'})
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Alert Notification */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlertOpen(false)}
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default UserInfo;