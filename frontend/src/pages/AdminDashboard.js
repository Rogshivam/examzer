import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, Box, Card, CardContent, CardActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, InputLabel, Select, MenuItem, FormControl, Checkbox, ListItemIcon,
  CircularProgress, CssBaseline
} from '@mui/material';
import { Add, Edit, Group, Assignment, Logout, UploadFile, People, History, Brightness4, Brightness7 } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const drawerWidth = 220;

function AdminDashboard({ user, setGlobalLoading }) {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const theme = createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } });

  // State
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [forms, setForms] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedSection, setSelectedSection] = useState('exams');
  const [openExamDialog, setOpenExamDialog] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [examForm, setExamForm] = useState({ name: '', date: '', description: '', document: null });
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    try {
      const [studentsRes, examsRes, groupsRes, formsRes, logsRes] = await Promise.all([
        fetch('/api/admin/students', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/exams', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/groups', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/forms', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      if (!studentsRes.ok || !examsRes.ok || !groupsRes.ok || !formsRes.ok || !logsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      setStudents(await studentsRes.json());
      setExams(await examsRes.json());
      setGroups(await groupsRes.json());
      setForms(await formsRes.json());
      setAuditLogs(await logsRes.json());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
      setGlobalLoading && setGlobalLoading(false);
    }
  }, [setGlobalLoading]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Exam add/edit dialog logic
  const handleOpenExamDialog = useCallback((exam = null) => {
    setEditExam(exam);
    setExamForm(exam ? { ...exam, document: null } : { name: '', date: '', description: '', document: null });
    setOpenExamDialog(true);
  }, []);
  const handleCloseExamDialog = useCallback(() => {
    setOpenExamDialog(false);
    setEditExam(null);
    setExamForm({ name: '', date: '', description: '', document: null });
  }, []);
  const handleExamFormChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (name === 'document') {
      const file = files[0];
      if (file && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error('Only PDF or DOC/DOCX files allowed');
        return;
      }
      setExamForm((prev) => ({ ...prev, document: file }));
    } else {
      setExamForm((prev) => ({ ...prev, [name]: value }));
    }
  }, []);
  const handleSaveExam = useCallback(async () => {
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    try {
      let examId = editExam ? editExam.id : null;
      let res;
      if (editExam) {
        res = await fetch(`/api/admin/exams`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ ...examForm, id: examId })
        });
      } else {
        res = await fetch(`/api/admin/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(examForm)
        });
      }
      if (!res.ok) {
        throw new Error(editExam ? 'Failed to update exam' : 'Failed to create exam');
      }
      const exam = await res.json();
      if (examForm.document) {
        const formData = new FormData();
        formData.append('document', examForm.document);
        const uploadRes = await fetch(`/api/admin/exams/${exam.id || examId}/document`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (!uploadRes.ok) {
          throw new Error('Failed to upload document');
        }
      }
      toast.success(editExam ? 'Exam updated' : 'Exam created');
      handleCloseExamDialog();
      fetchAll();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving exam:', error);
      toast.error('Error saving exam');
    } finally {
      setLoading(false);
      setGlobalLoading && setGlobalLoading(false);
    }
  }, [editExam, examForm, handleCloseExamDialog, fetchAll, setGlobalLoading]);

  // Group management dialog logic
  const fetchGroupStudents = useCallback(async (groupId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch group students');
      }
      setGroupStudents(await res.json());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching group students:', error);
      toast.error('Error fetching group students');
    } finally {
      setLoading(false);
    }
  }, []);
  const handleOpenGroupDialog = useCallback(
    (group) => {
      setSelectedGroup(group);
      setSelectedStudents([]);
      setOpenGroupDialog(true);
      fetchGroupStudents(group.id);
    },
    [fetchGroupStudents]
  );
  const handleCloseGroupDialog = useCallback(() => {
    setOpenGroupDialog(false);
    setSelectedGroup(null);
    setSelectedStudents([]);
    setGroupStudents([]);
  }, []);
  const handleBulkAssign = useCallback(async () => {
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ studentIds: selectedStudents })
      });
      if (!res.ok) {
        throw new Error('Failed to assign students');
      }
      toast.success('Students assigned to group');
      fetchGroupStudents(selectedGroup.id);
      fetchAll();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error assigning students:', error);
      toast.error('Error assigning students');
    } finally {
      setLoading(false);
      setGlobalLoading && setGlobalLoading(false);
    }
  }, [selectedGroup, selectedStudents, fetchGroupStudents, fetchAll, setGlobalLoading]);

  // Accept form
  const handleAcceptForm = useCallback(async (formId) => {
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        throw new Error('Failed to accept form');
      }
      toast.success('Form accepted');
      fetchAll();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error accepting form:', error);
      toast.error('Error accepting form');
    } finally {
      setLoading(false);
      setGlobalLoading && setGlobalLoading(false);
    }
  }, [fetchAll, setGlobalLoading]);

  // Drawer sections
  const sections = [
    { key: 'exams', label: 'Exams', icon: <Assignment /> },
    { key: 'groups', label: 'Groups', icon: <Group /> },
    { key: 'students', label: 'Students', icon: <People /> },
    { key: 'forms', label: 'Forms', icon: <Edit /> },
    { key: 'logs', label: 'Audit Logs', icon: <History /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: 1201 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin Dashboard</Typography>
            <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Button color="inherit" startIcon={<Logout />} onClick={() => window.location.reload()}>Logout</Button>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
          <Toolbar />
          <List>
            {sections.map((section) => (
              <ListItem button key={section.key} selected={selectedSection === section.key} onClick={() => setSelectedSection(section.key)}>
                <ListItemIcon>{section.icon}</ListItemIcon>
                <ListItemText primary={section.label} />
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
          <Toolbar />
          {loading && <CircularProgress sx={{ mb: 2 }} />}
          {/* Exams Section */}
          {selectedSection === 'exams' && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">Exams</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenExamDialog()} disabled={loading}>
                  Add Exam
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {exams.map((exam) => (
                  <Card key={exam.id} sx={{ width: 320 }}>
                    <CardContent>
                      <Typography variant="h6">{exam.name}</Typography>
                      <Typography>Date: {exam.date}</Typography>
                      <Typography>Description: {exam.description}</Typography>
                      {exam.document_path && (
                        <Button href={exam.document_path} target="_blank" startIcon={<UploadFile />}>Download Document</Button>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button startIcon={<Edit />} onClick={() => handleOpenExamDialog(exam)} disabled={loading}>Edit</Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
              {/* Exam Add/Edit Dialog */}
              <Dialog open={openExamDialog} onClose={handleCloseExamDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editExam ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
                <DialogContent>
                  <TextField label="Exam Name" name="name" value={examForm.name} onChange={handleExamFormChange} fullWidth sx={{ mb: 2 }} disabled={loading} />
                  <TextField label="Date" name="date" type="date" value={examForm.date} onChange={handleExamFormChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} disabled={loading} />
                  <TextField label="Description" name="description" value={examForm.description} onChange={handleExamFormChange} fullWidth multiline sx={{ mb: 2 }} disabled={loading} />
                  <Button component="label" startIcon={<UploadFile />} variant="outlined" disabled={loading} sx={{ mt: 1 }}>
                    Upload Document
                    <input type="file" name="document" accept=".pdf,.doc,.docx" hidden onChange={handleExamFormChange} />
                  </Button>
                  {examForm.document && <Typography sx={{ mt: 1 }}>{examForm.document.name}</Typography>}
                  <Typography variant="caption" color="text.secondary">PDF, DOC, or DOCX only</Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseExamDialog} disabled={loading}>Cancel</Button>
                  <Button onClick={handleSaveExam} variant="contained" disabled={loading}>
                    {editExam ? 'Update' : 'Create'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          <Box sx={{ mb: 4 }} />
          {/* Groups Section */}
          {selectedSection === 'groups' && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">Groups</Typography>
              </Box>
              <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Group Name</TableCell>
                      <TableCell>Exam</TableCell>
                      <TableCell>Members</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.examName}</TableCell>
                        <TableCell>{group.memberCount || '-'}</TableCell>
                        <TableCell>
                          <Button startIcon={<Group />} onClick={() => handleOpenGroupDialog(group)} disabled={loading}>Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Group Management Dialog */}
              <Dialog open={openGroupDialog} onClose={handleCloseGroupDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Group: {selectedGroup?.name}</DialogTitle>
                <DialogContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Students</InputLabel>
                    <Select
                      multiple
                      value={selectedStudents}
                      onChange={(e) => setSelectedStudents(e.target.value)}
                      renderValue={(selected) => students.filter((s) => selected.includes(s.id)).map((s) => s.name).join(', ')}
                      disabled={loading}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          <Checkbox checked={selectedStudents.indexOf(student.id) > -1} />
                          <ListItemText primary={student.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={handleBulkAssign} disabled={selectedStudents.length === 0 || loading}>
                    Add to Group
                  </Button>
                  <Typography sx={{ mt: 2 }}>Current Members:</Typography>
                  <List>
                    {groupStudents.map((student) => (
                      <ListItem key={student.id}>{student.name}</ListItem>
                    ))}
                  </List>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseGroupDialog} disabled={loading}>Close</Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          <Box sx={{ mb: 4 }} />
          {/* Students Section */}
          {selectedSection === 'students' && (
            <>
              <Typography variant="h5" sx={{ mb: 2 }}>Students</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <Box sx={{ mb: 4 }} />
          {/* Forms Section */}
          {selectedSection === 'forms' && (
            <>
              <Typography variant="h5" sx={{ mb: 2 }}>Submitted Forms</Typography>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Exam</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell>{form.studentName}</TableCell>
                        <TableCell>{form.examName}</TableCell>
                        <TableCell>{form.status}</TableCell>
                        <TableCell>
                          {form.status === 'pending' && (
                            <Button variant="contained" onClick={() => handleAcceptForm(form.id)} disabled={loading}>
                              Accept
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <Box sx={{ mb: 4 }} />
          {/* Audit Logs Section (Admin only) */}
          {selectedSection === 'logs' && user.role === 'admin' && (
            <>
              <Typography variant="h5" sx={{ mb: 2 }}>Audit Logs</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.created_at}</TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AdminDashboard;