// Admin Dashboard JavaScript
// Cấu hình Supabase - Corrected URL
const SUPABASE_URL = 'https://qvrawnurfmxdsjttlele.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmF3bnVyZm14ZHNqdHRsZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjEwNzMsImV4cCI6MjA3NDM5NzA3M30.dyDgXVTCvNwbvj1PsbVMaOnAea2NgVruuNnEpMfcj2w';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmF3bnVyZm14ZHNqdHRsZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgyMTA3MywiZXhwIjoyMDc0Mzk3MDczfQ.QQ29KD8H-q55L7r7fRaxWNSTQP-771Ug7yU7TBoWjB0';

console.log('=== ADMIN DASHBOARD SUPABASE CONFIG ===');
console.log('URL:', SUPABASE_URL);
console.log('KEY:', SUPABASE_KEY.substring(0, 20) + '...');
console.log('Timestamp:', new Date().toISOString());

// Khởi tạo Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Admin credentials (hardcoded for security)
const ADMIN_CREDENTIALS = {
    email: 'admin@quiz.com',
    password: 'admin123'
};

// Global state
let currentSection = 'overview';
let isAuthenticated = false;
let currentData = {
    teachers: [],
    students: [],
    classes: [],
    quizSets: [],
    questions: [],
    results: []
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard loaded');
    setupEventListeners();
    checkAuth();
});

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Add buttons
    document.getElementById('addTeacherBtn').addEventListener('click', () => showModal('addTeacherModal'));
    document.getElementById('addClassBtn').addEventListener('click', () => showModal('addClassModal'));
    document.getElementById('addQuizSetBtn').addEventListener('click', () => showModal('addQuizSetModal'));
    document.getElementById('addQuestionBtn').addEventListener('click', () => showModal('addQuestionModal'));
    
    // Form submissions
    document.getElementById('addTeacherForm').addEventListener('submit', handleAddTeacher);
    document.getElementById('addClassForm').addEventListener('submit', handleAddClass);
    document.getElementById('addQuizSetForm').addEventListener('submit', handleAddQuizSet);
    document.getElementById('addQuestionForm').addEventListener('submit', handleAddQuestion);
    
    // Question type change
    document.getElementById('questionType').addEventListener('change', toggleQuestionType);
    
    // Search functionality
    document.getElementById('studentSearch').addEventListener('input', searchStudents);
    document.getElementById('categoryFilter').addEventListener('change', filterQuestions);
    
    // Results filters
    document.getElementById('classFilter').addEventListener('change', filterResults);
    document.getElementById('quizFilter').addEventListener('change', filterResults);
    document.getElementById('dateFrom').addEventListener('change', filterResults);
    document.getElementById('dateTo').addEventListener('change', filterResults);
    
    // Export results
    document.getElementById('exportResultsBtn').addEventListener('click', exportResults);
    
    // Edit student form
    document.getElementById('editStudentForm').addEventListener('submit', handleEditStudent);
    
    // Edit teacher form
    document.getElementById('editTeacherForm').addEventListener('submit', handleEditTeacher);
    
    // Close modal buttons
    document.getElementById('closeEditStudentModal').addEventListener('click', closeEditStudentModal);
    document.getElementById('closeEditTeacherModal').addEventListener('click', closeEditTeacherModal);
}

// Authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (token && token === 'admin_authenticated') {
        isAuthenticated = true;
        showDashboard();
        loadOverviewData();
    } else {
        showLogin();
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) throw profileError;
        
        if (!profile.is_admin) {
            showError('Bạn không có quyền truy cập admin!');
            await supabase.auth.signOut();
            return;
        }
        
        localStorage.setItem('adminToken', 'admin_authenticated');
        isAuthenticated = true;
        showDashboard();
        loadOverviewData();
        showSuccess('Đăng nhập thành công!');
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Lỗi đăng nhập: ' + error.message);
    }
}

async function handleLogout() {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('adminToken');
    isAuthenticated = false;
    showLogin();
    showSuccess('Đã đăng xuất!');
}

function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
}

