import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Collapse,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Box,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ky from "ky";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStore } from "../../redux/store/store";
import { commentPath, modifyMode, userPath } from "../../util/constant";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { formatDate } from "../../util/dateUtil";
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import { articlePath } from "../../util/constant";

const ContentView = () => {
  const location = useLocation();
  const { post } = location.state || {};
  const { userId } = useStore();

// 프로필 이미지 관리 상태 추가
const [profileImages, setProfileImages] = useState({});
const [loadingImages, setLoadingImages] = useState({});

// 원본 댓글용 메뉴 관리 상태
const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState(null);
const [currentCommentId, setCurrentCommentId] = useState(null);
const [currentPost, setCurrentPost] = useState(post || {});

// 대댓글용 메뉴 관리 상태
const [subCommentMenuAnchorEl, setSubCommentMenuAnchorEl] = useState(null);
const [currentSubCommentId, setCurrentSubCommentId] = useState(null);

  const [commentText, setCommentText] = useState("");
  const [modifyText, setModifyText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [selectedCommentId, setSelectedCommentId] = useState("");
  const [textFieldFocus, setTextFieldFucus] = useState(false);
  const [mode, setMode] = useState("view");

  const [subCommentText, setSubCommentText] = useState(""); // 대댓글 텍스트 상태 추가
  const [replyComment, setReplyComment] = useState(0);
  const [openReplys, setOpenResplys] = useState(new Set());
  const [subCommentFocus, setSubCommentFocus] = useState(false);
  const [modifyedSubCommentId, setModifyedSubCommentId] = useState("");
  const [subCommentModifyText, setSubCommentModifyText] = useState("");

  useEffect(() => {
    if (post) {
      const fetchComments = async () => {
        try {
          const response = await ky
            .get(`${commentPath}/${post.articleId}`, {
              searchParams: {
                userId: userId,
              },
            })
            .json();

          if (response.status === 204) {
            setComments([]);
            setCommentCount(0);
          } else {
            setComments(response.content || []);
            setCommentCount(response.content ? response.content.length : 0);
          }
        } catch (error) {
          console.error(error);
          setComments([]);
          setCommentCount(0);
        }
      };
      fetchComments();
          // 게시글 작성자 프로필 이미지 로드
      fetchProfileImage(post.articleWriter || post.author);
    }
  }, [commentCount, post]);

// 댓글 로드 후 모든 댓글 작성자의 프로필 이미지 로드
useEffect(() => {
  if (comments.length > 0) {
    // 모든 댓글 작성자의 고유 ID 목록 추출
    const userIds = new Set(comments.map(comment => comment.userId));
    
    // 각 작성자의 프로필 이미지 로드
    userIds.forEach(commentUserId => {
      fetchProfileImage(commentUserId);
    });

    // 대댓글 작성자 프로필 이미지도 로드
    comments.forEach(comment => {
      if (comment.subComments && comment.subComments.length > 0) {
        comment.subComments.forEach(subComment => {
          fetchProfileImage(subComment.userId);
        });
      }
    });
  }
}, [comments]);

  if (!post) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          No post found.
        </Typography>
      </Container>
    );
  }

// 게시글 좋아요 기능
const handleArticleLike = async () => {
  if (userId === null) {
    alert("로그인이 필요한 기능입니다.");
    return;
  }

  try {
    const response = await ky.post(`${articlePath}/reaction/like`, {
      json: {
        userId,
        articleId: currentPost.articleId,
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem('jwt') ? `Bearer ${localStorage.getItem('jwt')}` : ''
      },
    });

    if (response.ok) {
      const updatedArticle = await response.json();
      setCurrentPost(prev => ({
        ...prev,
        likeCount: updatedArticle.likeCount,
        isLike: !prev.isLike,
        isHate: false,
        hateCount: updatedArticle.hateCount
      }));
    }
  } catch (error) {
    console.error("게시글 좋아요 처리 오류:", error);
  }
};

