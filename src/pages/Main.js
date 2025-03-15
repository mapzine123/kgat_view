import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TextField, 
  Pagination, 
  Box, 
  Container, 
  Button,
  InputAdornment,
  Typography
} from "@mui/material";
import { Search, Edit } from "@mui/icons-material";
import ky from "ky";
import { useStore } from "../redux/store/store";
import { articlePath, writeMode } from "../util/constant";
import ArticleList from "./article/ArticleList";

const Main = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { userId } = useStore();

  const fetchPosts = async (page, query = "") => {
    try {
      const response = await ky
        .get(
          `${articlePath}?page=${page - 1}&search=${encodeURIComponent(
            query
          )}&userId=${userId}`
        )
        .json();
      setPosts(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("오류 발생!");
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchPosts(value);
  };

  const handleWrite = (e, mode) => {
    if (userId === null) {
      alert("로그인을 해야 사용할 수 있는 기능입니다.");
      navigate("/login");
      return;
    }
    navigate("/write", {
      state: {
        selectedArticleNum: "",
        prevTitle: "",
        prevContent: "",
        mode,
      },
    });
  };

  const handleSearch = () => {
    fetchPosts(1, searchQuery);
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh' }}>
      <Container 
        maxWidth="md" 
        sx={{
          pt: 5,
          pb: 8,
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 상단 검색 및 글쓰기 영역 */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 4,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* 검색 영역 */}
          <TextField
            size="small"
            placeholder="검색어를 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{
              width: { xs: '100%', sm: '300px' },
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#E0E0E0'
                },
                '&:hover fieldset': {
                  borderColor: '#BDBDBD'
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#757575' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* 글쓰기 버튼 */}
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={(e) => handleWrite(e, writeMode)}
            sx={{
              height: 40,
              px: 3,
              bgcolor: '#1976D2',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#1565C0'
              }
            }}
          >
            새 글 작성
          </Button>
        </Box>

        {/* 게시글 목록 */}
        <Box sx={{ bgcolor: 'white', borderRadius: 1, overflow: 'hidden' }}>
          <ArticleList posts={posts} setPosts={setPosts} />
        </Box>

        {/* 하단 페이지네이션 */}
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'center',
            mt: 4
          }}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#424242'
              }
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Main;