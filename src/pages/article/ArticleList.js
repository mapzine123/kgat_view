import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  List,
  Menu,
  MenuItem,
} from "@mui/material";
import { useStore } from "../../redux/store/store";
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ky from "ky";
import { articlePath, modifyMode, userPath } from "../../util/constant";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../util/dateUtil";

const ArticleList = ({ posts, setPosts }) => {
  const { userId } = useStore();
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [profileImages, setProfileImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const navigator = useNavigate();

  // 프로필 이미지 로드 로직
  useEffect(() => {
    const fetchProfileImages = async () => {
      const uniqueUserIds = [...new Set(posts.map(post => post.articleWriter))];
      
      const newProfileImages = { ...profileImages };
      const newLoadingImages = { ...loadingImages };
      
      for (const writerId of uniqueUserIds) {
        if (profileImages[writerId]) continue;
        
        try {
          newLoadingImages[writerId] = true;
          const token = localStorage.getItem('jwt');
          
          // 수정된 부분: 명확하게 writerId를 URL에 포함하고 credentials 설정 제거
          const response = await ky.get(`${userPath}/profile?userId=${writerId}`, {
            headers: token ? {
              "Authorization": `Bearer ${token}`
            } : {}
          }).json();
          
          // 응답 구조 로깅하여 디버깅
          console.log(`프로필 응답 (${writerId}):`, response);
          
          if (response && response.imageUrl) {
            newProfileImages[writerId] = response.imageUrl;
          }
        } catch (error) {
          console.error(`프로필 이미지 로드 오류 (${writerId}):`, error);
        } finally {
          newLoadingImages[writerId] = false;
        }
      }
      
      setProfileImages(newProfileImages);
      setLoadingImages(newLoadingImages);
    };
    
    if (posts && posts.length > 0) {
      fetchProfileImages();
    }
  }, [posts]);

  // 게시물 메뉴 핸들러
  const handleClick = (e, articleId) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setSelectedArticleId(articleId);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 게시물 수정 핸들러
  const handleModify = (
    e,
    selectedArticleId,
    prevTitle,
    prevContent,
    mode
  ) => {
    e.stopPropagation();
    navigator("/write", {
      state: {
        articleId: selectedArticleId,
        prevTitle: prevTitle,
        prevContent: prevContent,
        mode,
      },
    });
  };

  // 게시물 삭제 핸들러
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (selectedArticleId === null) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt');
      const response = await ky.delete(`${articlePath}`, {
        json: {
          userId,
          articleId: selectedArticleId,
        },
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ''
        },
      });

      if (response.ok) {
        setPosts(prevPosts => {
          const postToRemove = prevPosts.find(post => post.articleId === selectedArticleId);
          if (!postToRemove) {
            console.warn("삭제할 게시글을 찾을 수 없습니다:", selectedArticleId);
            return prevPosts;
          }
          
          const newPosts = prevPosts.filter(post => post !== postToRemove);
          return newPosts;
        });
        alert("게시글이 삭제되었습니다.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      handleClose();
    }
  };

  // 좋아요 핸들러
  const handleLike = async (post) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      const response = await ky.post(`${articlePath}/reaction/like`, {
        json: {
          userId,
          articleId: post.articleId,
        },
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem('jwt') ? `Bearer ${localStorage.getItem('jwt')}` : ''
        },
      });

      if (response.ok) {
        const updatedArticle = await response.json();
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.articleId === post.articleId
              ? {
                  ...p,
                  likeCount: updatedArticle.likeCount,
                  isLike: !p.isLike,
                  isHate: false,
                  hateCount: updatedArticle.hateCount,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 싫어요 핸들러
  const handleHate = async (post) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      const response = await ky.post(`${articlePath}/reaction/hate`, {
        json: {
          userId,
          articleId: post.articleId,
        },
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem('jwt') ? `Bearer ${localStorage.getItem('jwt')}` : ''
        },
      });

      if (response.ok) {
        const updatedArticle = await response.json();
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.articleId === post.articleId
              ? {
                  ...p,
                  likeCount: updatedArticle.likeCount,
                  isLike: false,
                  isHate: !p.isHate,
                  hateCount: updatedArticle.hateCount,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 게시글 상세 보기
  const handleContentView = (post) => {
    navigator("/contentView", {
      state: {
        post: post,
      },
    });
  };

  return (
    <Box 
      sx={{ 
        maxWidth: '680px', 
        margin: '0 auto', 
        py: 4,
        px: { xs: 2, sm: 0 }
      }}
    >
      {posts.length === 0 ? (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          align="center" 
          sx={{ mt: 4 }}
        >
          아직 작성된 게시글이 없습니다.
        </Typography>
      ) : (
        <List sx={{ width: '100%', p: 0 }}>
          {posts.map((post, index) => (
            <Box 
              key={post.articleId || index}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                pb: 3,
                mb: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }
              }}
              onClick={() => handleContentView(post)}
            >
              {/* 프로필 이미지 */}
              <Avatar
                src={profileImages[post.articleWriter]}
                sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: !profileImages[post.articleWriter] ? 'primary.main' : undefined
                }}
              >
                {!profileImages[post.articleWriter] && post.articleWriter 
                  ? post.articleWriter.charAt(0).toUpperCase() 
                  : ''}
              </Avatar>

              {/* 본문 내용 */}
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600,
                    mb: 0.5
                  }}
                >
                  {post.articleTitle}
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="body2">
                    {post.articleWriter}
                  </Typography>
                  <Box 
                    sx={{ 
                      width: 4, 
                      height: 4, 
                      bgcolor: 'text.secondary', 
                      borderRadius: '50%' 
                    }} 
                  />
                  <Typography variant="body2">
                    {formatDate(post.createdAt)}
                  </Typography>
                </Box>
              </Box>

              {/* 액션 버튼 */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}
              >
                <Button
                  startIcon={post.isLike ? <ThumbUpIcon color="primary" /> : <ThumbUpOutlinedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post);
                  }}
                  size="small"
                  sx={{ 
                    minWidth: 'auto', 
                    textTransform: 'none',
                    color: post.isLike ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {post.likeCount}
                </Button>

                <Button
                  startIcon={post.isHate ? <ThumbDownIcon color="error" /> : <ThumbDownOutlinedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHate(post);
                  }}
                  size="small"
                  sx={{ 
                    minWidth: 'auto', 
                    textTransform: 'none',
                    color: post.isHate ? 'error.main' : 'text.secondary'
                  }}
                >
                  {post.hateCount}
                </Button>

                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  조회 {post.viewCount}
                </Typography>

                {/* 수정/삭제 메뉴 */}
                {post.articleWriter === userId && (
                  <>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation(); // 게시글 클릭 이벤트 방지
                        handleClick(e, post.articleId);
                      }}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={open && selectedArticleId === post.articleId}
                      onClose={handleClose}
                      onClick={(e) => e.stopPropagation()} // 메뉴 클릭 시 게시글 클릭 방지
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem 
                        onClick={(e) => {
                          e.stopPropagation(); // 게시글 클릭 이벤트 방지
                          handleModify(
                            e, 
                            post.articleId, 
                            post.articleTitle, 
                            post.articleContent, 
                            modifyMode
                          );
                        }}
                      >
                        수정하기
                      </MenuItem>
                      <MenuItem 
                        onClick={(e) => {
                          e.stopPropagation(); // 게시글 클릭 이벤트 방지
                          handleDelete(e);
                        }} 
                        sx={{ color: 'error.main' }}
                      >
                        삭제하기
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ArticleList;