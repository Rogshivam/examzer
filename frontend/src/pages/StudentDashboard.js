import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  AppBar, Toolbar, Typography, Button, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Grid, IconButton, CircularProgress, CssBaseline, Switch
} from '@mui/material';
import { Download, Assignment, Logout, Brightness4, Brightness7, Description } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

function StudentDashboard({ user, setGlobalLoading }) {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const theme = createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } });

  // State
  const [exams, setExams] = useState([]);
  const [myForms, setMyForms] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({});
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    try {
      const examsRes = await fetch(`/api/student/exams/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const formsRes = await fetch(`/api/student/forms/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!examsRes.ok || !formsRes.ok) throw new Error('Failed to fetch data');
      setExams(await examsRes.json());
      setMyForms(await formsRes.json());
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
      setGlobalLoading && setGlobalLoading(false);
    }
  }, [user.id, setGlobalLoading]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Form dialog logic
  const handleOpenFormDialog = (exam) => {
    setSelectedExam(exam);
    setFormData({});
    setOpenFormDialog(true);
  };
  const handleCloseFormDialog = () => {
    setSelectedExam(null);
    setFormData({});
    setOpenFormDialog(false);
  };
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    try {
      const res = await fetch('/api/student/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ student_id: user.id, exam_id: selectedExam.id, submission_data: formData })
      });
      if (!res.ok) throw new Error('Failed to submit form');
      toast.success('Form submitted');
      handleCloseFormDialog();
      fetchAll();
    } catch (error) {
      toast.error('Error submitting form');
    } finally {
      setLoading(false);
      setGlobalLoading && setGlobalLoading(false);
    }
  };
  const handleDownloadHallTicket = (formId) => {
    window.open(`/api/student/hallticket/${formId}`, '_blank');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <AppBar position="static" color="primary">
          <Toolbar>
            <Assignment sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Student Dashboard</Typography>
            <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Button color="inherit" startIcon={<Logout />} onClick={() => window.location.reload()}>Logout</Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          <Typography variant="h5" sx={{ mb: 2 }}>My Exams</Typography>
          {loading && <CircularProgress sx={{ mb: 2 }} />}
          <Grid container spacing={3}>
            {exams.map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam.id}>
                <Card sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent>
                    <Typography variant="h6">{exam.name}</Typography>
                    <Typography>Date: {exam.date}</Typography>
                    <Typography>Description: {exam.description}</Typography>
                    {exam.document_path && (
                      <Button
                        href={exam.document_path}
                        target="_blank"
                        startIcon={<Description />}
                        sx={{ mt: 1 }}
                        variant="outlined"
                      >
                        Download Document
                      </Button>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      onClick={() => handleOpenFormDialog(exam)}
                      disabled={loading}
                    >
                      Fill Form
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>My Exam Forms</Typography>
          <Grid container spacing={2}>
            {myForms.map((form) => (
              <Grid item xs={12} sm={6} md={4} key={form.id}>
                <Card sx={{ minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent>
                    <Typography variant="subtitle1">{form.examName}</Typography>
                    <Typography>Status: {form.status}</Typography>
                  </CardContent>
                  <CardActions>
                    {form.status === 'accepted' && (
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleDownloadHallTicket(form.id)}
                        disabled={loading}
                      >
                        Download Hall Ticket
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        {/* Form Dialog */}
        <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Fill Exam Form: {selectedExam?.name}</DialogTitle>
          <DialogContent>
            <TextField
              label="Roll Number"
              name="rollNumber"
              value={formData.rollNumber || ''}
              onChange={handleFormChange}
              fullWidth
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <TextField
              label="Subject"
              name="subject"
              value={formData.subject || ''}
              onChange={handleFormChange}
              fullWidth
              sx={{ mb: 2 }}
              disabled={loading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFormDialog} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmitForm} variant="contained" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default StudentDashboard;