// 게시글 싫어요 기능
const handleArticleHate = async () => {
  if (userId === null) {
    alert("로그인이 필요한 기능입니다.");
    return;
  }

  try {
    const response = await ky.post(`${articlePath}/reaction/hate`, {
      json: {
        userId,
        articleId: currentPost.articleId,
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem('jwt') ? `Bearer ${localStorage.getItem('jwt')}` : ''
      },
    });

    if (response.ok) {
      const updatedArticle = await response.json();
      setCurrentPost(prev => ({
        ...prev,
        likeCount: updatedArticle.likeCount,
        isLike: false,
        isHate: !prev.isHate,
        hateCount: updatedArticle.hateCount
      }));
    }
  } catch (error) {
    console.error("게시글 싫어요 처리 오류:", error);
  }
};

// 프로필 이미지 가져오는 함수 추가
const fetchProfileImage = async (userIdToFetch) => {
  // 이미 가져온 이미지거나 로딩 중이면 스킵
  if (profileImages[userIdToFetch] || loadingImages[userIdToFetch]) {
    return;
  }

  try {
    setLoadingImages(prev => ({ ...prev, [userIdToFetch]: true }));
    
    const token = localStorage.getItem('jwt');
    const response = await ky.get(`${userPath}/profile?userId=${userIdToFetch}`, {
      headers: token ? {
        "Authorization": `Bearer ${token}`
      } : {},
      credentials: 'include'
    }).json();
    
    if (response && response.imageUrl) {
      setProfileImages(prev => ({ ...prev, [userIdToFetch]: response.imageUrl }));
    }
  } catch (error) {
    console.error(`프로필 이미지 로드 실패 (${userIdToFetch}):`, error);
  } finally {
    setLoadingImages(prev => ({ ...prev, [userIdToFetch]: false }));
  }
};

  const handleLike = async (commentId) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const data = {
      commentId: commentId,
      userId: userId,
    };

    try {
      const response = await ky.post(`${commentPath}/reaction/like`, {
        json: data,
      });

      if (response.ok) {
        const updateComment = await response.json();
        await setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  likeCount: updateComment.likeCount,
                  isLike: !comment.isLike,
                  isHate: false,
                  hateCount: updateComment.hateCount,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleHate = async (commentId) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const data = {
      commentId: commentId,
      userId: userId,
    };

    try {
      const response = await ky.post(`${commentPath}/reaction/hate`, {
        json: data,
      });

      if (response.ok) {
        const updateComment = await response.json();
        await setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  likeCount: updateComment.likeCount,
                  isLike: false,
                  isHate: !comment.isHate,
                  hateCount: updateComment.hateCount,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 댓글 추가
  const handleCommentSubmit = async () => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }
    const articleId = post.articleId;
    const data = {
      articleId: articleId,
      userId: userId,
      commentText: commentText,
    };

    try {
      const response = await ky
        .post(`${commentPath}`, {
          json: data,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .json();

      alert("댓글이 작성되었습니다.");
      setComments((comments) => [response, ...comments]);
      setCommentCount((prevCount) => prevCount + 1); // 댓글 개수를 갱신
      setCommentText("");
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (commentId) => {
    setExpandedComments((prevState) => ({
      ...prevState,
      [commentId]: !prevState[commentId],
    }));
  };

  // 원본 댓글 메뉴 열기
  const handleCommentMenuClick = (event, commentId) => {
    setCommentMenuAnchorEl(event.currentTarget);
    setCurrentCommentId(commentId);
  };

  // 원본 댓글 메뉴 닫기
  const handleCommentMenuClose = () => {
    setCommentMenuAnchorEl(null);
    setCurrentCommentId(null);
  };

  // 대댓글 메뉴 열기
  const handleSubCommentMenuClick = (event, subCommentId, parentCommentId) => {
    setSubCommentMenuAnchorEl(event.currentTarget);
    setCurrentSubCommentId(subCommentId);
    // 부모 댓글 ID도 저장 (대댓글 삭제시 필요)
    setCurrentCommentId(parentCommentId);
  };

  // 대댓글 메뉴 닫기
  const handleSubCommentMenuClose = () => {
    setSubCommentMenuAnchorEl(null);
    setCurrentSubCommentId(null);
  };

  const handleModify = (e, commentId) => {
    setSelectedCommentId(commentId);
    setMode(modifyMode);
    handleClose();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setCurrentCommentId(null);
  };

  // 원본 댓글 삭제 핸들러
  const handleCommentDelete = async (commentId) => {
    console.log("handleDelete 실행");
    try {
      const response = await ky.delete(`${commentPath}/${commentId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setComments((prevComments) =>
          prevComments.filter(
            (comment) => comment.commentId !== commentId
          )
        );
        setCommentCount((prevCount) => prevCount - 1);
        handleCommentMenuClose();
      } else {
        alert("댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReport = () => {
    handleClose();
  };

  const handleCancel = () => {
    setMode("view");
    setSelectedCommentId(null); // 수정된 부분: null로 설정
    setModifyText("");
  };

  const handleModifySubmit = async () => {
    const data = {
      commentId: selectedCommentId,
      commentText: modifyText,
    };

    try {
      const response = await ky
        .put(`${commentPath}`, {
          json: data,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .json();

      setComments((comments) =>
        comments.map((comment) =>
          comment.commentId === response.commentId ? response : comment
        )
      );
      setMode("view");
      setSelectedCommentId(0);
      setModifyText("");
    } catch (error) {
      console.error(error);
    }
  };

  // 대댓글 좋아요
  const handleSubCommentLike = async (subComment) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const data = {
      subCommentId: subComment.subCommentId,
      userId: userId,
    };
    try {
      const response = await ky.post(`${commentPath}/subComments/like`, {
        json: data,
      });

      const updatedData = await response.json();
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.commentId === subComment.commentId
            ? {
                ...comment,
                subComments: comment.subComments.map((sc) =>
                  sc.subCommentId === updatedData.subCommentId
                    ? {
                        ...sc,
                        ...updatedData,
                      }
                    : sc
                ),
              }
            : comment
        )
      );
    } catch (error) {
      console.error(error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };
  const handleSubCommentHate = async (subComment) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const data = {
      subCommentId: subComment.subCommentId,
      userId: userId,
    };
    try {
      const response = await ky.post(`${commentPath}/subComments/hate`, {
        json: data,
      });

      const updatedData = await response.json();
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.commentId === subComment.commentId
            ? {
                ...comment,
                subComments: comment.subComments.map((sc) =>
                  sc.subCommentId === updatedData.subCommentId
                    ? {
                        ...sc,
                        ...updatedData,
                      }
                    : sc
                ),
              }
            : comment
        )
      );
    } catch (error) {
      console.error(error);
      alert("싫어요 처리 중 오류가 발생했습니다.");
    }
  };
  const renderCommentContent = (comment) => {
    const maxLength = 200; // 최대 문자 길이
    const isExpanded = expandedComments[comment.commentId];

    return (
      <>
        <Typography variant="body2" color="textSecondary" component="div">
          {comment.commentText.length > maxLength && !isExpanded
            ? comment.commentText.slice(0, maxLength) + "..."
            : comment.commentText}
        </Typography>
        {comment.commentText.length > maxLength && (
          <Button size="small" onClick={() => toggleExpand(comment.commentId)}>
            {isExpanded ? "접기" : "자세히 보기..."}
          </Button>
        )}
      </>
    );
  };
  // 대댓글 기능
  const handleToggleReplys = (commentId) => {
    setOpenResplys((prevOpenReplys) => {
      const newOpenReplys = new Set(prevOpenReplys);
      if (newOpenReplys.has(commentId)) {
        newOpenReplys.delete(commentId);
      } else {
        newOpenReplys.add(commentId);
        handleGetReplys(commentId);
      }

      return newOpenReplys;
    });
  };

  const handleGetReplys = async (commentId) => {
    try {
      const comment = comments.find((c) => c.commentId === commentId);

      if (comment && comment.subComments.length === 0) {
        const nowCommentId = comment.commentId;
        const response = await ky
          .get(`${commentPath}/subComments/${comment.commentId}`, {
            searchParams: {
              userId: userId,
            },
          })
          .json();
        const newSubComments = response.content;
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.commentId === commentId
              ? {
                  ...c,
                  subComments: newSubComments,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 대댓글 추가
  const handleReplySubmit = async (commentId) => {
    if (userId === null) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const data = {
      commentId: commentId,
      userId: userId,
      subCommentText: subCommentText,
    };

    try {
      const response = await ky
        .post(`${commentPath}/subComments`, {
          json: data,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .json();

      alert("대댓글이 작성되었습니다.");
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.commentId === commentId
            ? {
                ...comment,
                subComments: comment.subComments
                  ? [...comment.subComments, response]
                  : [response],
                subCommentCount: (comment.subCommentCount || 0) + 1, // `subCommentCount` 업데이트
              }
            : comment
        )
      );
      setSubCommentText("");
      setReplyComment(0); // 대댓글 작성 칸 닫기
    } catch (error) {
      console.error(error);
    }
  };

  // 메뉴 기능
  const handleMenuOpen = (event, subCommentId) => {
    setCurrentCommentId(subCommentId);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSubCommentEdit = () => {};

  // 대댓글 삭제
  const handleSubCommentDelete = async (commentId, subCommentId) => {
    try {
      const response = await ky.delete(`${commentPath}/subComments`, {
        json: {
          commentId: commentId,
          subCommentId: subCommentId,
        },
      });

      if (response.ok) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  subComments: comment.subComments.filter(
                    (subComment) => subComment.subCommentId !== subCommentId
                  ),
                  subCommentCount: Math.max(
                    0,
                    (comment.subCommentCount || 0) - 1
                  ),
                }
              : comment
          )
        );
        alert("답글이 삭제되었습니다.");
      } else {
        alert("오류가 발생했습니다.");
      }
    } catch {
      console.error();
    }
  };

  // 대댓글 수정
  const clickSubCommentModify = (subCommentId) => {
    setModifyedSubCommentId(subCommentId);
    setAnchorEl(null);
  };

  const cancelModifyedSubComment = () => {
    setAnchorEl(null);
    setModifyedSubCommentId("");
  }

  const handleSubCommentModifyed = async (commentId) => {
    try {
      const response = await ky.put(`${commentPath}/subComments`, {
        json: {
          subCommentId: modifyedSubCommentId,
          subCommentText:subCommentModifyText
        }
      }).json();

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.commentId === commentId
            ? {
                ...comment,
                subComments: comment.subComments.map((subComment) =>
                  subComment.subCommentId === modifyedSubCommentId
                    ? {
                        ...subComment,
                        subCommentText: subCommentModifyText
                      }
                    : subComment
                )
              }
            : comment
        )
      );

      setModifyedSubCommentId("");
      setSubCommentModifyText(null);
    } catch(error) {
      console.error();
    }
  }

// 프로필 이미지 표시 컴포넌트
const ProfileAvatar = ({ userId, size = 'medium' }) => {
  const isLoading = loadingImages[userId];
  const imageUrl = profileImages[userId];
  
  const sizeProps = {
    small: { width: 36, height: 36 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 }
  };
  
  // 스케일에 따라 아바타 크기 조정
  const avatarSize = sizeProps[size] || sizeProps.medium;
  
  if (isLoading) {
    return <Skeleton variant="circular" {...avatarSize} />;
  }
  
  return (
    <Avatar
      alt={userId}
      src={imageUrl}
      sx={{
        ...avatarSize,
        bgcolor: !imageUrl ? 'primary.main' : undefined,
      }}
    >
      {!imageUrl && userId ? userId.charAt(0).toUpperCase() : ''}
    </Avatar>
  );
};

return (
  <Container maxWidth="xl" style={{ marginTop: "2rem" }}>
    <Grid container spacing={3}>
      {/* Left side: Article content */}
      <Grid item xs={12} md={7} lg={8}>
        {/* 게시글 헤더 (제목, 작성자 정보) */}
        <Box display="flex" alignItems="center" mb={2}>
          <ProfileAvatar userId={currentPost.articleWriter || currentPost.author} size="large" />
          <Box ml={2} flex={1}>
            <Typography variant="h5" component="h1" gutterBottom>
              {currentPost.articleTitle}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {currentPost.articleWriter || currentPost.author} • {formatDate(currentPost.createdAt)}
            </Typography>
          </Box>
          
          {/* 게시글 좋아요/싫어요 버튼 - 우측 정렬 */}
          <Box display="flex" alignItems="center">
            <Button
              startIcon={currentPost.isLike ? <ThumbUpIcon color="primary" /> : <ThumbUpOutlinedIcon />}
              onClick={handleArticleLike}
              size="small"
              sx={{ 
                minWidth: 'auto', 
                textTransform: 'none',
                color: currentPost.isLike ? 'primary.main' : 'text.secondary'
              }}
            >
              {currentPost.likeCount || 0}
            </Button>

            <Button
              startIcon={currentPost.isHate ? <ThumbDownIcon color="error" /> : <ThumbDownOutlinedIcon />}
              onClick={handleArticleHate}
              size="small"
              sx={{ 
                minWidth: 'auto', 
                textTransform: 'none',
                color: currentPost.isHate ? 'error.main' : 'text.secondary',
                ml: 1
              }}
            >
              {currentPost.hateCount || 0}
            </Button>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ ml: 2 }}
            >
              조회 {currentPost.viewCount || 0}
            </Typography>
          </Box>
        </Box>

        {/* 게시글 본문 */}
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <ReactMarkdown 
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={materialDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                img: (imgProps) => (
                  <img 
                    {...imgProps} 
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto', 
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                    }} 
                  />
                )
              }}
              rehypePlugins={[rehypeRaw]}
            >
              {post.articleContent}
            </ReactMarkdown>
          </CardContent>
        </Card>
      </Grid>

        {/* Right side: Comments */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "1rem",
              minHeight: "30vh",
              width: "20vw",
              overflowY: "auto",
            }}
          >
            <Typography variant="h6" gutterBottom>
              댓글 {commentCount}
            </Typography>

            {/* 댓글 목록을 스크롤할 수 있는 섹션 */}
            <Box
              flexGrow={1}
              style={{
                overflow: "auto",
                marginBottom: "1rem",
                overflowX: "hidden",
                maxHeight: "50vh",
              }}
            >
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <Box
                    key={comment.commentId || index}
                    mb={2}
                    display="flex"
                    alignItems="flex-start"
                  >
                    {/* 프로필 아바타 */}
                    <Box mr={2}>
                      <ProfileAvatar userId={comment.userId} size="medium" />
                    </Box>

                    {/* 댓글 내용 */}
                    <Box flexGrow={1}>
                      <Typography
                        variant="body2"
                        color="textPrimary"
                        fontSize="16px"
                        fontWeight="bold"
                        style={{ margin: "10px 0" }}
                      >
                        {comment.userId}
                      </Typography>
                      {selectedCommentId === comment.commentId &&
                        mode === modifyMode && (
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <TextField
                              label="modify"
                              variant="outlined"
                              value={modifyText}
                              onChange={(e) => setModifyText(e.target.value)}
                              autoComplete="off"
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleModifySubmit}
                            >
                              수정
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleCancel}
                            >
                              취소
                            </Button>
                          </Box>
                        )}
                      {selectedCommentId !== comment.commentId &&
                        renderCommentContent(comment)}

                      {/* 좋아요/싫어요 정보 */}
                      <Box display="flex" alignItems="center" mt={1}>
                        <IconButton
                          onClick={() => handleLike(comment.commentId)}
                          color={comment.isLike ? "primary" : "default"}
                          size="small"
                        >
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          style={{ marginRight: "8px" }}
                        >
                          {comment.likeCount}
                        </Typography>
                        <IconButton
                          onClick={() => handleHate(comment.commentId)}
                          color={comment.isHate ? "secondary" : "default"}
                          size="small"
                        >
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          style={{ marginLeft: "8px" }}
                        >
                          {comment.hateCount}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setReplyComment(comment.commentId); // 상태 업데이트
                          }}
                          sx={{
                            color: "primary",
                            borderRadius: "16px",
                          }}
                        >
                          댓글
                        </Button>
                        <IconButton
                          edge="end"
                          onClick={(e) => handleCommentMenuClick(e, comment.commentId)}
                          size="small"
                          style={{ marginLeft: "auto" }}
                        >
                          <MoreVertIcon />
                        </IconButton>

                        <Menu
                          anchorEl={commentMenuAnchorEl}
                          open={Boolean(commentMenuAnchorEl) && currentCommentId === comment.commentId}
                          onClose={handleCommentMenuClose}
                          MenuListProps={{
                            "aria-labelledby": "comment-menu-button",
                          }}
                        >
                          {userId === comment.userId ? (
                            [
                              <MenuItem
                                key="modify"
                                onClick={(e) =>
                                  handleModify(e, comment.commentId)
                                }
                              >
                                수정
                              </MenuItem>,
                              <MenuItem
                                key="delete"
                                onClick={() => handleCommentDelete(currentCommentId)}
                              >
                                삭제
                              </MenuItem>,
                            ]
                          ) : (
                            <MenuItem key="report" onClick={handleReport}>
                              신고
                            </MenuItem>
                          )}
                        </Menu>
                      </Box>
                      {replyComment === comment.commentId && (
                        <Box
                          sx={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "8px",
                            position: "relative",
                            marginTop: "8px",
                          }}
                        >
                          <TextField
                            label="대댓글 작성"
                            variant="standard"
                            fullWidth
                            value={subCommentText}
                            onFocus={() => setSubCommentFocus(true)}
                            onChange={(e) => setSubCommentText(e.target.value)}
                            autoComplete="off"
                          />
                          <Collapse in={subCommentFocus}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: "16px",
                                transition: "all 0.3s ease",
                              }}
                            >
                              <Button
                                variant="outlined"
                                color="secondary"
                                sx={{ marginRight: "8px" }}
                                onClick={() => {
                                  setSubCommentFocus(false);
                                  setReplyComment(0);
                                  setSubCommentText("");
                                }}
                              >
                                취소
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  handleReplySubmit(comment.commentId);
                                  setSubCommentFocus(false);
                                  setReplyComment(0);
                                }}
                              >
                                대댓글 추가
                              </Button>
                            </Box>
                          </Collapse>
                        </Box>
                      )}
                      {/* 대댓글 보기 버튼 및 대댓글 렌더링 */}
                      {comment.subCommentCount > 0 && (
                        <>
                          <Button
                            size="small"
                            onClick={() =>
                              handleToggleReplys(comment.commentId)
                            }
                            style={{ alignSelf: "flex-start" }}
                          >
                            {openReplys.has(comment.commentId) ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                            답글 {comment.subCommentCount}개
                          </Button>

                          {/* 대댓글 섹션 */}
                          <Collapse
                            in={openReplys.has(comment.commentId)}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              mt={1}
                              ml={2}
                              pl={1}
                              borderLeft={1}
                              borderColor="grey.300"
                            >
                              {comment.subComments.map(
                                (subComment, subCommentIndex) => (
                                  <Box key={subCommentIndex} mb={2}>
                                    {subComment.subCommentId !==
                                    modifyedSubCommentId ? (
                                      <Box display="flex">
                                        <Box mr={2}>
                                          <ProfileAvatar userId={subComment.userId} size="small" />
                                        </Box>
                                        <Box flexGrow={1}>
                                          <Typography
                                            variant="body2"
                                            color="textPrimary"
                                            fontSize="14px"
                                            fontWeight="bold"
                                            style={{ margin: "10px 0" }}
                                          >
                                            {subComment.userId}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            component="div"
                                          >
                                            {subComment.subCommentText}
                                          </Typography>
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            mt={1}
                                          >
                                            <IconButton
                                              onClick={() =>
                                                handleSubCommentLike(subComment)
                                              }
                                              color={
                                                subComment.isLike
                                                  ? "primary"
                                                  : "default"
                                              }
                                              size="small"
                                            >
                                              <ThumbUpIcon fontSize="small" />
                                            </IconButton>
                                            <Typography
                                              variant="body2"
                                              style={{ marginRight: "8px" }}
                                            >
                                              {subComment.likeCount}
                                            </Typography>
                                            <IconButton
                                              onClick={() =>
                                                handleSubCommentHate(subComment)
                                              }
                                              color={
                                                subComment.isHate
                                                  ? "secondary"
                                                  : "default"
                                              }
                                              size="small"
                                            >
                                              <ThumbDownIcon fontSize="small" />
                                            </IconButton>
                                            <Typography
                                              variant="body2"
                                              style={{ marginLeft: "8px" }}
                                            >
                                              {subComment.hateCount}
                                            </Typography>
                                            <Box>
                                            <IconButton
                                              aria-label="대댓글 옵션"
                                              aria-controls={`subcomment-menu-${subComment.subCommentId}`}
                                              aria-haspopup="true"
                                              onClick={(event) => handleSubCommentMenuClick(
                                                event, 
                                                subComment.subCommentId,
                                                comment.commentId  // 부모 댓글 ID도 전달
                                              )}
                                              size="small"
                                            >
                                                <MoreVertIcon />
                                              </IconButton>
                                              <Menu
                                                anchorEl={subCommentMenuAnchorEl}
                                                open={Boolean(subCommentMenuAnchorEl) && currentSubCommentId === subComment.subCommentId}
                                                onClose={handleSubCommentMenuClose}
                                              >
                                                {userId ===
                                                subComment.userId ? (
                                                  <Box>
                                                    <MenuItem
                                                      onClick={() => clickSubCommentModify(subComment.subCommentId)}
                                                    >
                                                      수정
                                                    </MenuItem>
                                                    <MenuItem
                                                      onClick={() => handleSubCommentDelete(
                                                        currentCommentId,  // 저장된 부모 댓글 ID
                                                        currentSubCommentId  // 현재 대댓글 ID
                                                      )}
                                                    >
                                                      삭제
                                                    </MenuItem>
                                                  </Box>
                                                ) : (
                                                  <Box>
                                                    <MenuItem>
                                                      신고
                                                    </MenuItem>
                                                  </Box>
                                                )}
                                              </Menu>
                                            </Box>
                                          </Box>
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                      >
                                        <TextField
                                          label="modify"
                                          variant="outlined"
                                          value={subCommentModifyText}
                                          onChange={(e) =>
                                            setSubCommentModifyText(e.target.value)
                                          }
                                          autoComplete="off"
                                          fullWidth
                                          style={{ marginRight: "8px" }}
                                        />
                                        <Button
                                          variant="contained"
                                          color="primary"
                                          onClick={() =>
                                            handleSubCommentModifyed(comment.commentId)
                                          }
                                          style={{ marginRight: "8px" }}
                                        >
                                          수정
                                        </Button>
                                        <Button
                                          variant="contained"
                                          color="secondary"
                                          onClick={cancelModifyedSubComment}
                                        >
                                          취소
                                        </Button>
                                      </Box>
                                    )}
                                  </Box>
                                )
                              )}
                            </Box>
                          </Collapse>
                          {/* 대댓글 섹션 끝 */}
                        </>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  댓글이 없습니다.
                </Typography>
              )}
            </Box>
            {/* 댓글 작성 섹션 */}
            <Box
              sx={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                position: "relative",
              }}
            >
              <TextField
                label="댓글 작성"
                variant="standard" // 밑줄 있는 TextField
                fullWidth
                value={commentText}
                onFocus={() => setTextFieldFucus(true)}
                onChange={(e) => setCommentText(e.target.value)}
                autoComplete="off"
              />
              {textFieldFocus && (
                <Collapse in={textFieldFocus}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "16px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="secondary"
                      sx={{ marginRight: "8px" }}
                      onClick={() => setTextFieldFucus(false)}
                    >
                      취소
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCommentSubmit}
                    >
                      댓글 추가
                    </Button>
                  </Box>
                </Collapse>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ContentView;