// Navigation
function showSection(section) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Update section title
    const titles = {
        overview: 'Tổng quan',
        teachers: 'Quản lý Giáo viên',
        students: 'Quản lý Học sinh',
        classes: 'Quản lý Lớp học',
        quizsets: 'Quản lý Bộ đề',
        questions: 'Quản lý Câu hỏi',
        results: 'Kết quả Quiz'
    };
    
    document.getElementById('sectionTitle').textContent = titles[section];
    
    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.add('hidden');
    });
    document.getElementById(`${section}Section`).classList.remove('hidden');
    
    currentSection = section;
    
    // Load section data
    switch(section) {
        case 'overview':
            loadOverviewData();
            break;
        case 'teachers':
            loadTeachers();
            break;
        case 'students':
            loadStudents();
            break;
        case 'classes':
            loadClasses();
            break;
        case 'quizsets':
            loadQuizSets();
            break;
        case 'questions':
            loadQuestions();
            break;
        case 'results':
            loadResults();
            break;
    }
}

// Data Loading Functions
async function loadOverviewData() {
    showLoading();
    
    try {
        console.log('Loading overview data...');
        
        // Load stats
        const [teachersRes, studentsRes, classesRes, quizSetsRes] = await Promise.all([
            supabase.from('profiles').select('id').eq('role', 'teacher'),
            supabase.from('profiles').select('id').eq('role', 'student'),
            supabase.from('classes').select('id'),
            supabase.from('quiz_sets').select('id')
        ]);
        
        console.log('Overview data results:');
        console.log('Teachers:', teachersRes);
        console.log('Students:', studentsRes);
        console.log('Classes:', classesRes);
        console.log('Quiz Sets:', quizSetsRes);
        
        const teacherCount = teachersRes.data?.length || 0;
        const studentCount = studentsRes.data?.length || 0;
        const classCount = classesRes.data?.length || 0;
        const quizSetCount = quizSetsRes.data?.length || 0;
        
        console.log('Counts:', { teacherCount, studentCount, classCount, quizSetCount });
        
        document.getElementById('totalTeachers').textContent = teacherCount;
        document.getElementById('totalStudents').textContent = studentCount;
        document.getElementById('totalClasses').textContent = classCount;
        document.getElementById('totalQuizSets').textContent = quizSetCount;
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        showError('Lỗi khi tải dữ liệu tổng quan: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadTeachers() {
    console.log('Loading teachers...');
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'teacher')
            .order('created_at', { ascending: false });
        
        console.log('Teachers query result:', { data, error });
        
        if (error) throw error;
        
        currentData.teachers = data || [];
        console.log('Teachers data set:', currentData.teachers);
        renderTeachersTable();
        
    } catch (error) {
        console.error('Error loading teachers:', error);
        showError('Lỗi khi tải danh sách giáo viên: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadStudents() {
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                class_members(
                    class_id,
                    classes(name)
                )
            `)
            .eq('role', 'student')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        currentData.students = data || [];
        renderStudentsTable();
        
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Lỗi khi tải danh sách học sinh');
    } finally {
        hideLoading();
    }
}

async function loadClasses() {
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                profiles!classes_teacher_id_fkey(username, full_name),
                class_members(count)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        currentData.classes = data || [];
        renderClassesTable();
        loadTeachersForClassSelect();
        
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Lỗi khi tải danh sách lớp học');
    } finally {
        hideLoading();
    }
}

async function loadQuizSets() {
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('quiz_sets')
            .select(`
                *,
                classes(name),
                profiles!quiz_sets_created_by_fkey(username)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        currentData.quizSets = data || [];
        renderQuizSetsTable();
        loadClassesForQuizSetSelect();
        
    } catch (error) {
        console.error('Error loading quiz sets:', error);
        showError('Lỗi khi tải danh sách bộ đề');
    } finally {
        hideLoading();
    }
}

async function loadQuestions() {
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        currentData.questions = data || [];
        renderQuestionsTable();
        
    } catch (error) {
        console.error('Error loading questions:', error);
        showError('Lỗi khi tải danh sách câu hỏi');
    } finally {
        hideLoading();
    }
}

async function loadResults() {
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .select(`
                *,
                profiles!quiz_results_student_id_fkey(username, full_name),
                quiz_sets(title),
                classes(name)
            `)
            .order('completed_at', { ascending: false });
        
        if (error) throw error;
        
        currentData.results = data || [];
        renderResultsTable();
        loadFiltersForResults();
        
    } catch (error) {
        console.error('Error loading results:', error);
        showError('Lỗi khi tải kết quả quiz');
    } finally {
        hideLoading();
    }
}

