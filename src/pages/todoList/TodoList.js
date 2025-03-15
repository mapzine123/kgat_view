
import React, { useState, useEffect } from 'react';
import {
Box,
Button,
Checkbox,
Chip,
CircularProgress,
IconButton,
List,
ListItem,
ListItemText,
TextField,
Typography,
FormControl,
InputLabel,
Select,
MenuItem,
Divider,
Paper,
Dialog,
DialogTitle,
DialogContent,
DialogActions
} from '@mui/material';
import { Add, CheckCircle, Delete, Edit, FilterList, CalendarMonth, Close, Event } from '@mui/icons-material';
import { API, getApiUrl } from "../../util/constant";
import { api } from '../../api/client';
import { useStore } from '../../redux/store/store';

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDateForInput = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};  // 날짜가 같은지 확인하는 함수
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const ToDoList = () => {
const [originalTodos, setOriginalTodos] = useState([]);
const [todos, setTodos] = useState([]);
const [input, setInput] = useState('');

// 부서 정보 상수
const DEPARTMENTS = [
  { id: 'dev', name: '개발팀' },
  { id: 'design', name: '디자인팀' },
  { id: 'marketing', name: '마케팅팀' },
  { id: 'sales', name: '영업팀' },
  { id: 'hr', name: '인사팀' },
  { id: 'finance', name: '재무팀' }
];

// 필터 상태들
const [scopeFilter, setScopeFilter] = useState('all'); // 전체/내 업무
const [statusFilter, setStatusFilter] = useState('all'); // 전체/미완료/완료
const [departmentFilter, setDepartmentFilter] = useState('all'); // 부서 필터
const [sortFilter, setSortFilter] = useState('newest'); // 정렬 방식: 최신순/오래된순
const [dateFilter, setDateFilter] = useState(null); // 날짜 필터
const [showCalendarDialog, setShowCalendarDialog] = useState(false); // 캘린더 다이얼로그 표시 여부

const [editingId, setEditingId] = useState(null);
const [editText, setEditText] = useState('');

const [isLoading, setIsLoading] = useState(true);
const [users, setUsers] = useState([]); // 사용자 목록

const { userId, setUserId } = useStore();

const MAX_CHANGES = 15;

// 컴포넌트가 언마운트될 때 변경사항 저장
useEffect(() => {
  const handleBeforeUnload = () => {
    const changes = calculateChange(originalTodos, todos);
    if(changes.updated.length > 0 || changes.deleted.length > 0) {
      api.post(`${getApiUrl(API.TODOS)}/batch`, {
        json: changes
      });
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [todos, originalTodos]);

// todos 변경 시 변경사항 확인
useEffect(() => {
  if(!isLoading && todos.length > 0) {
    checkAndSaveChanges();
  }
}, [todos]);

// 초기 데이터 로드
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      // Todo 데이터 로드
      const todosResponse = await api.get(`${getApiUrl(API.TODOS)}`).json();
      setOriginalTodos(todosResponse);
      setTodos(todosResponse);
      
      // 사용자 정보 로드
      const usersResponse = await api.get(`${getApiUrl(API.USERS)}`).json();
      setUsers(usersResponse);
    } catch(error){
      console.error('데이터 로드 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchInitialData();

  // 5분마다 변경사항 저장
  const autoSaveInterval = setInterval(async () => {
    const changes = calculateChange(originalTodos, todos);
    const totalChanges = changes.updated.length + changes.deleted.length;

    if(totalChanges > 0) {
      try {
        await api.post(`${getApiUrl(API.TODOS)}`, {
          json: changes
        });
        setOriginalTodos(todos);
      } catch(error) {
        console.error(error);
      }
    } 
  }, 5 * 60 * 1000);

  // clean up 함수
  return async () => {
    clearInterval(autoSaveInterval);
    const changes = calculateChange(originalTodos, todos);
    if(changes.updated.length > 0 || changes.deleted.length > 0) {
      try {
        await api.post(`${getApiUrl(API.TODOS)}`, {
          json: changes
        });
      } catch(error) {
        console.error(error);
      }
    }
  };
}, []);

// todo 변경사항 검사 함수
const calculateChange = (original, current) => {
  const changes  = {
    updated: current.filter(todo => {
      const originalTodo = original.find(o => o.id === todo.id);
      return originalTodo && (
        originalTodo.content !== todo.content ||
        originalTodo.completed !== todo.completed
      );
    }),
    deleted: original.filter(todo => !current.find(c => c.id === todo.id))
  };
  return changes;
}

// 변경 사항이 쌓일 때 마다 체크
const checkAndSaveChanges = async () => {
  const changes = calculateChange(originalTodos, todos);
  const totalChanges = changes.updated.length + changes.deleted.length;

  if(totalChanges >= MAX_CHANGES) {
    try {
      await api.post(`${getApiUrl(API.TODOS)}`, {
        json: changes
      });
      setOriginalTodos(todos);
    } catch(error) {
      console.error('Failed to save Changes: ', error);
    }
  }
}

const handleSaveChanges = async () => {
  const changes = calculateChange(originalTodos, todos);
  const totalChanges = changes.updated.length + changes.deleted.length;

  if(totalChanges > 0) {
    try {
      await api.post(`${getApiUrl(API.TODOS)}/batch`, {
        json: changes
      });
      setOriginalTodos([...todos]); // 여기서만 업데이트
      alert("변경사항이 저장되었습니다.");
    } catch(error) {
      console.error('Failed to save Changes : ', error);
    } 
  } else {
    alert("저장할 변경사항이 없습니다.");
  }
}

const handleAddTodo = async () => {
  if(input.trim() === '') {
    alert("할 일을 입력해주세요!");
    return;
  }

  const newTodo = {
    content: input,
    completed: false,
    userId: userId // 현재 사용자 ID 추가
  };

  try {
    const savedTodo = await api.post(`${getApiUrl(API.TODOS)}`, {
      json: newTodo
    }).json();

    console.log(savedTodo);

    setTodos(currentTodos => [...currentTodos, savedTodo]);
    setOriginalTodos(currentOriginalTodos => [...currentOriginalTodos, savedTodo]);
    setInput('');

  } catch(error) {
    console.error(error);
  }
}

// 부서별로 사용자 필터링
const getDepartmentUsers = (departmentId) => {
  if (departmentId === 'all') {
    return users;
  }
  return users.filter(user => user.department === departmentId);
};

// 필터링된 할 일 목록
const filteredTodos = (() => {
  let filtered = todos;
  
  // 1. 업무 범위 필터 적용 (전체 또는 내 업무)
  if (scopeFilter === 'my-tasks') {
    filtered = filtered.filter(todo => todo.userId === userId);
  }
  
  // 2. 상태 필터 적용 (전체, 완료됨, 미완료)
  if (statusFilter === 'completed') {
    filtered = filtered.filter(todo => todo.completed);
  } else if (statusFilter === 'pending') {
    filtered = filtered.filter(todo => !todo.completed);
  }
  
  // 3. 부서 필터 적용
  if (departmentFilter !== 'all') {
    const departmentUserIds = getDepartmentUsers(departmentFilter).map(user => user.id);
    filtered = filtered.filter(todo => departmentUserIds.includes(todo.userId));
  }
  
  // 4. 날짜 필터 적용
  if (dateFilter) {
    filtered = filtered.filter(todo => isSameDay(todo.created, dateFilter));
  }
  
  // 5. 날짜 기준 정렬 적용
  filtered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.created || 0);
    const dateB = new Date(b.created || 0);
    
    return sortFilter === 'newest' 
      ? dateB - dateA // 최신순 (내림차순)
      : dateA - dateB; // 오래된순 (오름차순)
  });
  
  return filtered;
})();

