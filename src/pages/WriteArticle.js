import React, { useEffect, useState } from "react";
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box,
  Paper,
  Grid,
  IconButton,
  CircularProgress
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ky from "ky";
import { useStore } from "../redux/store/store";
import { articlePath, modifyMode, writeMode } from "../util/constant";
import { uploadImage, deleteImage } from "../aws/s3Storage";

const WriteArticle = () => {
  const location = useLocation();

  const {
    selectedArticleNum = 0,
    prevTitle = "",
    prevContent = "",
    prevImages = [], // 기본값 추가
    mode = writeMode, // 중괄호 제거 (올바른 기본값 설정)
  } = location.state || {};


  const [title, setTitle] = useState(prevTitle);
  const [content, setContent] = useState(prevContent);
  const [images, setImages] = useState(prevImages || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { userId } = useStore();
  const navigator = useNavigate();

  useEffect(() => {
    if (userId === null) {
      navigator("/login");
    }
  }, []);

  // 이미지를 본문에 삽입하는 함수
  const insertImageToContent = (imageUrl) => {
    const imageTag = `\n![이미지](${imageUrl})\n`;
    setContent(prevContent => prevContent + imageTag);
  };

    // 취소 처리 함수 추가
    const handleCancel = () => {
      // 작성 취소시 업로드한 이미지 삭제
      if (images.length > 0 && mode === writeMode) {
        images.forEach(async (image) => {
          if (image.path) {
            try {
              await deleteImage(image.path);
            } catch (error) {
              console.error("Error cleaning up images:", error);
            }
          }
        });
      }
      navigator("/");
    };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if(!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 선택한 모든 파일을 업로드
      const uploadPromises = Array.from(files).map(file => {
        return uploadImage(file, userId, (progress) => {
          setUploadProgress(progress);
        });
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prevImages => [...prevImages, ...uploadedImages]);
    } catch(error) {
      console.error("Error uploading images: ", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  }

    const handleRemoveImage = async (index) => {
      try {
        const imageToRemove = images[index];

        // Firebase에서 이미지 삭제
        if(imageToRemove.path) {
          await deleteImage(imageToRemove.path);
        }

        // 상태에서 이미지 제거
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
      } catch(error) {
        console.error("Error removeing image: ", error);
        alert("이미지 삭제 중 오류가 발생했습니다.");
      }
    }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const article = {
      articleNum: selectedArticleNum,
      articleTitle: title,
      articleContent: content,
      articleWriter: userId,
      images: images.map(img => ({ url: img.url, name: img.name })), // 이미지 정보 추가
    };

    try {
      if (mode === writeMode) {
        await ky.post(`${articlePath}`, {
          json: article,
          headers: {
            "Content-Type": "application/json",
          },
        });
        alert("성공적으로 작성되었습니다.");
      } else if (mode === modifyMode) {
        await ky.put(`${articlePath}`, {
          json: article,
          headers: {
            "Content-Type": "application/json",
          },
        });
        alert("성공적으로 수정되었습니다.");
      }
      navigator("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px", marginBottom: "40px" }}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          {mode === writeMode ? "새 글 작성" : "글 수정"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box mb={3}>
            <TextField
              fullWidth
              label="제목"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoComplete="off"
              sx={{ borderRadius: 1 }}
            />
          </Box>
          <Box mb={3}>
            <TextField
              fullWidth
              label="본문"
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={12}
              required
              autoComplete="off"
              sx={{ borderRadius: 1 }}
            />
          </Box>

          {/* 이미지 업로드 섹션 */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              이미지 첨부
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <input
                accept="image/*"
                id="upload-image-button"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <label htmlFor="upload-image-button">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<AddPhotoAlternateIcon />}
                  disabled={uploading}
                  sx={{ borderRadius: 2 }}
                >
                  이미지 선택
                </Button>
              </label>
              {uploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {uploadProgress}% 업로드 중...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {images.map((image, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`업로드 이미지 ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          display: 'block',
                          cursor: 'pointer',
                        }}
                        onClick={() => insertImageToContent(image.url)}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          borderRadius: '0 0 0 8px',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{ color: 'white' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'center',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      클릭하여 본문에 삽입
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* 버튼 섹션 */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              sx={{ borderRadius: 2 }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={uploading}
              sx={{ borderRadius: 2 }}
            >
              {mode === writeMode ? "글 작성" : "글 수정"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default WriteArticle;