// Table Rendering Functions
function renderTeachersTable() {
    console.log('Rendering teachers table with data:', currentData.teachers);
    
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) {
        console.error('teachersTableBody element not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (currentData.teachers.length === 0) {
        console.log('No teachers to render');
        return;
    }
    
    currentData.teachers.forEach(teacher => {
        console.log('Rendering teacher:', teacher);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.username || 'N/A'}</td>
            <td>${teacher.full_name || 'N/A'}</td>
            <td>${teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editTeacher('${teacher.id || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteTeacher('${teacher.id || ''}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Teachers table rendered successfully');
}

function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    currentData.students.forEach(student => {
        const classNames = student.class_members?.map(cm => cm.classes?.name).filter(Boolean).join(', ') || 'Chưa tham gia lớp';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.username || 'N/A'}</td>
            <td>${student.full_name || 'N/A'}</td>
            <td>${classNames}</td>
            <td>${student.created_at ? new Date(student.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editStudent('${student.id || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteStudent('${student.id || ''}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderClassesTable() {
    const tbody = document.getElementById('classesTableBody');
    tbody.innerHTML = '';
    
    currentData.classes.forEach(cls => {
        const teacherName = cls.profiles?.username || 'N/A';
        const memberCount = cls.class_members?.[0]?.count || 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code>${cls.class_code || 'N/A'}</code></td>
            <td>${cls.name || 'N/A'}</td>
            <td>${teacherName}</td>
            <td>${memberCount}</td>
            <td>${cls.created_at ? new Date(cls.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn-primary" onclick="viewClassMembers('${cls.id || ''}')">
                    <i class="fas fa-users"></i>
                </button>
                <button class="btn-warning" onclick="editClass('${cls.id || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteClass('${cls.id || ''}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderQuizSetsTable() {
    const tbody = document.getElementById('quizSetsTableBody');
    tbody.innerHTML = '';
    
    currentData.quizSets.forEach(quizSet => {
        const className = quizSet.classes?.name || 'N/A';
        const status = quizSet.is_active ? 'active' : 'inactive';
        const statusText = quizSet.is_active ? 'Hoạt động' : 'Tạm dừng';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${quizSet.title || 'N/A'}</td>
            <td>${className}</td>
            <td>${quizSet.question_count || 5}</td>
            <td>${quizSet.time_limit || 10}</td>
            <td><span class="status-badge ${status}">${statusText}</span></td>
            <td>${quizSet.created_at ? new Date(quizSet.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn-${quizSet.is_active ? 'warning' : 'primary'}" 
                        onclick="toggleQuizSet('${quizSet.id || ''}', ${!quizSet.is_active})">
                    <i class="fas fa-${quizSet.is_active ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn-warning" onclick="editQuizSet('${quizSet.id || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteQuizSet('${quizSet.id || ''}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderQuestionsTable() {
    const tbody = document.getElementById('questionsTableBody');
    tbody.innerHTML = '';
    
    currentData.questions.forEach(question => {
        const typeText = question.type === 'tf' ? 'Đúng/Sai' : 'Trắc nghiệm';
        let answerText = '';
        
        if (question.type === 'tf') {
            answerText = question.answer ? 'Đúng' : 'Sai';
        } else {
            const options = question.options || [];
            const correctIndex = question.correct_index;
            answerText = options[correctIndex] || 'N/A';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${typeText}</td>
            <td>${question.text || 'N/A'}</td>
            <td>${question.category || 'N/A'}</td>
            <td>${answerText}</td>
            <td>${question.created_at ? new Date(question.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editQuestion('${question.id || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteQuestion('${question.id || ''}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    currentData.results.forEach(result => {
        const studentName = result.profiles?.full_name || result.profiles?.username || 'N/A';
        const className = result.classes?.name || 'N/A';
        const quizTitle = result.quiz_sets?.title || 'N/A';
        const timeText = result.time_taken ? `${Math.floor(result.time_taken / 60)}:${(result.time_taken % 60).toString().padStart(2, '0')}` : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${studentName}</td>
            <td>${className}</td>
            <td>${quizTitle}</td>
            <td><strong>${result.score || 0}/${result.total_questions || 0}</strong></td>
            <td>${timeText}</td>
            <td>${result.completed_at ? new Date(result.completed_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn-primary" onclick="viewResultDetails('${result.id || ''}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Form Handlers
async function handleAddTeacher(e) {
    console.log('handleAddTeacher called');
    e.preventDefault();
    
    const email = document.getElementById('teacherEmail').value;
    const password = document.getElementById('teacherPassword').value;
    const username = document.getElementById('teacherUsername').value;
    const fullName = document.getElementById('teacherFullName').value;
    
    console.log('Form data:', { email, password, username, fullName });
    
    if (!email || !password || !username || !fullName) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    showLoading();
    
    try {
        console.log('Creating teacher in Supabase Auth...');
        console.log('Current user:', supabase.auth.getUser());
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    full_name: fullName,
                    role: 'teacher'
                }
            }
        });
        
        console.log('Auth result:', { authData, authError });
        
        if (authError) throw authError;
        
        // Profile sẽ được tạo tự động bởi trigger function
        if (authData.user) {
            console.log('User created successfully, profile will be created by trigger...');
            console.log('User ID:', authData.user.id);
            
            // Đợi trigger tạo profile
            console.log('Waiting for trigger to create profile...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Kiểm tra profile đã được tạo chưa
            const serviceSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
            const { data: profileData, error: profileCheckError } = await serviceSupabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (profileCheckError) {
                console.log('Profile not found, creating manually...');
                // Nếu trigger không hoạt động, tạo profile thủ công
                const { error: profileError } = await serviceSupabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        username: username,
                        full_name: fullName,
                        email: email,
                        role: 'teacher',
                        created_at: new Date().toISOString()
                    });
                
                if (profileError) {
                    console.error('Manual profile creation error:', profileError);
                    throw profileError;
                }
                console.log('Profile created manually');
            } else {
                console.log('Profile created by trigger:', profileData);
            }
        }
        
        console.log('Teacher created successfully, loading teachers...');
        showSuccess('Tạo tài khoản giáo viên thành công!');
        closeModal();
        loadTeachers();
        
    } catch (error) {
        console.error('Error creating teacher:', error);
        showError('Lỗi khi tạo tài khoản giáo viên: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function handleAddClass(e) {
    e.preventDefault();
    
    const name = document.getElementById('className').value;
    const teacherId = document.getElementById('classTeacher').value;
    
    showLoading();
    
    try {
        // Generate class code
        const classCode = generateClassCode();
        
        const { data, error } = await supabase
            .from('classes')
            .insert([{
                name: name,
                class_code: classCode,
                teacher_id: teacherId
            }])
            .select();
        
        if (error) throw error;
        
        showSuccess(`Tạo lớp học thành công! Mã lớp: ${classCode}`);
        closeModal();
        loadClasses();
        
    } catch (error) {
        console.error('Error creating class:', error);
        showError('Lỗi khi tạo lớp học: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function handleAddQuizSet(e) {
    e.preventDefault();
    
    const title = document.getElementById('quizSetTitle').value;
    const classId = document.getElementById('quizSetClass').value;
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const timeLimit = parseInt(document.getElementById('timeLimit').value);
    
    // Get selected questions
    const selectedQuestions = Array.from(document.querySelectorAll('#questionsChecklist input:checked'))
        .map(cb => cb.value);
    
    if (selectedQuestions.length < questionCount) {
        showError(`Cần chọn ít nhất ${questionCount} câu hỏi!`);
        return;
    }
    
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('quiz_sets')
            .insert([{
                title: title,
                class_id: classId,
                question_ids: selectedQuestions.slice(0, questionCount),
                question_count: questionCount,
                time_limit: timeLimit * 60, // Convert to seconds
                is_active: true
            }])
            .select();
        
        if (error) throw error;
        
        showSuccess('Tạo bộ đề thành công!');
        closeModal();
        loadQuizSets();
        
    } catch (error) {
        console.error('Error creating quiz set:', error);
        showError('Lỗi khi tạo bộ đề: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function handleAddQuestion(e) {
    e.preventDefault();
    
    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value;
    const category = document.getElementById('questionCategory').value;
    
    let questionData = {
        type: type,
        text: text,
        category: category
    };
    
    if (type === 'tf') {
        const answer = document.querySelector('input[name="tfAnswer"]:checked').value === 'true';
        questionData.answer = answer;
    } else {
        const options = [
            document.getElementById('option1').value,
            document.getElementById('option2').value,
            document.getElementById('option3').value,
            document.getElementById('option4').value
        ];
        const correctIndex = parseInt(document.getElementById('correctAnswer').value);
        
        questionData.options = options;
        questionData.correct_index = correctIndex;
    }
    
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('questions')
            .insert([questionData])
            .select();
        
        if (error) throw error;
        
        showSuccess('Thêm câu hỏi thành công!');
        closeModal();
        loadQuestions();
        
    } catch (error) {
        console.error('Error creating question:', error);
        showError('Lỗi khi thêm câu hỏi: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Utility Functions
function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    
    // Load data for selects if needed
    if (modalId === 'addClassModal') {
        loadTeachersForClassSelect();
    } else if (modalId === 'addQuizSetModal') {
        loadClassesForQuizSetSelect();
        loadQuestionsForQuizSet();
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    
    // Reset forms
    document.querySelectorAll('form').forEach(form => {
        form.reset();
    });
}

function toggleQuestionType() {
    const type = document.getElementById('questionType').value;
    const tfOptions = document.getElementById('tfOptions');
    const mcqOptions = document.getElementById('mcqOptions');
    
    if (type === 'tf') {
        tfOptions.classList.remove('hidden');
        mcqOptions.classList.add('hidden');
    } else {
        tfOptions.classList.add('hidden');
        mcqOptions.classList.remove('hidden');
    }
}

async function loadTeachersForClassSelect() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .eq('role', 'teacher')
            .order('username');
        
        if (error) throw error;
        
        const select = document.getElementById('classTeacher');
        select.innerHTML = '<option value="">Chọn giáo viên</option>';
        
        data.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.username} (${teacher.full_name || 'N/A'})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading teachers for select:', error);
    }
}

async function loadClassesForQuizSetSelect() {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('quizSetClass');
        select.innerHTML = '<option value="">Chọn lớp</option>';
        
        data.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading classes for select:', error);
    }
}

async function loadQuestionsForQuizSet() {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('id, text, type, category')
            .order('category, created_at');
        
        if (error) throw error;
        
        const checklist = document.getElementById('questionsChecklist');
        checklist.innerHTML = '';
        
        data.forEach(question => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${question.id}">
                <span>[${question.type === 'tf' ? 'Đúng/Sai' : 'Trắc nghiệm'}] ${question.text}</span>
            `;
            checklist.appendChild(label);
        });
        
    } catch (error) {
        console.error('Error loading questions for quiz set:', error);
    }
}

function loadFiltersForResults() {
    // Load classes for filter
    const classFilter = document.getElementById('classFilter');
    classFilter.innerHTML = '<option value="">Tất cả lớp</option>';
    
    const uniqueClasses = [...new Set(currentData.results.map(r => r.classes?.name).filter(Boolean))];
    uniqueClasses.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classFilter.appendChild(option);
    });
    
    // Load quiz sets for filter
    const quizFilter = document.getElementById('quizFilter');
    quizFilter.innerHTML = '<option value="">Tất cả bộ đề</option>';
    
    const uniqueQuizzes = [...new Set(currentData.results.map(r => r.quiz_sets?.title).filter(Boolean))];
    uniqueQuizzes.forEach(quizTitle => {
        const option = document.createElement('option');
        option.value = quizTitle;
        option.textContent = quizTitle;
        quizFilter.appendChild(option);
    });
}

// Search and Filter Functions
function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterQuestions() {
    const category = document.getElementById('categoryFilter').value;
    const rows = document.querySelectorAll('#questionsTableBody tr');
    
    rows.forEach(row => {
        if (!category) {
            row.style.display = '';
        } else {
            const categoryCell = row.cells[2]; // Category column
            const text = categoryCell.textContent;
            row.style.display = text.includes(category) ? '' : 'none';
        }
    });
}

function filterResults() {
    const classFilter = document.getElementById('classFilter').value;
    const quizFilter = document.getElementById('quizFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    const rows = document.querySelectorAll('#resultsTableBody tr');
    
    rows.forEach(row => {
        let show = true;
        
        if (classFilter && !row.cells[1].textContent.includes(classFilter)) {
            show = false;
        }
        
        if (quizFilter && !row.cells[2].textContent.includes(quizFilter)) {
            show = false;
        }
        
        // Date filtering would need more complex logic
        // For now, just show/hide based on class and quiz filters
        
        row.style.display = show ? '' : 'none';
    });
}

// Action Functions (placeholders for now)
function editTeacher(id) {
    showError('Chức năng chỉnh sửa giáo viên đang được phát triển');
}

function deleteTeacher(id) {
    if (confirm('Bạn có chắc muốn xóa giáo viên này?')) {
        showError('Chức năng xóa giáo viên đang được phát triển');
    }
}

function editStudent(id) {
    console.log('editStudent called with id:', id);
    
    // Tìm thông tin học sinh
    const student = currentData.students.find(s => s.id === id);
    if (!student) {
        console.log('Student not found');
        showError('Không tìm thấy thông tin học sinh');
        return;
    }
    
    console.log('Student found:', student);
    
    // Hiển thị modal chỉnh sửa
    const modal = document.getElementById('editStudentModal');
    console.log('Modal element:', modal);
    
    if (modal) {
        // Điền thông tin hiện tại (chỉ username và full_name)
        const studentIdField = document.getElementById('editStudentId');
        const usernameField = document.getElementById('editStudentUsername');
        const fullNameField = document.getElementById('editStudentFullName');
        
        console.log('Form fields:', { studentIdField, usernameField, fullNameField });
        
        if (studentIdField) studentIdField.value = student.id;
        if (usernameField) usernameField.value = student.username || '';
        if (fullNameField) fullNameField.value = student.full_name || '';
        
        // Hiển thị modal
        modal.style.display = 'block';
        console.log('Modal displayed');
    } else {
        console.log('Modal not found');
        showError('Modal chỉnh sửa không tồn tại');
    }
}

async function deleteStudent(id) {
    if (confirm('Bạn có chắc muốn xóa học sinh này? Hành động này không thể hoàn tác!')) {
        try {
            // Xóa từ bảng profiles
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);
            
            if (profileError) throw profileError;
            
            // Xóa từ bảng class_members nếu có
            const { error: memberError } = await supabase
                .from('class_members')
                .delete()
                .eq('student_id', id);
            
            if (memberError) {
                console.warn('Lỗi khi xóa class_members:', memberError);
            }
            
            // Xóa từ bảng quiz_results nếu có
            const { error: resultError } = await supabase
                .from('quiz_results')
                .delete()
                .eq('student_id', id);
            
            if (resultError) {
                console.warn('Lỗi khi xóa quiz_results:', resultError);
            }
            
            showSuccess('Đã xóa học sinh thành công!');
            
            // Làm mới danh sách
            await loadStudents();
            
        } catch (error) {
            console.error('Lỗi khi xóa học sinh:', error);
            showError('Lỗi khi xóa học sinh: ' + error.message);
        }
    }
}

// Xử lý form chỉnh sửa học sinh
async function handleEditStudent(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('editStudentId').value;
    const username = document.getElementById('editStudentUsername').value.trim();
    const fullName = document.getElementById('editStudentFullName').value.trim();
    
    if (!username || !fullName) {
        showError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }
    
    try {
        // Cập nhật thông tin profile (chỉ username và full_name)
        const { error } = await supabase
            .from('profiles')
            .update({
                username: username,
                full_name: fullName
            })
            .eq('id', studentId);
        
        if (error) throw error;
        
        showSuccess('Đã cập nhật thông tin học sinh thành công!');
        closeEditStudentModal();
        
        // Làm mới danh sách
        await loadStudents();
        
    } catch (error) {
        console.error('Lỗi khi cập nhật học sinh:', error);
        showError('Lỗi khi cập nhật học sinh: ' + error.message);
    }
}

// Đóng modal chỉnh sửa học sinh
function closeEditStudentModal() {
    const modal = document.getElementById('editStudentModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('editStudentForm').reset();
    }
}

function viewClassMembers(id) {
    showError('Chức năng xem thành viên lớp đang được phát triển');
}

function editClass(id) {
    showError('Chức năng chỉnh sửa lớp đang được phát triển');
}

function deleteClass(id) {
    if (confirm('Bạn có chắc muốn xóa lớp này?')) {
        showError('Chức năng xóa lớp đang được phát triển');
    }
}

function toggleQuizSet(id, isActive) {
    showError('Chức năng bật/tắt bộ đề đang được phát triển');
}

function editQuizSet(id) {
    showError('Chức năng chỉnh sửa bộ đề đang được phát triển');
}

function deleteQuizSet(id) {
    if (confirm('Bạn có chắc muốn xóa bộ đề này?')) {
        showError('Chức năng xóa bộ đề đang được phát triển');
    }
}

function editQuestion(id) {
    showError('Chức năng chỉnh sửa câu hỏi đang được phát triển');
}

function deleteQuestion(id) {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
        showError('Chức năng xóa câu hỏi đang được phát triển');
    }
}

function viewResultDetails(id) {
    showError('Chức năng xem chi tiết kết quả đang được phát triển');
}

function exportResults() {
    showError('Chức năng xuất Excel đang được phát triển');
}

function refreshData() {
    showSection(currentSection);
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showError(message) {
    // Remove existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Insert after the current form or at the top of the page
    const form = document.querySelector('form');
    if (form) {
        form.parentNode.insertBefore(errorDiv, form.nextSibling);
    } else {
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 1rem;
        border-radius: 5px;
        z-index: 3000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Teacher Management Functions
function editTeacher(id) {
    console.log('Edit teacher clicked for ID:', id);
    
    // Find teacher data
    const teacher = currentData.teachers.find(t => t.id === id);
    if (!teacher) {
        console.error('Teacher not found:', id);
        showError('Không tìm thấy thông tin giáo viên');
        return;
    }
    
    console.log('Teacher data found:', teacher);
    
    // Populate form
    const teacherIdField = document.getElementById('editTeacherId');
    const usernameField = document.getElementById('editTeacherUsername');
    const fullNameField = document.getElementById('editTeacherFullName');
    const emailField = document.getElementById('editTeacherEmail');
    
    if (teacherIdField) teacherIdField.value = teacher.id || '';
    if (usernameField) usernameField.value = teacher.username || '';
    if (fullNameField) fullNameField.value = teacher.full_name || '';
    if (emailField) emailField.value = teacher.email || '';
    
    // Show modal
    const modal = document.getElementById('editTeacherModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function deleteTeacher(id) {
    console.log('Delete teacher clicked for ID:', id);
    
    if (!confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
        return;
    }
    
    // Find teacher data
    const teacher = currentData.teachers.find(t => t.id === id);
    if (!teacher) {
        console.error('Teacher not found:', id);
        showError('Không tìm thấy thông tin giáo viên');
        return;
    }
    
    console.log('Deleting teacher:', teacher);
    
    // Delete from profiles table
    supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                console.error('Error deleting teacher:', error);
                showError('Lỗi xóa giáo viên: ' + error.message);
                return;
            }
            
            console.log('Teacher deleted successfully');
            showSuccess('Xóa giáo viên thành công');
            loadTeachers(); // Refresh the table
        });
}

function closeEditTeacherModal() {
    const modal = document.getElementById('editTeacherModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    // Reset form
    const form = document.getElementById('editTeacherForm');
    if (form) {
        form.reset();
    }
}

// Handle edit teacher form submission
function handleEditTeacher(e) {
    e.preventDefault();
    
    const teacherId = document.getElementById('editTeacherId').value;
    const username = document.getElementById('editTeacherUsername').value;
    const fullName = document.getElementById('editTeacherFullName').value;
    
    console.log('Updating teacher:', { teacherId, username, fullName });
    
    if (!teacherId) {
        showError('Không tìm thấy ID giáo viên');
        return;
    }
    
    // Update teacher in profiles table
    supabase
        .from('profiles')
        .update({
            username: username,
            full_name: fullName
        })
        .eq('id', teacherId)
        .then(({ error }) => {
            if (error) {
                console.error('Error updating teacher:', error);
                showError('Lỗi cập nhật giáo viên: ' + error.message);
                return;
            }
            
            console.log('Teacher updated successfully');
            showSuccess('Cập nhật thông tin giáo viên thành công');
            closeEditTeacherModal();
            loadTeachers(); // Refresh the table
        });
}