// 날짜 필터 핸들러
const handleDateChange = (event) => {
  const newDate = event.target.value ? new Date(event.target.value) : null;
  setDateFilter(newDate);
  setShowCalendarDialog(false);
};

// 날짜 필터 초기화
const clearDateFilter = () => {
  setDateFilter(null);
};

// todo 삭제
const handleDelete = (index) => {
  const todoToDelete = filteredTodos[index];
  
  // 현재 사용자가 담당자가 아니면 삭제 불가
  if (todoToDelete.userId !== userId) {
    return;
  }
  
  const updatedTodos = todos.filter(todo => todo.id !== todoToDelete.id);
  setTodos(updatedTodos);
  checkAndSaveChanges();
}

// 완료 / 미완료 토글
const handleToggleComplete = (index) => {
  const todoToToggle = filteredTodos[index];
  
  // 현재 사용자가 담당자가 아니면 토글 불가
  if (todoToToggle.userId !== userId) {
    return;
  }
  
  const updatedTodos = todos.map(todo => {
    if(todo.id === todoToToggle.id) {
      return {...todo, completed: !todo.completed};
    }
    return todo;
  });
  setTodos(updatedTodos);
}

// 수정 시작
const handleStartEdit = (todo, index) => {
  const todoToEdit = filteredTodos[index];
  
  // 현재 사용자가 담당자가 아니면 수정 불가
  if (todoToEdit.userId !== userId) {
    return;
  }
  
  setEditingId(todoToEdit.id);
  setEditText(todoToEdit.content);
}

