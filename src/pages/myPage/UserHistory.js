import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Pagination,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Card,
  useTheme,
  useMediaQuery,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import ky from "ky";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArticleList from "../article/ArticleList";
import { articlePath } from "../../util/constant";
import { useStore } from "../../redux/store/store";

const UserHistory = () => {
  // State declarations
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(10);

  const { userId } = useStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch posts on component mount and when dependencies change
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Add sort parameter to API request
        const response = await ky
          .get(`${articlePath}/user?page=${currentPage - 1}&userId=${userId}&sort=${sortOrder}&size=${postsPerPage}`)
          .json();
        
        setPosts(response.content || []);
        setTotalPages(response.totalPages || 1);
        setTotalPosts(response.totalElements || 0);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, userId, sortOrder, postsPerPage]);

  // Page change handler
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sort order change handler
  const handleSortChange = (order) => {
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when changing sort order
  };

  // Posts per page change handler
  const handlePostsPerPageChange = (event) => {
    setPostsPerPage(event.target.value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Conditional rendering components
  const renderContent = () => {
    if (loading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          게시물을 불러오는 중 오류가 발생했습니다: {error}
        </Alert>
      );
    }

    if (posts.length === 0) {
      return (
        <EmptyState
          icon={<CalendarTodayIcon sx={{ fontSize: 60, opacity: 0.5 }} />}
          title="작성한 글이 없습니다"
          description="아직 작성한 글이 없습니다. 첫 게시물을 작성해보세요!"
          actionButton={
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.location.href = "/write"}
            >
              글 작성하기
            </Button>
          }
        />
      );
    }

    return <ArticleList posts={posts} setPosts={setPosts} />;
  };

  // If EmptyState component doesn't exist, here's a simple implementation
  const EmptyState = ({ icon, title, description, actionButton }) => (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      p={5} 
      my={4}
      sx={{ 
        backgroundColor: theme.palette.background.default,
        borderRadius: 2,
        minHeight: 300
      }}
    >
      <Box color="text.secondary" mb={2}>
        {icon}
      </Box>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" mb={3}>
        {description}
      </Typography>
      {actionButton}
    </Box>
  );

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h5" fontWeight="medium" color="primary" gutterBottom>
          내가 쓴 글
        </Typography>
        <Divider />
      </Box>

      {/* Header with stats and controls */}
      <Box
        display="flex"
        flexDirection={isSmall ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isSmall ? "flex-start" : "center"}
        mb={3}
        gap={2}
      >
        <Box>
          <Typography variant="subtitle1" color="text.secondary">
            총 <Chip label={totalPosts} color="primary" size="small" /> 개의 글을 작성했습니다
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          width={isSmall ? "100%" : "auto"}
        >
          {/* Sort controls */}
          <Box>
            <Tooltip title="정렬">
              <IconButton 
                color={sortOrder !== "newest" ? "primary" : "default"}
                onClick={() => handleSortChange(sortOrder === "newest" ? "oldest" : "newest")}
                size="small"
              >
                <SortIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" component="span" ml={1}>
              {sortOrder === "newest" ? "최신순" : "오래된순"}
            </Typography>
          </Box>

          {/* Items per page selector */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>표시 개수</InputLabel>
            <Select
              value={postsPerPage}
              onChange={handlePostsPerPageChange}
              label="표시 개수"
            >
              <MenuItem value={5}>5개</MenuItem>
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={20}>20개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Main content area */}
      <Box mb={4}>
        {renderContent()}
      </Box>

      {/* Pagination */}
      {!loading && posts.length > 0 && (
        <Box
          display="flex"
          justifyContent="center"
          mt={4}
          position={isMobile ? "static" : "sticky"}
          bottom={isMobile ? "auto" : theme.spacing(4)}
          zIndex={1}
        >
          <Paper
            elevation={3}
            sx={{
              p: 1.5,
              px: 2,
              borderRadius: 5,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
              siblingCount={isMobile ? 0 : 1}
              size={isMobile ? "small" : "medium"}
              shape="rounded"
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default UserHistory;