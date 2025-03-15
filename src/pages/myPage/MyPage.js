import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import UserInfo from "./UserInfo";
import UserHistory from "./UserHistory";

const MyPage = () => {
  const INFO = "info";
  const HISTORY = "history";

  const [mode, setMode] = useState(INFO);
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (event, newValue) => {
    setMode(newValue);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <Box 
      sx={{ 
        p: 3, 
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box display="flex" alignItems="center" mb={3}>
        {isMobile && (
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <CloseIcon />
          </IconButton>
        )}
        <Typography variant="h5" fontWeight="bold" color="primary">
          마이페이지
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Tabs
        orientation="vertical"
        value={mode}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': {
            justifyContent: 'flex-start',
            textAlign: 'left',
            pl: 0,
            py: 2,
            minHeight: 48,
          }
        }}
      >
        <Tab 
          icon={<PersonIcon />} 
          iconPosition="start" 
          label="내 정보" 
          value={INFO} 
          sx={{ mb: 1 }}
        />
        <Tab 
          icon={<HistoryIcon />} 
          iconPosition="start" 
          label="내가 쓴 글" 
          value={HISTORY}
        />
      </Tabs>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              마이페이지
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Box
          component="nav"
          sx={{ 
            width: 280, 
            flexShrink: 0,
            height: '100vh',
            position: 'sticky',
            top: 0,
          }}
        >
          <Paper 
            elevation={2} 
            sx={{ 
              height: '100%',
              borderRadius: 0
            }}
          >
            {sidebarContent}
          </Paper>
        </Box>
      )}

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          pt: isMobile ? 10 : 3,
          overflow: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3,
              borderRadius: 2,
              minHeight: '80vh'
            }}
          >
            {mode === INFO && <UserInfo />}
            {mode === HISTORY && <UserHistory />}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default MyPage;