// 수정 완료
const handleFinishEdit = (index) => {
  const todoToUpdate = filteredTodos[index];
  
  // 현재 사용자가 담당자가 아니면 수정 불가
  if (todoToUpdate.userId !== userId) {
    return;
  }
  
  const updatedTodos = todos.map(todo => {
    if(todo.id === todoToUpdate.id) {
      return {...todo, content: editText};
    }
    return todo;
  });

  setTodos(updatedTodos);
  setEditingId(null);
  setEditText('');
}

// 사용자 이름 가져오기
const getUserName = (userId) => {
  const user = users.find(u => u.id === userId);
  return user ? user.name : 'Unknown';
};

// 사용자 부서 가져오기
const getUserDepartment = (userId) => {
  const user = users.find(u => u.id === userId);
  if (!user) return 'Unknown';
  
  const dept = DEPARTMENTS.find(d => d.id === user.department);
  return dept ? dept.name : user.department;
};

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 필터 상태에 따른 메시지 생성
const getEmptyStateMessage = () => {
  const scopeText = scopeFilter === 'my-tasks' ? '내 업무' : '전체 업무';
  const statusText = statusFilter === 'completed' ? '완료된' : 
                     statusFilter === 'pending' ? '미완료' : '';
  const sortText = sortFilter === 'newest' ? '최신순' : '오래된순';
  let message = `${sortText}으로 정렬된 ${statusText} ${scopeText}`;
  
  if (departmentFilter !== 'all') {
    const deptName = DEPARTMENTS.find(d => d.id === departmentFilter)?.name || departmentFilter;
    message = `${deptName}의 ${message}`;
  }
  
  if (dateFilter) {
    message = `${formatDate(dateFilter)}에 생성된 ${message}`;
  }
  
  return `${message}가 없습니다.`;
};

