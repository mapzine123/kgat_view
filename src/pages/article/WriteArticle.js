import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box,
  Paper,
  CircularProgress
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ky from "ky";
import { useStore } from "../../redux/store/store";
import { articlePath, modifyMode, writeMode } from "../../util/constant";
import { uploadImage, deleteImage } from "../../aws/s3Storage"
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// 하이라이트.js 설정
hljs.configure({
  languages: ['javascript', 'python', 'java', 'html', 'css', 'cpp', 'csharp']
});

// 레거시 findDOMNode 경고 억제를 위한 래퍼 컴포넌트
const QuillWrapper = ({ forwardedRef, ...props }) => {
  return <ReactQuill ref={forwardedRef} {...props} />;
};

const WriteArticle = () => {
  const location = useLocation();

  // 디버깅을 위해 location.state 전체를 출력
  useEffect(() => {
    console.log('Location State:', location.state);
  }, [location.state]);

  const {
    articleId = 0,
    prevTitle = "",
    prevContent = "",
    prevImages = [], 
    mode = writeMode,
  } = location.state || {};

  const [title, setTitle] = useState(prevTitle);
  const [content, setContent] = useState(prevContent || '');
  const [images, setImages] = useState(prevImages || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Quill 참조를 위한 ref 생성
  const quillRef = useRef(null);

  // Quill 모듈 메모이제이션
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
    syntax: {
      highlight: text => hljs.highlightAuto(text).value,
    },
    keyboard: {
      bindings: {
        // 코드 블록 단축키 (Ctrl+Shift+C)
        'code block': {
          key: 'C',
          shortKey: true,
          shiftKey: true,
          handler: function(range) {
            // 현재 에디터 인스턴스 가져오기
            const quill = this.quill;
            
            // 현재 선택된 텍스트 가져오기
            const selectedText = quill.getText(range.index, range.length);
            
            // 코드 블록으로 변환
            quill.format('code-block', true);
          }
        },
        // 코드 블록 해제 단축키 (Ctrl+Shift+N)
        'remove code block': {
          key: 'N',
          shortKey: true,
          shiftKey: true,
          handler: function(range) {
            const quill = this.quill;
            quill.format('code-block', false);
          }
        }
      }
    }
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'code-block'
  ], []);

  const { userId } = useStore();
  const navigator = useNavigate();

  useEffect(() => {
    if (userId === null) {
      navigator("/login");
    }
  }, [userId, navigator]);

  // 에디터가 사라지는 문제 방지를 위한 콜백
  const handleContentChange = (value) => {
    // 빈 문자열이 아닌 경우에만 상태 업데이트
    setContent(value === '<p><br></p>' ? '' : (value || ''));
  };

  // 이미지 업로드 핸들러 (퀼 에디터에 직접 이미지 삽입)
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if(!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 선택한 파일 업로드
      const uploadedImage = await uploadImage(files[0], userId, (progress) => {
        setUploadProgress(progress);
      });
      
      // 이미지 목록에 추가
      setImages(prevImages => [...prevImages, uploadedImage]);
      
      // Quill 에디터에 이미지 삽입
      if (quillRef.current) {
        const quillEditor = quillRef.current.getEditor();
        const range = quillEditor.getSelection(true);
        quillEditor.insertEmbed(range.index, 'image', uploadedImage.url);
      }
      
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
      console.error("Error removing image: ", error);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const article = {
      articleId: articleId,
      articleTitle: title,
      articleContent: content,
      articleWriter: userId,
      images: images.map(img => ({ url: img.url, name: img.name })), // 이미지 정보 추가
    };

    console.log(article);

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
        console.log(article);

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
            <Typography variant="h6" gutterBottom>본문</Typography>
            <QuillWrapper 
              forwardedRef={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              style={{ height: '300px', marginBottom: '50px' }}
            />
          </Box>

          <Box mb={3}>
            <input
              accept="image/*"
              id="upload-image-button"
              type="file"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <label htmlFor="upload-image-button">
              <Button
                variant="contained"
                component="span"
                disabled={uploading}
                sx={{ borderRadius: 2 }}
              >
                이미지 업로드
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

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigator("/")}
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