return (
  <Box sx={{
    maxWidth: 700,
    margin: '50px auto',
    padding: '32px',
    borderRadius: '16px',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid',
    borderColor: '#f0f0f0'
  }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
      }}
    >
      <Typography
        sx={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1976D2'
        }}
      >
        업무 목록
      </Typography>
      <Button
        onClick={handleSaveChanges}
        variant='contained'
        sx={{
          bgcolor: '#1976D2',
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 2,
          px: 3,
          '&:hover': {
            bgcolor: '#1565C0'
          }
        }}
      >
        저장
      </Button>
    </Box>

    {/* 입력 필드 */}
    <Box sx={{
      display: 'flex',
      gap: 2,
      mb: 4
    }}>
      <TextField 
        fullWidth
        variant='outlined'
        placeholder='할 일을 입력하세요'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#E0E0E0'
            },
            '&:hover fieldset': {
              borderColor: '#BDBDBD'
            }
          },
          '& .MuiInputBase-input': {
            color: '#333'
          }
        }}
      />
      <Button
        onClick={handleAddTodo}
        variant='contained'
        startIcon={<Add />}
        sx={{
          bgcolor: '#1976D2',
          textTransform: 'none',
          borderRadius: 2,
          px: 3,
          minWidth: '100px',
          whiteSpace: 'nowrap',
          '&:hover': {
            bgcolor: '#1565C0'
          }
        }}
      >
        추가
      </Button>
    </Box>
    
    {/* 필터 섹션 */}
    <Box sx={{ mb: 4 }}>
      {/* 날짜 필터 */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={500} color="#666" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event fontSize="small" color="primary" />
            날짜 필터:
          </Typography>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<CalendarMonth />}
            color="primary" 
            sx={{ 
              fontSize: '0.75rem', 
              py: 0.5, 
              textTransform: 'none', 
              minWidth: 'auto',
            }}
            onClick={() => setShowCalendarDialog(true)}
          >
            날짜 선택
          </Button>
        </Box>
        
        {/* 캘린더 다이얼로그 */}
        <Dialog open={showCalendarDialog} onClose={() => setShowCalendarDialog(false)}>
          <DialogTitle>
            날짜로 필터링
            <IconButton
              aria-label="close"
              onClick={() => setShowCalendarDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ minWidth: 300, p: 2 }}>
              <TextField
                label="날짜 선택"
                type="date"
                value={dateFilter ? formatDateForInput(dateFilter) : ''}
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                선택한 날짜에 생성된 할 일만 표시됩니다.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDateFilter(null)} color="primary">
              필터 초기화
            </Button>
            <Button onClick={() => setShowCalendarDialog(false)} color="primary">
              확인
            </Button>
          </DialogActions>
        </Dialog>
        
        {dateFilter && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              py: 1,
              px: 2,
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              borderRadius: 2,
              mb: 2
            }}
          >
            <Typography fontSize="0.875rem" color="#1976D2">
              <b>{formatDate(dateFilter)}</b> 업무 보기 중
            </Typography>
            <Button 
              size="small" 
              sx={{ 
                ml: 'auto', 
                minWidth: 'auto', 
                p: 0.5,
                color: '#666'
              }}
              onClick={() => setDateFilter(null)}
            >
              해제
            </Button>
          </Box>
        )}
      </Box>
      
      {/* 정렬 필터 (최신순/오래된순) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={500} color="#666" sx={{ mb: 1 }}>
          정렬:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="최신순"
            onClick={() => setSortFilter('newest')}
            sx={{
              bgcolor: sortFilter === 'newest' ? '#1976D2' : 'transparent',
              color: sortFilter === 'newest' ? 'white' : '#666',
              border: '1px solid',
              borderColor: sortFilter === 'newest' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: sortFilter === 'newest' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
          <Chip
            label="오래된순"
            onClick={() => setSortFilter('oldest')}
            sx={{
              bgcolor: sortFilter === 'oldest' ? '#1976D2' : 'transparent',
              color: sortFilter === 'oldest' ? 'white' : '#666',
              border: '1px solid',
              borderColor: sortFilter === 'oldest' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: sortFilter === 'oldest' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
        </Box>
      </Box>
    
      {/* 업무 범위 필터 (전체/내 업무) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={500} color="#666" sx={{ mb: 1 }}>
          업무 범위:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="전체 업무"
            onClick={() => setScopeFilter('all')}
            sx={{
              bgcolor: scopeFilter === 'all' ? '#1976D2' : 'transparent',
              color: scopeFilter === 'all' ? 'white' : '#666',
              border: '1px solid',
              borderColor: scopeFilter === 'all' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: scopeFilter === 'all' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
          <Chip
            label="내 업무"
            onClick={() => setScopeFilter('my-tasks')}
            sx={{
              bgcolor: scopeFilter === 'my-tasks' ? '#1976D2' : 'transparent',
              color: scopeFilter === 'my-tasks' ? 'white' : '#666',
              border: '1px solid',
              borderColor: scopeFilter === 'my-tasks' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: scopeFilter === 'my-tasks' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
        </Box>
      </Box>

      {/* 상태 필터 (전체/완료/미완료) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={500} color="#666" sx={{ mb: 1 }}>
          상태:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="전체"
            onClick={() => setStatusFilter('all')}
            sx={{
              bgcolor: statusFilter === 'all' ? '#1976D2' : 'transparent',
              color: statusFilter === 'all' ? 'white' : '#666',
              border: '1px solid',
              borderColor: statusFilter === 'all' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: statusFilter === 'all' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
          <Chip
            label="완료됨"
            onClick={() => setStatusFilter('completed')}
            sx={{
              bgcolor: statusFilter === 'completed' ? '#1976D2' : 'transparent',
              color: statusFilter === 'completed' ? 'white' : '#666',
              border: '1px solid',
              borderColor: statusFilter === 'completed' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: statusFilter === 'completed' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
          <Chip
            label="미완료"
            onClick={() => setStatusFilter('pending')}
            sx={{
              bgcolor: statusFilter === 'pending' ? '#1976D2' : 'transparent',
              color: statusFilter === 'pending' ? 'white' : '#666',
              border: '1px solid',
              borderColor: statusFilter === 'pending' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: statusFilter === 'pending' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
        </Box>
      </Box>
      
      {/* 부서 필터 */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={500} color="#666" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList fontSize="small" color="primary" />
          부서별 필터:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label="전체 부서"
            onClick={() => setDepartmentFilter('all')}
            sx={{
              bgcolor: departmentFilter === 'all' ? '#1976D2' : 'transparent',
              color: departmentFilter === 'all' ? 'white' : '#666',
              border: '1px solid',
              borderColor: departmentFilter === 'all' ? '#1976D2' : '#E0E0E0',
              '&:hover': {
                bgcolor: departmentFilter === 'all' ? '#1565C0' : 'rgba(0,0,0,0.04)'
              }
            }}
          />
          {DEPARTMENTS.map((dept) => (
            <Chip
              key={dept.id}
              label={dept.name}
              onClick={() => setDepartmentFilter(dept.id)}
              sx={{
                bgcolor: departmentFilter === dept.id ? '#1976D2' : 'transparent',
                color: departmentFilter === dept.id ? 'white' : '#666',
                border: '1px solid',
                borderColor: departmentFilter === dept.id ? '#1976D2' : '#E0E0E0',
                '&:hover': {
                  bgcolor: departmentFilter === dept.id ? '#1565C0' : 'rgba(0,0,0,0.04)'
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>

    {/* To-Do 목록 */}
    <List sx={{ px: 0 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#1976D2' }} />
          </Box>
        ) : (
        filteredTodos.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: '#666' }}>
            {getEmptyStateMessage()}
          </Typography>
        ) : (
          filteredTodos.map((todo, index) => (
            <ListItem
              key={todo.id}
              onClick={(event) => {
                // secondaryAction 영역 클릭은 제외하고, 담당자가 현재 사용자인 경우만 토글 가능
                if (!event.target.closest('.MuiListItemSecondaryAction-root') && todo.userId === userId) {
                  handleToggleComplete(index);
                }
            }}
              sx={{
                mb: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#f0f0f0',
                cursor: todo.userId === userId ? 'pointer' : 'default',
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.02)'
                }
              }}
              secondaryAction={
                <Box>
                  {editingId === todo.id ? (
                    <IconButton onClick={() => handleFinishEdit(index)}>
                      <CheckCircle sx={{color: '#4CAF50'}} />
                    </IconButton>
                  ) : (
                    <IconButton 
                      onClick={() => handleStartEdit(todo, index)} 
                      disabled={todo.userId !== userId}
                      sx={{'&.Mui-disabled': {color: 'rgba(0, 0, 0, 0.26)'}}}
                    >
                      <Edit sx={{color: todo.userId === userId ? '#1976D2' : 'rgba(25, 118, 210, 0.5)'}} />
                    </IconButton>
                  )}
                  <IconButton 
                    onClick={() => handleDelete(index)} 
                    disabled={todo.userId !== userId}
                    sx={{'&.Mui-disabled': {color: 'rgba(0, 0, 0, 0.26)'}}}
                  >
                    <Delete sx={{color: todo.userId === userId ? '#F44336' : 'rgba(244, 67, 54, 0.5)'}} />
                  </IconButton>
                </Box>
              }
            >
              <Checkbox 
                checked={todo.completed}
                onChange={() => handleToggleComplete(index)}
                disabled={todo.userId !== userId}
                sx={{
                  color: '#BDBDBD',
                  '&.Mui-checked': {
                    color: '#4CAF50'
                  },
                  '&.Mui-disabled': {
                    color: todo.completed ? 'rgba(76, 175, 80, 0.5)' : 'rgba(189, 189, 189, 0.5)'
                  }
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {editingId === todo.id ? (
                  <TextField
                    fullWidth
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit(index)}
                    autoFocus
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#E0E0E0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#BDBDBD'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#333'
                      }
                    }}
                  />
                ) : (
                  <>
                    <ListItemText
                      primary={todo.content}
                      sx={{
                        '& .MuiTypography-root': {
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? '#9E9E9E' : '#333'
                        }
                      }}
                    />
                    {/* 담당자 및 날짜 정보 표시 */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mt: 0.5, gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                          담당: {todo.name}
                        </Typography>
                        <Chip 
                          label={todo.department} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            bgcolor: '#E3F2FD',
                            color: '#1976D2'
                          }} 
                        />
                      </Box>
                      {todo.created && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#666',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.65rem'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>📅</span> {formatDate(todo.created)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </ListItem>
          ))))}
    </List>
  </Box>
);
}

export default ToDoList;