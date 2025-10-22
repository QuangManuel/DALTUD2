// Cấu hình Supabase - Version 3.0 - Fixed URL
const SUPABASE_URL = 'https://wbmlhpgdxucjaljbfcjw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibWxocGdkeHVjamFsamJmY2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzAwMjEsImV4cCI6MjA3NTM0NjAyMX0.A65069cge1AlFqTpkAvS7JrbeSJqUhtUuAd5eSItde8';

// Supabase configuration loaded

// Khởi tạo Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State của ứng dụng
let currentUser = null;
let currentSettings = {
    musicEnabled: false,
    soundEnabled: false,
    timerEnabled: false,
    questionCount: 5
};
let questions = [];
let currentQuiz = null;

// Teacher verification codes removed - teachers are now created by admin

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', function() {
    // Initializing app
    loadSettings();
    loadQuestions();
    checkAuth();
    setupEventListeners();
    
    // Set active link for home page on initial load
    setActiveNavLink('home');
    
    // Force update UI after a short delay to ensure everything is loaded
    setTimeout(() => {
        // Force updating UI after delay
        updateUI();
    }, 100);
});

// Kiểm tra trạng thái đăng nhập
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
    } else {
        currentUser = null;
    }
    updateUI();
}

// Cập nhật giao diện dựa trên trạng thái đăng nhập
function updateUI() {
    // Updating UI based on user state
    
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const builderLink = document.getElementById('builderLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    const userInfo = document.getElementById('userInfo');
    const userDropdown = document.getElementById('userDropdown');
    const classInfo = document.getElementById('classInfo');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    // User dropdown element found
    // Check user dropdown display state

    if (currentUser) {
        // Đã đăng nhập
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none'; // Ẩn profile link cũ
        if (logoutLink) logoutLink.style.display = 'none'; // Ẩn logout link cũ
        if (userInfo) userInfo.style.display = 'none'; // Ẩn user info cũ
        if (userDropdown) {
            userDropdown.style.display = 'block'; // Hiển thị user dropdown
            // User dropdown displayed
        }
        
        // Lấy thông tin profile
        getUserProfile();
        
        // Kiểm tra quyền giáo viên
        checkTeacherRole();
        
        // Ẩn welcome page khi đã đăng nhập
        const welcomeContent = document.querySelector('.welcome-content');
        if (welcomeContent) {
            welcomeContent.style.display = 'none';
        }
        
        // Load home page data for logged in user
        loadHomePageData();
    } else {
        // Chưa đăng nhập - Hiển thị trang chào mừng
        // User not logged in, showing welcome page
        if (loginLink) loginLink.style.display = 'inline';
        if (registerLink) registerLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
        if (builderLink) builderLink.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        if (userDropdown) {
            userDropdown.style.display = 'none';
            // Hiding user dropdown
        }
        if (classInfo) {
            classInfo.style.display = 'none';
            // Hiding class info
        }
        
        // Load home page data (will show welcome page if no user)
        loadHomePageData();
    }
}


// Lấy thông tin profile của user
async function getUserProfile() {
    // Getting user profile
    
    if (!currentUser) {
        // No currentUser, skipping getUserProfile
        return;
    }
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    // Profile data retrieved
    
    if (data) {
        // Cập nhật user dropdown
        const userDisplayName = document.getElementById('userDisplayName');
        const userAvatar = document.getElementById('userAvatar');
        
        // Update user display elements
        
        if (userDisplayName) {
            userDisplayName.textContent = data.full_name || data.username;
            // Updated userDisplayName
        }
        
        if (userAvatar) {
            const avatar = data.avatar || '🐱';
            
            // Kiểm tra nếu là ảnh hay emoji
            if (avatar.startsWith('data:image/') || avatar.startsWith('http')) {
                // Là ảnh - compress trước khi hiển thị
                compressAndDisplayAvatar(avatar, userAvatar);
            } else {
                // Là emoji
                userAvatar.textContent = avatar;
            }
            // Updated userAvatar
        }
        
        // Lưu role để sử dụng sau
        currentUser.role = data.role;
        
        // Cập nhật user info cũ (để tương thích)
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        if (userName) userName.textContent = data.username;
        if (userRole) userRole.textContent = data.role === 'teacher' ? 'Giáo viên' : 'Học sinh';
        
        // Hiển thị thông tin lớp cho học sinh sau khi có role
        if (data.role === 'student') {
            const classInfo = document.getElementById('classInfo');
            if (classInfo) {
                classInfo.style.display = 'block';
                loadClassInfo();
            }
        } else if (data.role === 'teacher') {
            // Redirect giáo viên vào trang quản lý lớp
            showPage('classes');
        }
        
        // Ẩn welcome page khi đã đăng nhập
        const welcomeContent = document.querySelector('.welcome-content');
        if (welcomeContent) {
            welcomeContent.style.display = 'none';
        }
    } else {
        // No profile data found for user
    }
}

// Kiểm tra quyền giáo viên
async function checkTeacherRole() {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
    
    if (data && data.role === 'teacher') {
        document.getElementById('builderLink').style.display = 'inline';
        document.getElementById('classesLink').style.display = 'inline';
    } else {
        document.getElementById('builderLink').style.display = 'none';
        document.getElementById('classesLink').style.display = 'none';
    }
}

// Toggle user menu dropdown
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('show');
    }
}

// Đóng dropdown khi click outside
document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('userDropdown');
    const userMenu = document.getElementById('userMenu');
    
    if (userDropdown && userMenu && !userDropdown.contains(event.target)) {
        userMenu.classList.remove('show');
    }
});

// Chọn avatar emoji
function selectAvatar(avatar) {
    // Ẩn ảnh, hiện emoji
    document.getElementById('currentAvatarDisplay').style.display = 'none';
    document.getElementById('currentAvatarEmoji').style.display = 'flex';
    document.getElementById('currentAvatarEmoji').textContent = avatar;
    
    // Cập nhật selected state
    const avatarButtons = document.querySelectorAll('.avatar-btn');
    avatarButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === avatar) {
            btn.classList.add('selected');
        }
    });
}

// Xử lý upload ảnh
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Kiểm tra kích thước file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showError('profileError', 'Kích thước ảnh không được vượt quá 2MB');
        return;
    }
    
    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
        showError('profileError', 'Vui lòng chọn file ảnh');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Tạo ảnh mới để resize và compress
        const img = new Image();
        img.onload = function() {
            // Tạo canvas để resize ảnh
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set size nhỏ hơn (150x150 max)
            const maxSize = 150;
            let { width, height } = img;
            
            // Tính toán kích thước mới
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Vẽ ảnh đã resize lên canvas
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert canvas thành data URL với quality 0.8
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Hiện ảnh đã compress, ẩn emoji
            const avatarImg = document.getElementById('currentAvatarDisplay');
            const emoji = document.getElementById('currentAvatarEmoji');
            
            avatarImg.src = compressedDataUrl;
            avatarImg.style.display = 'block';
            avatarImg.style.width = '100%';
            avatarImg.style.height = '100%';
            avatarImg.style.objectFit = 'cover';
            avatarImg.style.objectPosition = 'center';
            avatarImg.style.borderRadius = '50%';
            avatarImg.style.transition = 'all 0.3s ease';
            emoji.style.display = 'none';
            
            // Bỏ selected state của emoji buttons
            const avatarButtons = document.querySelectorAll('.avatar-btn');
            avatarButtons.forEach(btn => btn.classList.remove('selected'));
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Xóa ảnh đại diện
function clearAvatar() {
    // Ẩn ảnh, hiện emoji mặc định
    document.getElementById('currentAvatarDisplay').style.display = 'none';
    document.getElementById('currentAvatarEmoji').style.display = 'flex';
    document.getElementById('currentAvatarEmoji').textContent = '🐱';
    
    // Reset file input
    document.getElementById('avatarUpload').value = '';
    
    // Bỏ selected state của emoji buttons
    const avatarButtons = document.querySelectorAll('.avatar-btn');
    avatarButtons.forEach(btn => btn.classList.remove('selected'));
}

// Compress và hiển thị avatar
function compressAndDisplayAvatar(avatarSrc, targetElement) {
    const img = new Image();
    img.onload = function() {
        // Tạo canvas để resize ảnh
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set size nhỏ hơn (150x150 max)
        const maxSize = 150;
        let { width, height } = img;
        
        // Tính toán kích thước mới
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Vẽ ảnh đã resize lên canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas thành data URL với quality 0.8
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Hiển thị ảnh đã compress
        targetElement.innerHTML = `<img src="${compressedDataUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; object-position: center; border-radius: 50%; transition: all 0.3s ease;">`;
    };
    img.src = avatarSrc;
}

// Mở modal tham gia lớp
function openJoinClassModal() {
    const modal = document.getElementById('joinClassModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Đóng modal khi click bên ngoài
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeJoinClassModal();
            }
        };
    }
}

// Đóng modal tham gia lớp
function closeJoinClassModal() {
    const modal = document.getElementById('joinClassModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.getElementById('classCodeInput').value = '';
    }
}

// Xử lý khi học sinh tham gia lớp
async function handleJoinClass() {
    const classCode = document.getElementById('classCodeInput').value.trim();
    if (!classCode) {
        showError('Vui lòng nhập mã lớp.');
        return;
    }

    if (!currentUser) {
        showError('Bạn cần đăng nhập để tham gia lớp.');
        return;
    }

    try {
        // 1. Tìm lớp học bằng mã lớp
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('id, name, teacher_id')
            .eq('class_code', classCode)
            .single();

        if (classError || !classData) {
            throw new Error('Mã lớp không hợp lệ hoặc lớp không tồn tại.');
        }

        // 2. Đảm bảo profile tồn tại
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentUser.id)
            .single();

        if (profileError || !profileData) {
            console.error('Profile not found, creating one...');
            // Tạo profile nếu chưa tồn tại
            const { error: createProfileError } = await supabase
                .from('profiles')
                .insert({
                    id: currentUser.id,
                    username: currentUser.email?.split('@')[0] || 'user_' + currentUser.id.substring(0, 8),
                    full_name: currentUser.user_metadata?.full_name || '',
                    role: 'student',
                    created_at: new Date().toISOString()
                });
            
            if (createProfileError) {
                console.error('Error creating profile:', createProfileError);
                throw new Error('Lỗi tạo hồ sơ người dùng. Vui lòng thử lại.');
            }
        }

        // 3. Kiểm tra xem học sinh đã tham gia lớp này chưa
        const { data: memberData, error: memberError } = await supabase
            .from('class_members')
            .select('*')
            .eq('class_id', classData.id)
            .eq('student_id', currentUser.id)
            .single();

        if (memberData) {
            showSuccess('Bạn đã tham gia lớp này rồi.');
            closeJoinClassModal();
            loadClassInfo();
            return;
        }

        // 4. Thêm học sinh vào lớp
        const { error: insertError } = await supabase
            .from('class_members')
            .insert({
                class_id: classData.id,
                student_id: currentUser.id,
                joined_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Insert error details:', insertError);
            if (insertError.code === 'PGRST301' || insertError.message.includes('RLS')) {
                throw new Error('Lỗi bảo mật: Không thể tham gia lớp. Vui lòng liên hệ quản trị viên.');
            }
            throw new Error('Lỗi khi tham gia lớp: ' + insertError.message);
        }

        showSuccess(`Đã tham gia lớp "${classData.name}" thành công!`);
        closeJoinClassModal();
        
        // Join waiting room instead of just loading class info
        await joinWaitingRoom(classData.id, classData.name);

    } catch (error) {
        console.error('Error joining class:', error);
        showError(error.message);
    }
}

// Load thông tin lớp học cho học sinh
async function loadClassInfo() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user found');
            return;
        }

        const { data, error } = await supabase
            .from('class_members')
            .select(`
                class_id,
                classes(
                    id,
                    name,
                    class_code,
                    teacher_id,
                    profiles!classes_teacher_id_fkey(username, full_name)
                )
            `)
            .eq('student_id', user.id);
        
        if (error) throw error;
        
        const classInfo = document.getElementById('classInfo');
        if (!classInfo) {
            console.error('classInfo element not found');
            return;
        }
        
        // Reset classInfo content - chỉ cập nhật classDetails, giữ nguyên header
        const classDetails = document.getElementById('classDetails');
        if (!classDetails) {
            console.error('classDetails element not found');
            return;
        }
        
        classDetails.innerHTML = `<p id="classStatus">Đang tải thông tin lớp...</p>`;
        
        if (data && data.length > 0) {
            const classData = data[0].classes;
            const teacherName = classData.profiles?.full_name || classData.profiles?.username || 'N/A';
            
            // Lấy số lượng học sinh trong lớp
            const { data: memberCount, error: countError } = await supabase
                .from('class_members')
                .select('id', { count: 'exact' })
                .eq('class_id', classData.id);
            
            const studentCount = memberCount?.length || 0;
            
            classDetails.innerHTML = `
                <div class="class-details">
                    <div class="class-detail-item">
                        <span class="class-detail-label">Tên lớp:</span>
                        <span class="class-detail-value">${classData.name}</span>
                    </div>
                    <div class="class-detail-item">
                        <span class="class-detail-label">Mã lớp:</span>
                        <span class="class-detail-value">${classData.class_code}</span>
                    </div>
                    <div class="class-detail-item">
                        <span class="class-detail-label">Giáo viên:</span>
                        <span class="class-detail-value">${teacherName}</span>
                    </div>
                    <div class="class-detail-item">
                        <span class="class-detail-label">Tổng số sinh viên:</span>
                        <span class="class-detail-value">${studentCount}</span>
                    </div>
                </div>
            `;
        } else {
            classDetails.innerHTML = `
                <div class="no-class">
                    <p>Bạn chưa tham gia lớp học nào.</p>
                    <p>Hãy tham gia lớp học để bắt đầu làm bài quiz!</p>
                    <button class="btn-primary" onclick="openJoinClassModal()">Tham gia lớp</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading class info:', error);
        const classStatus = document.getElementById('classStatus');
        if (classStatus) {
            classStatus.textContent = 'Lỗi khi tải thông tin lớp học';
        }
    }
}

// Thiết lập event listeners
function setupEventListeners() {
    // Setting up event listeners
    
    try {
        // Form đăng nhập
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            // Login form event listener added
        } else {
            console.warn('Login form not found');
        }
        
        // Form đăng ký học sinh
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
            // Register form event listener added
        } else {
            console.warn('Register form not found');
        }
        
        // Form cài đặt
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', handleSettings);
            // Settings form event listener added
        } else {
            console.warn('Settings form not found');
        }
        
        // Form thêm câu hỏi
        const questionForm = document.getElementById('questionForm');
        if (questionForm) {
            questionForm.addEventListener('submit', handleAddQuestion);
        } else {
            console.warn('Question form not found');
        }
        
        // Form profile
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleUpdateProfile);
        } else {
            console.warn('Profile form not found');
        }
        
        // Class management event listeners
        const createClassForm = document.getElementById('createClassForm');
        if (createClassForm) {
            createClassForm.addEventListener('submit', handleCreateClass);
        } else {
            console.warn('Create class form not found');
        }
        
        const editClassForm = document.getElementById('editClassForm');
        if (editClassForm) {
            editClassForm.addEventListener('submit', handleEditClass);
        } else {
            console.warn('Edit class form not found');
        }
        
        const createQuizSetForm = document.getElementById('createQuizSetForm');
        if (createQuizSetForm) {
            createQuizSetForm.addEventListener('submit', handleCreateQuizSet);
        } else {
            console.warn('Create quiz set form not found');
        }
        
        const newQuestionForm = document.getElementById('newQuestionForm');
        if (newQuestionForm) {
            newQuestionForm.addEventListener('submit', handleNewQuestion);
        } else {
            console.warn('New question form not found');
        }
        
        // Modal close event listeners
        const closeCreateClassModal = document.getElementById('closeCreateClassModal');
        if (closeCreateClassModal) {
            closeCreateClassModal.addEventListener('click', closeCreateClassModal);
        }
        
        const closeCreateQuizSetModal = document.getElementById('closeCreateQuizSetModal');
        if (closeCreateQuizSetModal) {
            closeCreateQuizSetModal.addEventListener('click', closeCreateQuizSetModal);
        }
        
        const closeAddQuestionsModal = document.getElementById('closeAddQuestionsModal');
        if (closeAddQuestionsModal) {
            closeAddQuestionsModal.addEventListener('click', closeAddQuestionsModal);
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Xử lý đăng nhập
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        updateUI();
        
        // Load profile để lấy thông tin user
        await getUserProfile();
        
        // Redirect sẽ được xử lý sau khi load profile
        showPage('home'); // Tạm thời vào trang chủ
        
        showSuccess('Đăng nhập thành công!');
        
    } catch (error) {
        showError('loginError', error.message);
    }
}

// Xử lý đăng ký học sinh
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;
    const fullName = document.getElementById('registerFullName').value;
    const role = 'student'; // Luôn là student
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    full_name: fullName,
                    role: role
                }
            }
        });
        
        if (error) throw error;
        
        showSuccess('Đăng ký học sinh thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        showPage('login');
        
    } catch (error) {
        showError('registerError', error.message);
    }
}


// Xử lý cài đặt
function handleSettings(e) {
    e.preventDefault();
    
    currentSettings = {
        musicEnabled: document.getElementById('musicEnabled').checked,
        soundEnabled: document.getElementById('soundEnabled').checked,
        timerEnabled: false, // Luôn false cho học sinh
        questionCount: 5 // Luôn 5 cho học sinh
    };
    
    saveSettings();
    showSuccess('Đã lưu cài đặt!');
}

// Xử lý thêm câu hỏi
async function handleAddQuestion(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showError('questionError', 'Vui lòng đăng nhập trước');
        return;
    }
    
    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value;
    const category = document.getElementById('questionCategory').value || 'General';
    
    let questionData = {
        type: type,
        text: text,
        category: category,
        created_by: currentUser.id
    };
    
    const isEditMode = window.editingBuilderQuestionId;
    
    if (type === 'tf') {
        questionData.correct_answer = document.getElementById('tfAnswer').value;
    } else {
        const options = [
            document.getElementById('optionA').value,
            document.getElementById('optionB').value,
            document.getElementById('optionC').value,
            document.getElementById('optionD').value
        ];
        
        if (options.some(opt => !opt.trim())) {
            showError('questionError', 'Vui lòng điền đầy đủ 4 lựa chọn');
            return;
        }
        
        questionData.options = options;
        questionData.correct_answer = parseInt(document.getElementById('correctAnswer').value);
    }
    
    try {
        let result;
        if (isEditMode) {
            // Update existing question
            const { data, error } = await supabase
                .from('questions')
                .update(questionData)
                .eq('id', isEditMode)
                .select();
            
            if (error) throw error;
            result = data;
            
            showSuccess('Cập nhật câu hỏi thành công!');
            
            // Clear edit mode
            window.editingBuilderQuestionId = null;
            
            // Reset button text
            const submitBtn = document.querySelector('#questionForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Thêm câu hỏi';
            }
            
        } else {
            // Create new question
            const { data, error } = await supabase
                .from('questions')
                .insert([questionData])
                .select();
            
            if (error) throw error;
            result = data;
            
            showSuccess('Thêm câu hỏi thành công!');
        }
        
        document.getElementById('questionForm').reset();
        toggleQuestionType();
        
        // Refresh questions list if on manage tab
        if (document.getElementById('manageQuestionsTab').classList.contains('active')) {
            loadBuilderQuestions();
        }
        
    } catch (error) {
        showError('questionError', error.message);
    }
}

// Xử lý cập nhật profile
async function handleUpdateProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('profileFullName').value;
    
    // Lấy avatar (ảnh hoặc emoji)
    const img = document.getElementById('currentAvatarDisplay');
    const emoji = document.getElementById('currentAvatarEmoji');
    let avatar;
    
    if (img.style.display !== 'none' && img.src) {
        // Đang dùng ảnh
        avatar = img.src;
    } else {
        // Đang dùng emoji
        avatar = emoji.textContent;
    }
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                full_name: fullName,
                avatar: avatar
            })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        showSuccess('Đã cập nhật thông tin!');
        getUserProfile(); // Cập nhật lại thông tin user
        
    } catch (error) {
        showError('profileError', error.message);
    }
}

// Đăng xuất
async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    updateUI();
    showPage('home');
    showSuccess('Đã đăng xuất!');
}

// Hiển thị trang
function showPage(pageName) {
    
    // Ẩn tất cả trang
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    
    // Hiển thị trang được chọn
    const targetPage = document.getElementById(pageName + '-page');
    
    if (targetPage) {
        targetPage.style.display = 'block';
        
        // Load data for specific pages
        if (pageName === 'builder') {
            // Load questions when builder page is shown
            setTimeout(() => {
                if (document.getElementById('manageQuestionsTab').classList.contains('active')) {
                    loadBuilderQuestions();
                }
            }, 100);
        }
    } else {
        console.error('Page not found:', pageName + '-page');
    }
    
    // Set active navigation link
    setActiveNavLink(pageName);
    
    // Xử lý đặc biệt cho một số trang
    if (pageName === 'settings') {
        loadSettingsToForm();
    } else if (pageName === 'profile') {
        loadProfileToForm();
    } else if (pageName === 'quiz') {
        startQuiz();
    } else if (pageName === 'classes') {
        loadClasses();
        loadClassesStats();
    } else if (pageName === 'home') {
        // Nếu đang ở trạng thái phòng chờ đã lưu, chuyển thẳng vào phòng chờ
        try {
            const persisted = JSON.parse(localStorage.getItem('waitingClass') || 'null');
            if (persisted?.classId) {
                joinWaitingRoom(persisted.classId, persisted.className || 'Lớp học');
                return;
            }
        } catch (_) {}
        loadHomePageData();
    } else if (pageName === 'builder') {
        // Initialize builder page
        toggleQuestionType();
    }
}

// Set active navigation link
function setActiveNavLink(pageName) {
    // Remove active class from all nav links
    const allNavLinks = document.querySelectorAll('nav a');
    allNavLinks.forEach(link => link.classList.remove('active-nav-link'));
    
    // Add active class to current page link
    let activeLinkId = '';
    switch(pageName) {
        case 'home':
            activeLinkId = 'homeNavLink';
            break;
        case 'settings':
            activeLinkId = 'settingsNavLink';
            break;
        case 'login':
            activeLinkId = 'loginLink';
            break;
        case 'register':
            activeLinkId = 'registerLink';
            break;
        case 'builder':
            activeLinkId = 'builderLink';
            break;
        case 'classes':
            activeLinkId = 'classesLink';
            break;
        case 'my-classes':
            activeLinkId = 'myClassesLink';
            break;
        case 'profile':
            activeLinkId = 'profileLink';
            break;
    }
    
    if (activeLinkId) {
        const activeLink = document.getElementById(activeLinkId);
        if (activeLink) {
            activeLink.classList.add('active-nav-link');
        }
    }
}

// Toggle loại câu hỏi
function toggleQuestionType() {
    try {
        const typeSelect = document.getElementById('questionType');
        const tfOptions = document.getElementById('tf-options');
        const mcqOptions = document.getElementById('mcq-options');
        
        if (!typeSelect) {
            console.error('questionType select not found');
            return;
        }
        
        if (!tfOptions) {
            console.error('tf-options not found');
            return;
        }
        
        if (!mcqOptions) {
            console.error('mcq-options not found');
            return;
        }
        
        const type = typeSelect.value;
        
        if (type === 'tf') {
            tfOptions.style.display = 'block';
            mcqOptions.style.display = 'none';
        } else {
            tfOptions.style.display = 'none';
            mcqOptions.style.display = 'block';
        }
    } catch (error) {
        console.error('Error in toggleQuestionType:', error);
    }
}

// Bắt đầu quiz
async function startQuiz() {
    const quizContent = document.getElementById('quiz-content');
    quizContent.innerHTML = '<div class="loading">Đang tải câu hỏi...</div>';
    
    try {
        // Supabase không hỗ trợ order('random()') trong REST.
        // Lấy danh sách câu hỏi rồi random trên client.
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data.length === 0) {
            quizContent.innerHTML = '<div class="card"><h2>Không có câu hỏi nào trong hệ thống!</h2></div>';
            return;
        }
        
        // Trộn ngẫu nhiên và lấy đúng số lượng yêu cầu
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        questions = shuffled.slice(0, Math.min(currentSettings.questionCount, shuffled.length));
        currentQuiz = {
            currentQuestion: 0,
            score: 0,
            answers: []
        };
        
        showQuestion();
        
    } catch (error) {
        quizContent.innerHTML = '<div class="error">Lỗi khi tải câu hỏi: ' + error.message + '</div>';
    }
}

// Hiển thị câu hỏi
function showQuestion() {
    const question = questions[currentQuiz.currentQuestion];
    const quizContent = document.getElementById('quiz-content');
    
    let html = `
        <div class="quiz-progress">
            <span>Câu ${currentQuiz.currentQuestion + 1}/${questions.length}</span>
            <span>Điểm: ${currentQuiz.score}</span>
        </div>
        <div class="quiz-question">
            <h2>${question.text}</h2>
        </div>
        <div class="quiz-options">
    `;
    
    if (question.type === 'tf') {
        html += `
            <div class="quiz-option" onclick="selectAnswer(true)">
                <strong>Đúng</strong>
            </div>
            <div class="quiz-option" onclick="selectAnswer(false)">
                <strong>Sai</strong>
            </div>
        `;
    } else {
        question.options.forEach((option, index) => {
            html += `
                <div class="quiz-option" onclick="selectAnswer(${index})">
                    <strong>${String.fromCharCode(65 + index)}.</strong> ${option}
                </div>
            `;
        });
    }
    
    html += '</div>';
    quizContent.innerHTML = html;
}

// Chọn đáp án
function selectAnswer(answer) {
    const question = questions[currentQuiz.currentQuestion];
    let isCorrect = false;
    
    if (question.type === 'tf') {
        isCorrect = (answer === question.answer);
    } else {
        isCorrect = (answer === question.correct_index);
    }
    
    if (isCorrect) {
        currentQuiz.score++;
    }
    
    currentQuiz.answers.push({
        questionId: question.id,
        answer: answer,
        isCorrect: isCorrect
    });
    
    // Chuyển sang câu tiếp theo
    currentQuiz.currentQuestion++;
    
    if (currentQuiz.currentQuestion < questions.length) {
        showQuestion();
    } else {
        showQuizResult();
    }
}

// Hiển thị kết quả quiz
function showQuizResult() {
    const quizContent = document.getElementById('quiz-content');
    const percentage = Math.round((currentQuiz.score / questions.length) * 100);
    
    let message = '';
    if (percentage >= 80) {
        message = 'Xuất sắc! 🎉';
    } else if (percentage >= 60) {
        message = 'Tốt! 👍';
    } else {
        message = 'Cần cố gắng thêm! 💪';
    }
    
    quizContent.innerHTML = `
        <div class="quiz-result">
            <h2>Kết thúc bài thi</h2>
            <div class="score">${currentQuiz.score}/${questions.length}</div>
            <p>Điểm số: ${percentage}%</p>
            <p>${message}</p>
            <button onclick="showPage('home')" class="btn-primary">Về trang chủ</button>
            <button onclick="startQuiz()" class="btn-secondary">Làm lại</button>
        </div>
    `;
}

// Load cài đặt vào form
function loadSettingsToForm() {
    document.getElementById('musicEnabled').checked = currentSettings.musicEnabled;
    document.getElementById('soundEnabled').checked = currentSettings.soundEnabled;
    // Không load timerEnabled và questionCount vì học sinh không thể thay đổi
}

// Load profile vào form
async function loadProfileToForm() {
    if (!currentUser) return;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (data) {
        document.getElementById('profileUsername').value = data.username || '';
        document.getElementById('profileFullName').value = data.full_name || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profileRole').value = data.role === 'teacher' ? 'Giáo viên' : 'Học sinh';
        
        // Load avatar (ảnh hoặc emoji)
        const currentAvatar = data.avatar || '🐱';
        const img = document.getElementById('currentAvatarDisplay');
        const emoji = document.getElementById('currentAvatarEmoji');
        
        // Kiểm tra nếu là URL ảnh hay emoji
        if (currentAvatar.startsWith('data:image/') || currentAvatar.startsWith('http')) {
            // Là ảnh
            img.src = currentAvatar;
            img.style.display = 'flex';
            emoji.style.display = 'none';
        } else {
            // Là emoji
            emoji.textContent = currentAvatar;
            emoji.style.display = 'flex';
            img.style.display = 'none';
            
            // Set selected avatar button
            const avatarButtons = document.querySelectorAll('.avatar-btn');
            avatarButtons.forEach(btn => {
                btn.classList.remove('selected');
                if (btn.textContent === currentAvatar) {
                    btn.classList.add('selected');
                }
            });
        }
    }
}

// Load cài đặt từ localStorage
function loadSettings() {
    const saved = localStorage.getItem('quizSettings');
    if (saved) {
        currentSettings = { ...currentSettings, ...JSON.parse(saved) };
    }
}

// Lưu cài đặt vào localStorage
function saveSettings() {
    localStorage.setItem('quizSettings', JSON.stringify(currentSettings));
}

// Load câu hỏi từ database
async function loadQuestions() {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        questions = data || [];
        
    } catch (error) {
        console.error('Lỗi khi tải câu hỏi:', error);
    }
}

// Hiển thị lỗi
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        // Fallback: tạo thông báo lỗi tạm thời
        const errorNotification = document.createElement('div');
        errorNotification.className = 'error-notification';
        errorNotification.textContent = message;
        errorNotification.style.position = 'fixed';
        errorNotification.style.bottom = '20px';
        errorNotification.style.right = '20px';
        errorNotification.style.zIndex = '9999';
        errorNotification.style.padding = '1rem 1.5rem';
        errorNotification.style.borderRadius = '12px';
        errorNotification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        errorNotification.style.color = 'white';
        errorNotification.style.fontWeight = '600';
        errorNotification.style.fontSize = '0.95rem';
        errorNotification.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.3)';
        errorNotification.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        errorNotification.style.backdropFilter = 'blur(10px)';
        errorNotification.style.transform = 'translateY(100px)';
        errorNotification.style.opacity = '0';
        errorNotification.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        errorNotification.style.maxWidth = '300px';
        errorNotification.style.wordWrap = 'break-word';
        
        document.body.appendChild(errorNotification);
        
        // Animate in
        setTimeout(() => {
            errorNotification.style.transform = 'translateY(0)';
            errorNotification.style.opacity = '1';
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorNotification.style.transform = 'translateY(100px)';
            errorNotification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(errorNotification)) {
                    document.body.removeChild(errorNotification);
                }
            }, 300);
        }, 5000);
    }
}

// Hiển thị thành công
function showSuccess(message) {
    // Tạo thông báo tạm thời
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.textContent = message;
    successDiv.style.position = 'fixed';
    successDiv.style.bottom = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '9999';
    successDiv.style.padding = '1rem 1.5rem';
    successDiv.style.borderRadius = '12px';
    successDiv.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    successDiv.style.color = 'white';
    successDiv.style.fontWeight = '600';
    successDiv.style.fontSize = '0.95rem';
    successDiv.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
    successDiv.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    successDiv.style.backdropFilter = 'blur(10px)';
    successDiv.style.transform = 'translateY(100px)';
    successDiv.style.opacity = '0';
    successDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    successDiv.style.maxWidth = '300px';
    successDiv.style.wordWrap = 'break-word';
    
    document.body.appendChild(successDiv);
    
    // Animate in
    setTimeout(() => {
        successDiv.style.transform = 'translateY(0)';
        successDiv.style.opacity = '1';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        successDiv.style.transform = 'translateY(100px)';
        successDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Classes Management Functions
async function loadClassesStats() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get total classes
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', user.id);

        if (classesError) throw classesError;

        // Get total students
        const { data: students, error: studentsError } = await supabase
            .from('class_members')
            .select('id')
            .in('class_id', classes?.map(c => c.id) || []);

        if (studentsError) throw studentsError;

        // Get total questions
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('id')
            .eq('created_by', user.id);

        if (questionsError) throw questionsError;

        // Update UI
        const totalClassesEl = document.getElementById('totalClasses');
        const totalStudentsEl = document.getElementById('totalStudents');
        const totalQuestionsEl = document.getElementById('totalQuestions');
        
        if (totalClassesEl) totalClassesEl.textContent = classes?.length || 0;
        if (totalStudentsEl) totalStudentsEl.textContent = students?.length || 0;
        if (totalQuestionsEl) totalQuestionsEl.textContent = questions?.length || 0;

    } catch (error) {
        console.error('Error loading classes stats:', error);
    }
}

// Refresh classes
function refreshClasses() {
    loadClasses();
    loadClassesStats();
}

// Load classes list
async function loadClasses() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: classes, error } = await supabase
            .from('classes')
            .select(`
                *,
                class_members(count)
            `)
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderClassesList(classes || []);

    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Lỗi khi tải danh sách lớp học');
    }
}

// Render classes list
function renderClassesList(classes) {
    const classesList = document.getElementById('classesList');
    if (!classesList) return;

    if (classes.length === 0) {
        classesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chalkboard"></i>
                <h3>Chưa có lớp học nào</h3>
                <p>Hãy tạo lớp học đầu tiên của bạn</p>
                <button onclick="showCreateClassModal()" class="btn-primary">
                    <i class="fas fa-plus"></i>
                    Tạo lớp mới
                </button>
            </div>
        `;
        return;
    }

    classesList.innerHTML = classes.map(classItem => `
        <div class="class-item" onclick="openClassSettings('${classItem.id}')" style="cursor: pointer;">
            <div class="class-info">
                <h4>${classItem.name || 'Chưa có tên'}</h4>
                <p><i class="fas fa-users"></i> ${classItem.class_members?.[0]?.count || 0} học sinh</p>
                <p><i class="fas fa-calendar"></i> Tạo ngày: ${classItem.created_at ? new Date(classItem.created_at).toLocaleDateString('vi-VN') : 'N/A'}</p>
                <p><i class="fas fa-key"></i> Mã lớp: <strong>${classItem.class_code || 'N/A'}</strong></p>
            </div>
            <div class="class-actions" onclick="event.stopPropagation()">
                <button class="btn-edit" onclick="editClass('${classItem.id}')" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteClass('${classItem.id}')" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

}

// Load quiz sets for a specific class
async function loadQuizSetsForClass(classId) {
    try {
        const { data: quizSets, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Add question count manually
        const quizSetsWithCount = await Promise.all(
            (quizSets || []).map(async (quizSet) => {
                const { count } = await supabase
                    .from('quiz_set_questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('quiz_set_id', quizSet.id);
                
                return {
                    ...quizSet,
                    question_count: count || 0
                };
            })
        );

        renderQuizSetsForClass(classId, quizSetsWithCount);

    } catch (error) {
        console.error('Error loading quiz sets for class:', error);
        // Render empty list if error
        renderQuizSetsForClass(classId, []);
    }
}

// Render quiz sets for a specific class
function renderQuizSetsForClass(classId, quizSets) {
    const quizSetsContainer = document.getElementById(`quizSets-${classId}`);
    if (!quizSetsContainer) return;

    if (quizSets.length === 0) {
        quizSetsContainer.innerHTML = `
            <div class="empty-state" style="padding: 1rem; text-align: center; color: #6b7280;">
                <i class="fas fa-file-alt" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p>Chưa có bộ đề nào</p>
            </div>
        `;
        return;
    }

    quizSetsContainer.innerHTML = quizSets.map(quizSet => `
        <div class="quiz-set-item">
            <div class="quiz-set-header">
                <div class="quiz-set-info">
                    <h4>${quizSet.title}</h4>
                    <p>${quizSet.description || 'Không có mô tả'}</p>
                </div>
                <div class="quiz-set-actions">
                    <button class="btn-quizset-action primary" onclick="showAddQuestionsModal('${quizSet.id}', '${classId}')">
                        <i class="fas fa-plus"></i>
                        Thêm câu hỏi
                    </button>
                    <button class="btn-quizset-action" onclick="editQuizSet('${quizSet.id}')">
                        <i class="fas fa-edit"></i>
                        Sửa
                    </button>
                    <button class="btn-quizset-action" onclick="deleteQuizSet('${quizSet.id}')">
                        <i class="fas fa-trash"></i>
                        Xóa
                    </button>
                </div>
            </div>
            <div class="quiz-set-stats">
                <span><i class="fas fa-question-circle"></i> ${quizSet.quiz_set_questions?.[0]?.count || 0} câu hỏi</span>
                <span><i class="fas fa-calendar"></i> ${new Date(quizSet.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
    `).join('');
}

// Edit class
async function editClass(classId) {

    
    // Get current class data
    const { data: classData, error: fetchError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();
    
    if (fetchError) {
        console.error('Error fetching class:', fetchError);
        showError('Lỗi khi tải thông tin lớp học');
        return;
    }
    
    // Fill edit modal with current data
    document.getElementById('editClassId').value = classId;
    document.getElementById('editClassName').value = classData.name || '';
    document.getElementById('editClassDescription').value = classData.description || '';
    
    // Show edit modal
    const modal = document.getElementById('editClassModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

// Close edit class modal
function closeEditClassModal() {
    const modal = document.getElementById('editClassModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Handle edit class form submission
async function handleEditClass(e) {
    e.preventDefault();
    
    const classId = document.getElementById('editClassId').value;
    const className = document.getElementById('editClassName').value;
    const classDescription = document.getElementById('editClassDescription').value;
    
    if (!className.trim()) {
        showError('Vui lòng nhập tên lớp');
        return;
    }
    
    try {
        const { error: updateError } = await supabase
            .from('classes')
            .update({ 
                name: className.trim(),
                description: classDescription.trim() || null
            })
            .eq('id', classId);
        
        if (updateError) throw updateError;
        
        showSuccess('Cập nhật lớp học thành công!');
        closeEditClassModal();
        loadClasses(); // Refresh the list
        
    } catch (error) {
        console.error('Error updating class:', error);
        showError('Lỗi khi cập nhật lớp học: ' + error.message);
    }
}

// Delete class
async function deleteClass(classId) {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này? Hành động này không thể hoàn tác!')) {
        return;
    }
    

    
    try {
        // First delete related data
        const { error: deleteMembersError } = await supabase
            .from('class_members')
            .delete()
            .eq('class_id', classId);
        
        if (deleteMembersError) {
            console.warn('Error deleting class members:', deleteMembersError);
        }
        
        // Delete quiz sets and related data
        const { error: deleteQuizSetsError } = await supabase
            .from('quiz_sets')
            .delete()
            .eq('class_id', classId);
        
        if (deleteQuizSetsError) {
            console.warn('Error deleting quiz sets:', deleteQuizSetsError);
        }
        
        // Finally delete the class
        const { error: deleteClassError } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId);
        
        if (deleteClassError) throw deleteClassError;
        
        showSuccess('Xóa lớp học thành công!');
        loadClasses(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting class:', error);
        showError('Lỗi khi xóa lớp học: ' + error.message);
    }
}

// Show create class modal
function showCreateClassModal() {

    const modal = document.getElementById('createClassModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

// Close create class modal
function closeCreateClassModal() {
    const modal = document.getElementById('createClassModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    // Reset form
    const form = document.getElementById('createClassForm');
    if (form) {
        form.reset();
    }
}

// Handle create class form submission
async function handleCreateClass(e) {
    e.preventDefault();
    const className = document.getElementById('className').value;
    const classDescription = document.getElementById('classDescription').value;
    
    if (!className.trim()) {
        showError('Vui lòng nhập tên lớp');
        return;
    }
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để tạo lớp');
            return;
        }
        
        // Generate unique class code
        const classCode = generateClassCode();
        
        const { data, error } = await supabase
            .from('classes')
            .insert({
                name: className,
                class_code: classCode,
                teacher_id: user.id,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        

        
        // Close create class modal first
        closeCreateClassModal();
        
        // Show class code modal
        showClassCodeModal(classCode, className);
        
        // Refresh classes list
        loadClasses();
        loadClassesStats();
        
    } catch (error) {
        console.error('Error creating class:', error);
        showError('Lỗi khi tạo lớp: ' + error.message);
    }
}

// Generate unique class code
function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Show class code modal
function showClassCodeModal(classCode, className) {
    const modal = document.getElementById('shareClassModal');
    if (modal) {
        // Update modal content
        const classCodeElement = document.getElementById('shareClassCode');
        if (classCodeElement) {
            classCodeElement.textContent = classCode;
        }
        
        // Show modal
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Show success message
        showSuccess(`Tạo lớp "${className}" thành công! Mã mời: ${classCode}`);
    }
}

// Show create quiz set modal
function showCreateQuizSetModal(classId) {

    const modal = document.getElementById('createQuizSetModal');
    const classIdInput = document.getElementById('quizSetClassId');
    
    if (modal && classIdInput) {
        classIdInput.value = classId;
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

// Close create quiz set modal
function closeCreateQuizSetModal() {
    const modal = document.getElementById('createQuizSetModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    // Reset form
    const form = document.getElementById('createQuizSetForm');
    if (form) {
        form.reset();
    }
}

// Toggle question mode
function toggleQuestionMode() {
    const randomSettings = document.getElementById('randomSettings');
    const questionMode = document.querySelector('input[name="questionMode"]:checked').value;
    

    
    if (questionMode === 'random') {
        randomSettings.style.display = 'block';

    } else {
        randomSettings.style.display = 'none';

    }
}

// Update random count (placeholder function)
function updateRandomCount() {
    const randomCountInput = document.getElementById('randomQuestionCount');
    const currentValue = parseInt(randomCountInput.value) || 10;
    
    // Simple validation and update
    if (currentValue < 1) {
        randomCountInput.value = 1;
    } else if (currentValue > 50) {
        randomCountInput.value = 50;
    }
    

}

// Get random questions
async function getRandomQuestions(count) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để lấy câu hỏi');
            return [];
        }
        
        // Get all questions created by current user
        const { data: questions, error } = await supabase
            .from('questions')
            .select('id')
            .eq('created_by', user.id);
        
        if (error) throw error;
        
        if (!questions || questions.length === 0) {
            showError('Không có câu hỏi nào để chọn ngẫu nhiên. Vui lòng tạo câu hỏi trước.');
            return [];
        }
        
        if (questions.length < count) {
            showError(`Chỉ có ${questions.length} câu hỏi, không đủ để chọn ${count} câu. Sẽ chọn tất cả ${questions.length} câu.`);
            return questions.map(q => q.id);
        }
        
        // Shuffle and pick random questions
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(q => q.id);
        
    } catch (error) {
        console.error('Error getting random questions:', error);
        showError('Lỗi khi lấy câu hỏi ngẫu nhiên: ' + error.message);
        return [];
    }
}

// Handle create quiz set form submission
async function handleCreateQuizSet(e) {
    e.preventDefault();
    const quizSetName = document.getElementById('quizSetName')?.value || '';
    const quizSetDescription = document.getElementById('quizSetDescription')?.value || '';
    const classId = document.getElementById('quizSetClassId')?.value || '';
    const questionMode = document.querySelector('input[name="questionMode"]:checked')?.value || 'manual';
    
    if (!quizSetName || !quizSetName.trim()) {
        showError('Vui lòng nhập tên bộ đề');
        return;
    }
    
    if (!classId) {
        showError('Không tìm thấy thông tin lớp học');
        return;
    }
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để tạo bộ đề');
            return;
        }
        
        let questionIds = [];
        let randomCount = null;
        
        if (questionMode === 'random') {
            const randomCountInput = document.getElementById('randomQuestionCount')?.value;
            randomCount = parseInt(randomCountInput);
            
            if (isNaN(randomCount) || randomCount < 1) {
                showError('Vui lòng nhập số câu hỏi hợp lệ');
                return;
            }
            
            // Get random questions
            questionIds = await getRandomQuestions(randomCount);
            if (questionIds.length === 0) {
                return; // Error already shown in getRandomQuestions
            }
        }
        
        // Prepare insert data
        const insertData = {
            title: quizSetName.trim(),
            description: quizSetDescription.trim() || null,
            class_id: classId,
            question_ids: questionIds,
            created_by: user.id,
            created_at: new Date().toISOString()
        };
        
        // Only add question_mode and random_count if they exist in database
        if (questionMode) {
            insertData.question_mode = questionMode;
        }
        if (randomCount !== null) {
            insertData.random_count = randomCount;
        }
        
        const { data, error } = await supabase
            .from('quiz_sets')
            .insert(insertData)
            .select()
            .single();
        
        if (error) {
            console.error('Database error:', error);
            
            // If columns don't exist, try without them
            if (error.code === 'PGRST204' && error.message.includes('question_mode')) {

                
                const { data: retryData, error: retryError } = await supabase
                    .from('quiz_sets')
                    .insert({
                        title: quizSetName.trim(),
                        description: quizSetDescription.trim() || null,
                        class_id: classId,
                        question_ids: questionIds,
                        created_by: user.id,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (retryError) throw retryError;
                
                console.log('Quiz set created (without question_mode):', retryData);
                showSuccess(`Bộ đề "${quizSetName}" đã được tạo thành công!`);
            } else {
                throw error;
            }
        } else {

            
            const successMessage = questionMode === 'random' 
                ? `Tạo bộ đề thành công với ${questionIds.length} câu hỏi ngẫu nhiên!`
                : 'Tạo bộ đề thành công!';
            
            showSuccess(successMessage);
        }
        
        closeCreateQuizSetModal();
        
        // Refresh both quiz sets display and selection dropdown
        if (window.currentClassId) {
            await loadQuizSetsForClassSettings(window.currentClassId);
            await loadQuizSetsForSelection(window.currentClassId);
        }
        
        // Refresh classes list to show updated quiz sets
        loadClasses();
        
    } catch (error) {
        console.error('Error creating quiz set:', error);
        showError('Lỗi khi tạo bộ đề: ' + error.message);
    }
}

// Show add questions modal
async function showAddQuestionsModal(quizSetId, classId, isEditMode = false) {

    const modal = document.getElementById('addQuestionsModal');
    
    if (modal) {
        // Store current quiz set and class IDs
        modal.dataset.quizSetId = quizSetId;
        modal.dataset.classId = classId;
        modal.dataset.isEditMode = isEditMode;
        
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Update modal title and button text based on mode
        const modalTitle = modal.querySelector('.modal-header h3');
        const addButton = modal.querySelector('.modal-actions .btn-primary');
        
        if (isEditMode) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa câu hỏi bộ đề';
            if (addButton) {
                addButton.innerHTML = '<i class="fas fa-save"></i> Cập nhật câu hỏi đã chọn';
            }
        } else {
            modalTitle.innerHTML = '<i class="fas fa-question-circle"></i> Thêm câu hỏi vào bộ đề';
            if (addButton) {
                addButton.innerHTML = '<i class="fas fa-plus"></i> Thêm câu hỏi đã chọn';
            }
        }
        
        // Initialize the form
        initializeAddQuestionsModal();
        
        // Load existing questions first
        await loadExistingQuestions();
        
        // If edit mode, load current quiz set questions after questions are loaded
        if (isEditMode) {
            // Wait a bit for DOM to update
            setTimeout(() => {
                loadCurrentQuizSetQuestions(quizSetId);
            }, 100);
        }
    }
}

// Initialize add questions modal
function initializeAddQuestionsModal() {
    try {

        
        // Set default tab to existing questions
        switchTab('existing');
        
        // Initialize new question form
        toggleNewQuestionType();
        

    } catch (error) {
        console.error('Error initializing add questions modal:', error);
    }
}

// Close add questions modal
function closeAddQuestionsModal() {
    const modal = document.getElementById('addQuestionsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Switch between tabs
function switchTab(tabName) {
    try {

        
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab
        const tabButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        const tabContent = document.getElementById(`${tabName}QuestionsTab`);
        
        if (tabButton) {
            tabButton.classList.add('active');

        } else {
            console.error('Tab button not found for:', tabName);
        }
        
        if (tabContent) {
            tabContent.classList.add('active');

        } else {
            console.error('Tab content not found for:', tabName);
        }
        
        if (tabName === 'existing') {
            loadExistingQuestions();
        } else if (tabName === 'random') {
            loadCategoriesForRandom();
        }
    } catch (error) {
        console.error('Error switching tab:', error);
    }
}

// Load existing questions
async function loadExistingQuestions() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để xem câu hỏi');
            return;
        }
        
        // Load all questions, not just current user's questions
        const { data: questions, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        

        renderQuestionsList(questions || []);
        loadCategories(questions || []);
        
    } catch (error) {
        console.error('Error loading questions:', error);
        showError('Lỗi khi tải câu hỏi');
    }
}

// Render questions list
function renderQuestionsList(questions) {
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) return;
    
    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center; color: #6b7280;">
                <i class="fas fa-question-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Chưa có câu hỏi nào. Hãy tạo câu hỏi mới!</p>
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = questions.map(question => {
        const isTrueFalse = question.type === 'tf';
        const options = isTrueFalse 
            ? ['Đúng', 'Sai']
            : (question.options || []);
        
        return `
            <div class="question-item">
                <div class="question-checkbox">
                    <input type="checkbox" id="q_${question.id}" value="${question.id}">
                    <label for="q_${question.id}"></label>
                </div>
                <div class="question-content">
                    <div class="question-text">${question.text}</div>
                    <div class="question-meta">
                        <span class="question-type">${isTrueFalse ? 'Đúng/Sai' : '4 lựa chọn'}</span>
                        <span class="question-category">${question.category || 'General'}</span>
                    </div>
                    <div class="question-options">
                        ${options.map((option, index) => `
                            <span class="option ${isTrueFalse && index === (question.answer ? 0 : 1) ? 'correct' : ''}">
                                ${String.fromCharCode(65 + index)}. ${option}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load categories for filter
function loadCategories(questions) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
    
    categoryFilter.innerHTML = '<option value="">Tất cả chủ đề</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Add selected questions to quiz set
async function addSelectedQuestions() {
    const modal = document.getElementById('addQuestionsModal');
    const quizSetId = modal?.dataset.quizSetId;
    const isEditMode = modal?.dataset.isEditMode === 'true';
    
    if (!quizSetId) {
        showError('Không tìm thấy thông tin bộ đề');
        return;
    }
    
    const selectedQuestions = Array.from(document.querySelectorAll('#questionsList input:checked'))
        .map(cb => cb.value);
    
    if (selectedQuestions.length === 0) {
        showError('Vui lòng chọn ít nhất một câu hỏi');
        return;
    }
    
    try {
        let finalQuestions;
        
        if (isEditMode) {
            // In edit mode, replace all questions with selected ones
            finalQuestions = selectedQuestions;

        } else {
            // In add mode, merge with existing questions
            const { data: quizSet, error: getError } = await supabase
                .from('quiz_sets')
                .select('question_ids')
                .eq('id', quizSetId)
                .single();
            
            if (getError) throw getError;
            
            const currentQuestions = quizSet.question_ids || [];
            finalQuestions = [...new Set([...currentQuestions, ...selectedQuestions])];

        }
        
        // Update quiz set
        const { error: updateError } = await supabase
            .from('quiz_sets')
            .update({ question_ids: finalQuestions })
            .eq('id', quizSetId);
        
        if (updateError) throw updateError;
        
        const actionText = isEditMode ? 'cập nhật' : 'thêm';
        showSuccess(`Đã ${actionText} ${selectedQuestions.length} câu hỏi vào bộ đề`);
        closeAddQuestionsModal();
        loadQuizSetsForClassSettings(window.currentClassId);
        
    } catch (error) {
        console.error('Error adding questions to quiz set:', error);
        showError('Lỗi khi thêm câu hỏi: ' + error.message);
    }
}

// Filter questions
function filterQuestions() {
    const searchTerm = document.getElementById('questionSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const questionItems = document.querySelectorAll('.question-item');
    
    questionItems.forEach(item => {
        const text = item.querySelector('.question-text').textContent.toLowerCase();
        const category = item.querySelector('.question-meta span:first-child').textContent;
        
        const matchesSearch = text.includes(searchTerm);
        const matchesCategory = !categoryFilter || category.includes(categoryFilter);
        
        if (matchesSearch && matchesCategory) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add question to quiz set
async function addQuestionToQuizSet(questionId) {
    const modal = document.getElementById('addQuestionsModal');
    const quizSetId = modal.dataset.quizSetId;
    
    try {
        const { error } = await supabase
            .from('quiz_set_questions')
            .insert({
                quiz_set_id: quizSetId,
                question_id: questionId,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        showSuccess('Đã thêm câu hỏi vào bộ đề!');
        
        // Remove the question from the list
        const questionItem = document.querySelector(`[onclick="addQuestionToQuizSet('${questionId}')"]`).closest('.question-item');
        if (questionItem) {
            questionItem.style.opacity = '0.5';
            questionItem.querySelector('.btn-add-question').textContent = 'Đã thêm';
            questionItem.querySelector('.btn-add-question').disabled = true;
        }
        
    } catch (error) {
        console.error('Error adding question to quiz set:', error);
        showError('Lỗi khi thêm câu hỏi: ' + error.message);
    }
}

// Toggle new question type
function toggleNewQuestionType() {
    try {

        const typeSelect = document.getElementById('newQuestionType');
        const tfOptions = document.getElementById('newTfOptions');
        const mcqOptions = document.getElementById('newMcqOptions');
        
        if (!typeSelect) {
            console.error('newQuestionType select not found');
            return;
        }
        
        if (!tfOptions) {
            console.error('newTfOptions not found');
            return;
        }
        
        if (!mcqOptions) {
            console.error('newMcqOptions not found');
            return;
        }
        
        const type = typeSelect.value;

        
        if (type === 'tf') {
            tfOptions.style.display = 'block';
            mcqOptions.style.display = 'none';

        } else {
            tfOptions.style.display = 'none';
            mcqOptions.style.display = 'block';

        }
    } catch (error) {
        console.error('Error in toggleNewQuestionType:', error);
    }
}

// Handle new question form submission
async function handleNewQuestion(e) {
    e.preventDefault();
    
    const questionText = document.getElementById('newQuestionText').value;
    const category = document.getElementById('newQuestionCategory').value;
    const questionType = document.getElementById('newQuestionType').value;
    
    if (!questionText.trim()) {
        showError('Vui lòng nhập nội dung câu hỏi');
        return;
    }
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để tạo câu hỏi');
            return;
        }
        
        let correctAnswer;
        let options = null;
        
        if (questionType === 'tf') {
            correctAnswer = document.getElementById('newTfAnswer').value;
        } else {
            const optionA = document.getElementById('newOptionA').value;
            const optionB = document.getElementById('newOptionB').value;
            const optionC = document.getElementById('newOptionC').value;
            const optionD = document.getElementById('newOptionD').value;
            
            if (!optionA || !optionB || !optionC || !optionD) {
                showError('Vui lòng nhập đầy đủ 4 lựa chọn');
                return;
            }
            
            options = [optionA, optionB, optionC, optionD];
            correctAnswer = document.getElementById('newCorrectAnswer').value;
        }
        
        const { data: question, error } = await supabase
            .from('questions')
            .insert({
                text: questionText,
                type: questionType,
                category: category || 'General',
                answer: questionType === 'tf' ? (correctAnswer === 'true') : null,
                options: options,
                correct_index: questionType === 'mcq' ? parseInt(correctAnswer) : null,
                created_by: user.id,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Add to current quiz set
        const modal = document.getElementById('addQuestionsModal');
        const quizSetId = modal?.dataset.quizSetId;
        
        if (quizSetId) {
            // Get current quiz set
            const { data: quizSet, error: getError } = await supabase
                .from('quiz_sets')
                .select('question_ids')
                .eq('id', quizSetId)
                .single();
            
            if (!getError && quizSet) {
                // Add new question to quiz set
                const currentQuestions = quizSet.question_ids || [];
                const newQuestions = [...currentQuestions, question.id];
                
                const { error: updateError } = await supabase
                    .from('quiz_sets')
                    .update({ question_ids: newQuestions })
                    .eq('id', quizSetId);
                
                if (updateError) {
                    console.error('Error adding question to quiz set:', updateError);
                }
            }
        }
        
        showSuccess('Tạo và thêm câu hỏi thành công!');
        
        // Reset form
        document.getElementById('newQuestionForm').reset();
        
        // Switch to existing questions tab and refresh
        switchTab('existing');
        loadExistingQuestions();
        
    } catch (error) {
        console.error('Error creating question:', error);
        showError('Lỗi khi tạo câu hỏi: ' + error.message);
    }
}

// Load home page data
async function loadHomePageData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Show welcome page for non-logged users

            const teacherStats = document.getElementById('teacherStats');
            const classInfo = document.getElementById('classInfo');
            const welcomePage = document.getElementById('welcomePage');
            
            if (teacherStats) teacherStats.style.display = 'none';
            if (classInfo) classInfo.style.display = 'none';
            if (welcomePage) welcomePage.style.display = 'flex';
            return;
        }

        // Get user profile to determine role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'teacher') {
            // Show teacher stats

            const teacherStats = document.getElementById('teacherStats');
            const classInfo = document.getElementById('classInfo');
            const welcomePage = document.getElementById('welcomePage');
            
            if (teacherStats) teacherStats.style.display = 'block';
            if (classInfo) classInfo.style.display = 'none';
            if (welcomePage) welcomePage.style.display = 'none';
            
            await loadTeacherHomeStats();
        } else {
            // Student: if currently in waiting room, show waiting room directly

            try {
                // 1) Prioritize persisted waiting state in localStorage (fast, no RLS)
                let persisted = null;
                try { persisted = JSON.parse(localStorage.getItem('waitingClass') || 'null'); } catch (_) {}
                if (persisted?.classId) {
                    await joinWaitingRoom(persisted.classId, persisted.className || 'Lớp học');
                    return;
                }

                // 2) Fallback: query DB for the latest class the student joined (no join to avoid 400)
                const { data: latestMember } = await supabase
                    .from('class_members')
                    .select('class_id, status')
                    .eq('student_id', user.id)
                    .order('joined_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (latestMember?.class_id && ['waiting','ready'].includes(latestMember.status)) {
                    // Go straight to waiting room only when still waiting/ready
                    try { localStorage.setItem('waitingClass', JSON.stringify({ classId: latestMember.class_id, className: 'Lớp học' })); } catch(_) {}
                    await joinWaitingRoom(latestMember.class_id, 'Lớp học');
                    return;
                }
            } catch (e) {
                console.warn('Could not check waiting room status:', e);
            }

            // Fallback: show student class info section
            const teacherStats = document.getElementById('teacherStats');
            const classInfo = document.getElementById('classInfo');
            const welcomePage = document.getElementById('welcomePage');
            
            if (teacherStats) teacherStats.style.display = 'none';
            if (classInfo) classInfo.style.display = 'block';
            if (welcomePage) welcomePage.style.display = 'none';
            
            await loadClassInfo();
        }

    } catch (error) {
        console.error('Error loading home page data:', error);
        const teacherStats = document.getElementById('teacherStats');
        const classInfo = document.getElementById('classInfo');
        const welcomePage = document.getElementById('welcomePage');
        
        if (teacherStats) teacherStats.style.display = 'none';
        if (classInfo) classInfo.style.display = 'none';
        if (welcomePage) welcomePage.style.display = 'flex';
    }
}

// Load teacher home stats
async function loadTeacherHomeStats() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get total classes
        const { data: classes } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', user.id);

        // Get total students
        const { data: students } = await supabase
            .from('class_members')
            .select('id')
            .in('class_id', classes?.map(c => c.id) || []);

        // Get total questions
        const { data: questions } = await supabase
            .from('questions')
            .select('id')
            .eq('created_by', user.id);

        // Get total quiz sets
        const { data: quizSets } = await supabase
            .from('quiz_sets')
            .select('id')
            .eq('created_by', user.id);

        // Update UI
        const totalClassesEl = document.getElementById('teacherTotalClasses');
        const totalStudentsEl = document.getElementById('teacherTotalStudents');
        const totalQuestionsEl = document.getElementById('teacherTotalQuestions');
        const totalQuizzesEl = document.getElementById('teacherTotalQuizzes');
        
        if (totalClassesEl) totalClassesEl.textContent = classes?.length || 0;
        if (totalStudentsEl) totalStudentsEl.textContent = students?.length || 0;
        if (totalQuestionsEl) totalQuestionsEl.textContent = questions?.length || 0;
        if (totalQuizzesEl) totalQuizzesEl.textContent = quizSets?.length || 0;

    } catch (error) {
        console.error('Error loading teacher home stats:', error);
    }
}

// Copy class code to clipboard
function copyClassCode() {
    const classCodeElement = document.getElementById('shareClassCode');
    if (!classCodeElement) return;
    
    const classCode = classCodeElement.textContent;
    
    // Try to copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(classCode).then(() => {
            showSuccess('Đã sao chép mã lớp vào clipboard!');
        }).catch(() => {
            fallbackCopyTextToClipboard(classCode);
        });
    } else {
        fallbackCopyTextToClipboard(classCode);
    }
}

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showSuccess('Đã sao chép mã lớp vào clipboard!');
        } else {
            showError('Không thể sao chép mã lớp');
        }
    } catch (err) {
        showError('Không thể sao chép mã lớp');
    }
    
    document.body.removeChild(textArea);
}

// Close share class modal
function closeShareClassModal() {
    const modal = document.getElementById('shareClassModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Open class settings modal
async function openClassSettings(classId) {

    
    try {
        // Get class data
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('*')
            .eq('id', classId)
            .single();
        
        if (classError) throw classError;
        
        // Initial load of students in class
        const allStudents = await loadClassStudentsForSettings(classId);
        const activeStudents = (allStudents || []).filter(s => ['waiting','ready'].includes(s.status));
        
        // Fill class info
        document.getElementById('settingsClassName').textContent = classData.name || 'Chưa có tên';
        document.getElementById('settingsClassCode').textContent = classData.class_code || 'N/A';
        document.getElementById('settingsStudentCount').textContent = activeStudents.length || 0;
        
        // Load students list
        loadStudentsList(activeStudents);
        
        // Load available quiz sets for selection
        await loadQuizSetsForSelection(classId);
        
        // Load quiz sets for management display
        await loadQuizSetsForClassSettings(classId);
        
        // Store current class ID for other functions



        window.currentClassId = classId;

        
        // Show modal
        const modal = document.getElementById('classSettingsModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
        
        // Subscribe realtime updates for class members in settings
        subscribeToClassMembersForSettings(classId);
        
    } catch (error) {
        console.error('Error opening class settings:', error);
        showError('Lỗi khi tải thông tin lớp học');
    }
}

// Close class settings modal
function closeClassSettingsModal() {
    const modal = document.getElementById('classSettingsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    // Don't clear currentClassId here as it might be used by students
    // window.currentClassId = null;
    if (classSettingsMembersSubscription) {
        classSettingsMembersSubscription.unsubscribe();
        classSettingsMembersSubscription = null;
    }
}

// Load students list
function loadStudentsList(students) {
    const studentsList = document.getElementById('studentsList');
    if (!studentsList) return;
    
    // Show only students who are actively in class (waiting/ready)
    const visibleStudents = (students || []).filter(s => ['waiting','ready'].includes(s.status));

    if (visibleStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>Chưa có học sinh nào trong lớp</p>
            </div>
        `;
        return;
    }
    
    studentsList.innerHTML = visibleStudents.map(student => {
        const profile = student.profiles;
        const fullName = profile?.full_name || 'Chưa có tên';
        const avatar = profile?.avatar || null;
        
        // Get first letter of name for avatar
        const avatarLetter = fullName.charAt(0).toUpperCase();
        // Treat waiting/ready as online
        const isOnline = ['waiting','ready'].includes(student.status);
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const statusText = isOnline ? 'Online' : 'Offline';
        
        return `
            <div class="student-item">
                <div class="student-avatar">
                    ${avatar ? `<img src="${avatar}" alt="${fullName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="student-avatar-fallback" style="${avatar ? 'display: none;' : 'display: flex;'} background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 100%; height: 100%; border-radius: 50%; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">
                        ${avatarLetter}
                    </div>
                </div>
                <div class="student-info">
                    <p class="student-name">${fullName}</p>
                </div>
                <div class="student-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
    }).join('');
}

// Load students for class settings (teacher view)
async function loadClassStudentsForSettings(classId) {
    try {
        // Prefer OR filter to avoid potential 406 with in()
        let { data, error } = await supabase
            .from('class_members')
            .select(`student_id, class_id, status, last_seen, profiles(full_name, avatar)`) 
            .eq('class_id', classId)
            .or('status.eq.waiting,status.eq.ready');
        if (!error) return data || [];

        // Fallback: fetch waiting and ready separately and merge
        console.warn('OR filter failed, fallback to two queries:', error);
        const [waitingRes, readyRes] = await Promise.all([
            supabase
                .from('class_members')
                .select(`student_id, class_id, status, last_seen, profiles(full_name, avatar)`) 
                .eq('class_id', classId)
                .eq('status', 'waiting'),
            supabase
                .from('class_members')
                .select(`student_id, class_id, status, last_seen, profiles(full_name, avatar)`) 
                .eq('class_id', classId)
                .eq('status', 'ready')
        ]);
        const combined = [...(waitingRes.data || []), ...(readyRes.data || [])];
        return combined;
    } catch (e) {
        console.warn('loadClassStudentsForSettings error:', e);
        return [];
    }
}

// Realtime subscription for class members changes inside class settings modal
function subscribeToClassMembersForSettings(classId) {
    if (classSettingsMembersSubscription) {
        classSettingsMembersSubscription.unsubscribe();
        classSettingsMembersSubscription = null;
    }
    classSettingsMembersSubscription = supabase
        .channel(`settings-class-${classId}-members`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'class_members',
            filter: `class_id=eq.${classId}`
        }, async (payload) => {
            // On delete/insert/update, refresh list and count
            const allStudents = await loadClassStudentsForSettings(classId);
            const activeStudents = (allStudents || []).filter(s => ['waiting','ready'].includes(s.status));
            const countEl = document.getElementById('settingsStudentCount');
            if (countEl) countEl.textContent = activeStudents.length;
            loadStudentsList(activeStudents);
        })
        .subscribe();
}

// Copy class code from settings
function copyClassCodeFromSettings() {
    const classCodeElement = document.getElementById('settingsClassCode');
    if (!classCodeElement) return;
    
    const classCode = classCodeElement.textContent;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(classCode).then(() => {
            showSuccess('Đã sao chép mã lớp vào clipboard!');
        }).catch(() => {
            fallbackCopyTextToClipboard(classCode);
        });
    } else {
        fallbackCopyTextToClipboard(classCode);
    }
}

// Save class settings
async function saveClassSettings() {
    if (!window.currentClassId) return;
    
    const totalTime = document.getElementById('totalTime').value;
    const questionTime = document.getElementById('questionTime').value;
    
    try {
        // Update class settings in database
        const { error } = await supabase
            .from('classes')
            .update({
                total_time: parseInt(totalTime),
                question_time: parseInt(questionTime),
                updated_at: new Date().toISOString()
            })
            .eq('id', window.currentClassId);
        
        if (error) throw error;
        
        showSuccess('Lưu cài đặt thành công!');
        
    } catch (error) {
        console.error('Error saving class settings:', error);
        showError('Lỗi khi lưu cài đặt: ' + error.message);
    }
}

// Start quiz
async function startQuiz() {
    if (!window.currentClassId) return;
    
    try {
        // Update quiz status in database
        const { error } = await supabase
            .from('classes')
            .update({
                quiz_status: 'active',
                quiz_started_at: new Date().toISOString()
            })
            .eq('id', window.currentClassId);
        
        if (error) throw error;
        
        // Update UI
        document.getElementById('startQuizBtn').style.display = 'none';
        document.getElementById('stopQuizBtn').style.display = 'flex';
        document.getElementById('quizStatusText').textContent = 'Đang diễn ra';
        
        showSuccess('Bài thi đã bắt đầu! Học sinh có thể bắt đầu làm bài.');
        
    } catch (error) {
        console.error('Error starting quiz:', error);
        showError('Lỗi khi bắt đầu bài thi: ' + error.message);
    }
}

// Stop quiz
async function stopQuiz() {
    if (!window.currentClassId) return;
    
    try {
        // Update quiz status in database
        const { error } = await supabase
            .from('classes')
            .update({
                quiz_status: 'inactive',
                quiz_ended_at: new Date().toISOString()
            })
            .eq('id', window.currentClassId);
        
        if (error) throw error;
        
        // Update UI
        document.getElementById('startQuizBtn').style.display = 'flex';
        document.getElementById('stopQuizBtn').style.display = 'none';
        document.getElementById('quizStatusText').textContent = 'Đã kết thúc';
        
        showSuccess('Bài thi đã kết thúc!');
        
    } catch (error) {
        console.error('Error stopping quiz:', error);
        showError('Lỗi khi kết thúc bài thi: ' + error.message);
    }
}

// Global variables for realtime subscriptions
let membersSubscription = null;
let quizSubscription = null;
let heartbeatInterval = null;
let quizPollingInterval = null;
let quizCountdownStarted = false;
let membersUpdateTimeout = null;
// Realtime subscription for teacher class settings modal
let classSettingsMembersSubscription = null;

// Join waiting room
async function joinWaitingRoom(classId, className) {

    
    try {
        // Update student status to 'waiting'
        const { error: statusError } = await supabase
            .from('class_members')
            .update({ 
                status: 'waiting', 
                last_seen: new Date().toISOString() 
            })
            .eq('class_id', classId)
            .eq('student_id', currentUser.id);
        
        if (statusError) {
            console.warn('Error updating status:', statusError);
        }
        
        // Store current class info



        window.currentClassId = classId;
        window.currentClassName = className;



        
        // Update waiting room UI
        document.getElementById('waitingClassName').textContent = `Phòng chờ - ${className}`;
        
        // Load initial participants
        await loadWaitingRoomParticipants(classId);
        
        // Subscribe to realtime updates
        subscribeToWaitingRoomUpdates(classId);
        
        // Start heartbeat
        startHeartbeat(classId);
        
        // Reset quiz countdown flag

        quizCountdownStarted = false;
        
        // Start quiz polling as fallback
        startQuizPolling(classId);
        
        // Show waiting room page
        showPage('waiting-room');

        // Persist waiting state locally so reload/home keeps user in room
        try {
            localStorage.setItem('waitingClass', JSON.stringify({
                classId: classId,
                className: className,
                storedAt: Date.now()
            }));
        } catch (_) {}
        
    } catch (error) {
        console.error('Error joining waiting room:', error);
        showError('Lỗi khi vào phòng chờ: ' + error.message);
    }
}

// Load waiting room participants
async function loadWaitingRoomParticipants(classId) {
    try {
        // First get class members
        const { data: members, error: membersError } = await supabase
            .from('class_members')
            .select('*')
            .eq('class_id', classId)
            .in('status', ['waiting', 'ready']);
        
        if (membersError) throw membersError;
        
        if (!members || members.length === 0) {
            renderWaitingRoomParticipants([]);
            return;
        }
        
        // Then get profiles separately to avoid RLS issues
        const studentIds = members.map(m => m.student_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar')
            .in('id', studentIds);
        
        if (profilesError) throw profilesError;
        
        // Merge data
        const participants = members.map(member => {
            const profile = profiles?.find(p => p.id === member.student_id);
            return {
                ...member,
                profiles: profile || { full_name: 'Chưa có tên', email: '', avatar: null }
            };
        });
        
        renderWaitingRoomParticipants(participants);
        
    } catch (error) {
        console.error('Error loading participants:', error);
    }
}

// Render waiting room participants
function renderWaitingRoomParticipants(participants) {
    const participantsList = document.getElementById('participantsList');
    const participantCount = document.getElementById('participantCount');
    
    if (!participantsList || !participantCount) return;
    
    participantCount.textContent = participants.length;
    
    if (participants.length === 0) {
        participantsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>Chưa có học sinh nào trong phòng chờ</p>
            </div>
        `;
        return;
    }
    
    participantsList.innerHTML = participants.map(participant => {
        const profile = participant.profiles;
        const fullName = profile?.full_name || 'Chưa có tên';
        const avatar = profile?.avatar || null;
        
        // Get first letter of name for avatar
        const avatarLetter = fullName.charAt(0).toUpperCase();
        
        // Check if online (last seen within 30 seconds)
        const lastSeen = new Date(participant.last_seen);
        const now = new Date();
        const isOnline = (now - lastSeen) < 30000; // 30 seconds
        // Ensure currentUser is set
        let isMe = false;
        try { isMe = !!currentUser && participant.student_id === currentUser.id; } catch (_) {}
        
        return `
            <div class="participant-card ${isOnline ? 'online' : 'offline'} ${isMe ? 'me' : ''}">
                <div class="participant-avatar">
                    ${avatar ? `<img src="${avatar}" alt="${fullName}">` : avatarLetter}
                    <div class="participant-status ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="participant-name">${fullName}</div>
            </div>
        `;
    }).join('');
}

// Subscribe to waiting room realtime updates
function subscribeToWaitingRoomUpdates(classId) {

    
    // Subscribe to class members changes
    membersSubscription = supabase
        .channel(`class-${classId}-members`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'class_members',
            filter: `class_id=eq.${classId}`
        }, (payload) => {

            
            // Debounce members update to avoid too many calls
            if (membersUpdateTimeout) {
                clearTimeout(membersUpdateTimeout);
            }
            
            membersUpdateTimeout = setTimeout(() => {
                loadWaitingRoomParticipants(classId);
            }, 500); // Wait 500ms before updating
        })
        .subscribe((status) => {

        });
    
    // Subscribe to quiz session changes
    quizSubscription = supabase
        .channel(`class-${classId}-quiz`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'active_quiz_sessions',
            filter: `class_id=eq.${classId}`
        }, (payload) => {

            handleQuizSessionUpdate(payload);
        })
        .on('broadcast', { event: 'quiz_started' }, (payload) => {

            handleQuizStartBroadcast(payload);
        })
        .subscribe((status) => {

        });
    

}

// Start quiz polling as fallback
function startQuizPolling(classId) {


    
    quizPollingInterval = setInterval(async () => {
        try {
            const { data: session, error } = await supabase
                .from('active_quiz_sessions')
                .select('*')
                .eq('class_id', classId)
                .eq('status', 'active')
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Quiz polling error:', error);
                return;
            }
            

            
            if (session && !quizCountdownStarted) {



                
                // Normalize class IDs for comparison
                const sessionClassId = String(session.class_id || '').trim();
                const currentClassId = String(window.currentClassId || '').trim();
                




                
                // Check if class IDs match
                if (sessionClassId === currentClassId) {
                    quizCountdownStarted = true;

                    
                    // Add fallback timeout to force page change if something fails
                    setTimeout(() => {

                        if (document.getElementById('waiting-room-page').style.display !== 'none') {

                            showPage('quiz-active');
                            startStudentQuiz();
                        }
                    }, 2000); // 2 second fallback
                    
                    // Stop polling
                    if (quizPollingInterval) {
                        clearInterval(quizPollingInterval);
                        quizPollingInterval = null;

                    }
                    
                    // Show countdown and start quiz
                    console.log('About to start quiz directly (no countdown)');
                    showPage('quiz-active');
                    setTimeout(() => {
                        startStudentQuiz();
                    }, 500); // Small delay to ensure page is rendered
                } else {






                    
                    // Fallback: if class IDs are very similar, allow quiz start anyway
                    if (sessionClassId.length > 10 && currentClassId.length > 10) {
                        const sessionPrefix = sessionClassId.substring(0, 10);
                        const currentPrefix = currentClassId.substring(0, 10);
                        if (sessionPrefix === currentPrefix) {

                            quizCountdownStarted = true;
                            
                            // Force quiz start even if full comparison failed
                            setTimeout(() => {

                                showPage('quiz-active');
                                startStudentQuiz();
                            }, 1000);
                        }
                    }
                }
            } else if (!session && quizCountdownStarted) {
                // Quiz session ended, reset flag and stop polling

                quizCountdownStarted = false;
                
                // Stop polling since quiz ended
                if (quizPollingInterval) {
                    clearInterval(quizPollingInterval);
                    quizPollingInterval = null;
                }
            }
        } catch (error) {
            console.error('Quiz polling error:', error);
        }
    }, 2000); // Check every 2 seconds
}

// Handle quiz session updates
function handleQuizSessionUpdate(payload) {

    
    if (payload.new && payload.new.status === 'active' && !quizCountdownStarted) {

        quizCountdownStarted = true;
        
        // Teacher started quiz - show quiz info and redirect
        showQuizInfo(payload.new);
        
        // Show countdown and redirect to quiz
        // showQuizCountdown(); // Disabled - using polling mechanism instead
    } else if (payload.new && payload.new.status === 'completed') {

        // Quiz ended - return to waiting room
        showPage('waiting-room');
    }
}

// Handle quiz start broadcast
function handleQuizStartBroadcast(payload) {

    
    // Extract the actual payload data
    const data = payload.payload || payload;

    
    // Check if this is for the current class



    
    // Trim and normalize class IDs for comparison
    const broadcastClassId = String(data.class_id || '').trim();
    const currentClassId = String(window.currentClassId || '').trim();
    


    
    if (broadcastClassId === currentClassId && !quizCountdownStarted) {

        quizCountdownStarted = true;
        
        // Show quiz info
        showQuizInfo({
            quiz_set_id: data.quiz_set_id,
            total_time_limit: data.total_time_limit,
            time_per_question: data.time_per_question,
            question_count: data.question_count,
            started_at: data.started_at
        });
        
        // Show countdown and redirect to quiz
        // showQuizCountdown(); // Disabled - using polling mechanism instead
    } else {



    }
}

// Show quiz info and countdown
function showQuizInfo(session) {
    // This will be called when quiz starts

}

// Show countdown before starting quiz
function showQuizCountdown() {
    console.log('showQuizCountdown() called - redirecting to quiz page');
    showPage('quiz-active');
    startStudentQuiz();
}

// Show quiz info in waiting room
async function showQuizInfo(quizSession) {
    try {
        // Get quiz set details
        const { data: quizSet, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('id', quizSession.quiz_set_id)
            .single();
        
        if (error) throw error;
        
        // Update UI
        document.getElementById('quizSetDisplayName').textContent = quizSet.title || 'Bộ đề';
        document.getElementById('quizSetDisplayDescription').textContent = quizSet.description || 'Không có mô tả';
        document.getElementById('questionCount').textContent = quizSession.question_count || quizSet.question_ids?.length || 0;
        document.getElementById('timeLimit').textContent = Math.floor((quizSession.total_time_limit || quizSet.total_time_limit || 3600) / 60);
        
        // Show quiz info section
        document.getElementById('quizInfoSection').style.display = 'block';
        
        // Update status
        document.getElementById('waitingStatus').textContent = 'Giáo viên đã chọn bộ đề! Chuẩn bị bắt đầu...';
        
    } catch (error) {
        console.error('Error loading quiz info:', error);
    }
}

// Show quiz countdown
function showQuizCountdown() {
    let countdown = 3;
    const statusElement = document.getElementById('waitingStatus');
    
    const countdownInterval = setInterval(() => {
        statusElement.textContent = `Bắt đầu trong ${countdown}...`;
        countdown--;
        
        if (countdown < 0) {
            clearInterval(countdownInterval);
            statusElement.textContent = 'Đang chuyển đến bài thi...';
            
            // Redirect to quiz page (you can implement this later)
            setTimeout(() => {
                showSuccess('Chuyển đến trang làm bài!');
                // showPage('quiz'); // Implement quiz page later
            }, 1000);
        }
    }, 1000);
}

// Start heartbeat for student presence
function startHeartbeat(classId) {
    heartbeatInterval = setInterval(async () => {
        try {
            await supabase
                .from('class_members')
                .update({ 
                    last_seen: new Date().toISOString(),
                    status: 'waiting'
                })
                .eq('class_id', classId)
                .eq('student_id', currentUser.id);
        } catch (error) {
            console.warn('Heartbeat error:', error);
        }
    }, 5000); // Update every 5 seconds
}

// Stop heartbeat
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

// Leave waiting room
async function leaveWaitingRoom() {
    if (!window.currentClassId) return;
    
    try {
        // Try to remove membership completely
        const { error: deleteErr } = await supabase
            .from('class_members')
            .delete()
            .eq('class_id', window.currentClassId)
            .eq('student_id', currentUser.id);

        if (deleteErr) {
            // Fallback: mark as left if delete blocked by policy/constraint
            await supabase
                .from('class_members')
                .update({ 
                    status: 'left',
                    last_seen: new Date().toISOString()
                })
                .eq('class_id', window.currentClassId)
                .eq('student_id', currentUser.id);
        }
        
        // Unsubscribe from realtime updates
        if (membersSubscription) {
            membersSubscription.unsubscribe();
            membersSubscription = null;
        }
        
        if (quizSubscription) {
            quizSubscription.unsubscribe();
            quizSubscription = null;
        }
        
        // Stop heartbeat
        stopHeartbeat();
        
        // Stop quiz polling
        if (quizPollingInterval) {
            clearInterval(quizPollingInterval);
            quizPollingInterval = null;
        }
        
        // Reset quiz countdown flag

        quizCountdownStarted = false;
        
        // Clear members update timeout
        if (membersUpdateTimeout) {
            clearTimeout(membersUpdateTimeout);
            membersUpdateTimeout = null;
        }
        
        // Clear class info



        window.currentClassId = null;
        window.currentClassName = null;


        // Clear persisted waiting state
        try { localStorage.removeItem('waitingClass'); } catch (_) {}
        
        // Go back to Home page
        showPage('home');
        
    } catch (error) {
        console.error('Error leaving waiting room:', error);
        showError('Lỗi khi rời khỏi lớp: ' + error.message);
    }
}

// Load quiz sets for teacher selection
async function loadQuizSetsForSelection(classId) {
    try {
        const { data: quizSets, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const selectElement = document.getElementById('selectedQuizSet');
        if (!selectElement) return;
        
        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">-- Chọn bộ đề --</option>';
        
        // Add quiz sets to select
        quizSets.forEach(quizSet => {
            const option = document.createElement('option');
            option.value = quizSet.id;
            option.textContent = quizSet.title || 'Bộ đề không tên';
            selectElement.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading quiz sets for selection:', error);
    }
}

// Load quiz sets for class settings display
async function loadQuizSetsForClassSettings(classId) {
    try {
        const { data: quizSets, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const quizSetsList = document.getElementById('classSettingsQuizSetsList');
        if (!quizSetsList) return;
        
        if (quizSets.length === 0) {
            quizSetsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Chưa có bộ đề nào</p>
                </div>
            `;
            return;
        }
        
        quizSetsList.innerHTML = quizSets.map(quizSet => {
            const questionCount = quizSet.question_ids ? quizSet.question_ids.length : 0;
            const createdDate = new Date(quizSet.created_at).toLocaleDateString('vi-VN');
            const questionMode = quizSet.question_mode || 'manual';
            const isRandom = questionMode === 'random';
            const randomCount = quizSet.random_count;
            
            return `
                <div class="quiz-set-card modern-card" data-quiz-set-id="${quizSet.id}">
                    <div class="card-header">
                        <div class="card-title-section">
                            <h4 class="card-title">${quizSet.title || 'Bộ đề không tên'}</h4>
                            <div class="card-status ${questionCount > 0 ? 'active' : 'inactive'}">
                                <div class="status-dot"></div>
                                <span>${questionCount > 0 ? 'Hoạt động' : 'Chưa có câu hỏi'}</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="action-btn edit" onclick="editQuizSet('${quizSet.id}')" title="Chỉnh sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteQuizSet('${quizSet.id}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <p class="card-description">${quizSet.description || 'Không có mô tả'}</p>
                        
                        <div class="card-stats">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-question-circle"></i>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-number">${questionCount}</span>
                                    <span class="stat-label">Câu hỏi</span>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-number">${createdDate}</span>
                                    <span class="stat-label">Ngày tạo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <button class="btn-card-primary" onclick="editQuizSetQuestions('${quizSet.id}', '${classId}')">
                            <i class="fas fa-cog"></i>
                            <span>Quản lý câu hỏi</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading quiz sets for class settings:', error);
    }
}

// Edit quiz set time configuration
async function editQuizSetTime(quizSetId) {
    try {
        const { data: quizSet, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('id', quizSetId)
            .single();
        
        if (error) throw error;
        
        const totalTimeMinutes = Math.floor((quizSet.total_time_limit || 1800) / 60);
        const timePerQuestion = quizSet.time_per_question || 120;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-clock"></i> Cài đặt thời gian cho bộ đề</h3>
                    <button class="modal-close" onclick="closeEditTimeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="time-settings-grid">
                        <div class="time-setting-item">
                            <label class="time-label">
                                <i class="fas fa-clock"></i>
                                Thời gian làm bài tổng (phút)
                            </label>
                            <input type="number" id="editTotalTimeInput" min="1" max="180" value="${totalTimeMinutes}" class="time-input">
                            <p class="time-description">Thời gian tối đa để hoàn thành toàn bộ bài thi</p>
                        </div>
                        <div class="time-setting-item">
                            <label class="time-label">
                                <i class="fas fa-hourglass-half"></i>
                                Thời gian mỗi câu hỏi (giây)
                            </label>
                            <input type="number" id="editPerQuestionTimeInput" min="10" max="600" value="${timePerQuestion}" class="time-input">
                            <p class="time-description">Thời gian tối đa cho mỗi câu hỏi riêng lẻ</p>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeEditTimeModal()">Hủy</button>
                        <button type="button" class="btn-primary" onclick="saveQuizSetTime('${quizSetId}')">
                            <i class="fas fa-save"></i> Lưu cài đặt
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
    } catch (error) {
        console.error('Error loading quiz set time:', error);
        showError('Lỗi khi tải thông tin bộ đề: ' + error.message);
    }
}

// Close edit time modal
function closeEditTimeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

// Save quiz set time settings
async function saveQuizSetTime(quizSetId) {
    const totalTime = parseInt(document.getElementById('editTotalTimeInput').value);
    const perQuestionTime = parseInt(document.getElementById('editPerQuestionTimeInput').value);
    
    if (isNaN(totalTime) || isNaN(perQuestionTime) || totalTime < 1 || perQuestionTime < 10) {
        showError('Vui lòng nhập thời gian hợp lệ');
        return;
    }
    
    try {
        const totalTimeSeconds = totalTime * 60;
        
        const { error } = await supabase
            .from('quiz_sets')
            .update({
                total_time_limit: totalTimeSeconds,
                time_per_question: perQuestionTime
            })
            .eq('id', quizSetId);
        
        if (error) throw error;
        
        showSuccess('Đã cập nhật thời gian bộ đề');
        closeEditTimeModal();
        loadQuizSetsForClassSettings(window.currentClassId);
        
    } catch (error) {
        console.error('Error updating quiz set time:', error);
        showError('Lỗi khi cập nhật thời gian: ' + error.message);
    }
}

// Edit quiz set questions
function editQuizSetQuestions(quizSetId, classId) {
    showAddQuestionsModal(quizSetId, classId, true);
}

// Edit quiz set information
async function editQuizSet(quizSetId) {
    try {
        const { data: quizSet, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('id', quizSetId)
            .single();
        
        if (error) throw error;
        
        const newTitle = prompt('Nhập tên mới cho bộ đề:', quizSet.title || '');
        if (newTitle === null) return;
        
        const newDescription = prompt('Nhập mô tả mới cho bộ đề:', quizSet.description || '');
        if (newDescription === null) return;
        
        const { error: updateError } = await supabase
            .from('quiz_sets')
            .update({
                title: newTitle.trim(),
                description: newDescription.trim()
            })
            .eq('id', quizSetId);
        
        if (updateError) throw updateError;
        
        showSuccess('Đã cập nhật thông tin bộ đề');
        loadQuizSetsForClassSettings(window.currentClassId);
        
    } catch (error) {
        console.error('Error updating quiz set:', error);
        showError('Lỗi khi cập nhật bộ đề: ' + error.message);
    }
}

// Delete quiz set
async function deleteQuizSet(quizSetId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ đề này? Hành động này không thể hoàn tác.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('quiz_sets')
            .delete()
            .eq('id', quizSetId);
        
        if (error) throw error;
        
        showSuccess('Đã xóa bộ đề thành công');
        loadQuizSetsForClassSettings(window.currentClassId);
        
    } catch (error) {
        console.error('Error deleting quiz set:', error);
        showError('Lỗi khi xóa bộ đề: ' + error.message);
    }
}

// Load current quiz set questions for editing
async function loadCurrentQuizSetQuestions(quizSetId) {
    try {
        const { data: quizSet, error } = await supabase
            .from('quiz_sets')
            .select('question_ids')
            .eq('id', quizSetId)
            .single();
        
        if (error) throw error;
        
        if (!quizSet.question_ids || quizSet.question_ids.length === 0) {

            // Clear all checkboxes
            const questionCheckboxes = document.querySelectorAll('#questionsList input[type="checkbox"]');
            questionCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.closest('.question-item')?.classList.remove('selected');
            });
            return;
        }
        
        // Mark current questions as selected
        const questionCheckboxes = document.querySelectorAll('#questionsList input[type="checkbox"]');



        
        let markedCount = 0;
        questionCheckboxes.forEach(checkbox => {
            const questionId = checkbox.value;
            if (quizSet.question_ids.includes(questionId)) {
                checkbox.checked = true;
                checkbox.closest('.question-item')?.classList.add('selected');
                markedCount++;

            } else {
                checkbox.checked = false;
                checkbox.closest('.question-item')?.classList.remove('selected');
            }
        });
        

        
    } catch (error) {
        console.error('Error loading current quiz set questions:', error);
    }
}

// Load categories for random tab
async function loadCategoriesForRandom() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: questions, error } = await supabase
            .from('questions')
            .select('category')
            .eq('created_by', user.id)
            .not('category', 'is', null);
        
        if (error) throw error;
        
        const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
        const categorySelect = document.getElementById('randomCategory');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Tất cả chủ đề</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading categories for random:', error);
    }
}

// Preview random questions
async function previewRandomQuestions() {
    const count = parseInt(document.getElementById('randomCount').value);
    const category = document.getElementById('randomCategory').value;
    
    if (isNaN(count) || count < 1) {
        showError('Vui lòng nhập số câu hỏi hợp lệ');
        return;
    }
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để xem trước câu hỏi');
            return;
        }
        
        let query = supabase
            .from('questions')
            .select('id, question_text, question_type, category')
            .eq('created_by', user.id);
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data: questions, error } = await query;
        
        if (error) throw error;
        
        if (!questions || questions.length === 0) {
            showError('Không có câu hỏi nào để chọn ngẫu nhiên');
            return;
        }
        
        if (questions.length < count) {
            showError(`Chỉ có ${questions.length} câu hỏi, không đủ để chọn ${count} câu`);
            return;
        }
        
        // Shuffle and pick random questions
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, count);
        
        // Display preview
        const previewContainer = document.getElementById('previewQuestions');
        const previewSection = document.getElementById('randomPreview');
        
        previewContainer.innerHTML = selectedQuestions.map((q, index) => `
            <div class="preview-question-item">
                <div class="question-text">${index + 1}. ${q.question_text}</div>
                <div class="question-meta">
                    <span>${q.question_type === 'tf' ? 'Đúng/Sai' : '4 lựa chọn'}</span>
                    <span>${q.category || 'Không có chủ đề'}</span>
                </div>
            </div>
        `).join('');
        
        previewSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error previewing random questions:', error);
        showError('Lỗi khi xem trước câu hỏi: ' + error.message);
    }
}

// Add random questions to quiz set
async function addRandomQuestions() {
    const modal = document.getElementById('addQuestionsModal');
    const quizSetId = modal?.dataset.quizSetId;
    const isEditMode = modal?.dataset.isEditMode === 'true';
    
    if (!quizSetId) {
        showError('Không tìm thấy thông tin bộ đề');
        return;
    }
    
    const count = parseInt(document.getElementById('randomCount').value);
    const category = document.getElementById('randomCategory').value;
    
    if (isNaN(count) || count < 1) {
        showError('Vui lòng nhập số câu hỏi hợp lệ');
        return;
    }
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError('Bạn cần đăng nhập để thêm câu hỏi');
            return;
        }
        
        let query = supabase
            .from('questions')
            .select('id')
            .eq('created_by', user.id);
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data: questions, error } = await query;
        
        if (error) throw error;
        
        if (!questions || questions.length === 0) {
            showError('Không có câu hỏi nào để chọn ngẫu nhiên');
            return;
        }
        
        if (questions.length < count) {
            showError(`Chỉ có ${questions.length} câu hỏi, không đủ để chọn ${count} câu`);
            return;
        }
        
        // Shuffle and pick random questions
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        const selectedQuestionIds = shuffled.slice(0, count).map(q => q.id);
        
        let finalQuestions;
        
        if (isEditMode) {
            // In edit mode, replace all questions with selected ones
            finalQuestions = selectedQuestionIds;
        } else {
            // In add mode, merge with existing questions
            const { data: quizSet, error: getError } = await supabase
                .from('quiz_sets')
                .select('question_ids')
                .eq('id', quizSetId)
                .single();
            
            if (getError) throw getError;
            
            const currentQuestions = quizSet.question_ids || [];
            finalQuestions = [...new Set([...currentQuestions, ...selectedQuestionIds])];
        }
        
        // Update quiz set
        const { error: updateError } = await supabase
            .from('quiz_sets')
            .update({ question_ids: finalQuestions })
            .eq('id', quizSetId);
        
        if (updateError) throw updateError;
        
        const actionText = isEditMode ? 'cập nhật' : 'thêm';
        showSuccess(`Đã ${actionText} ${selectedQuestionIds.length} câu hỏi ngẫu nhiên vào bộ đề`);
        closeAddQuestionsModal();
        loadQuizSetsForClassSettings(window.currentClassId);
        
    } catch (error) {
        console.error('Error adding random questions:', error);
        showError('Lỗi khi thêm câu hỏi ngẫu nhiên: ' + error.message);
    }
}

// Show time settings modal
function showTimeSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-clock"></i> Cài đặt thời gian</h3>
                <button class="modal-close" onclick="closeTimeSettingsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="time-settings-grid">
                    <div class="time-setting-item">
                        <label class="time-label">
                            <i class="fas fa-clock"></i>
                            Thời gian làm bài tổng (phút)
                        </label>
                        <input type="number" id="totalTimeInput" min="1" max="180" value="60" class="time-input">
                        <p class="time-description">Thời gian tối đa để hoàn thành toàn bộ bài thi</p>
                    </div>
                    <div class="time-setting-item">
                        <label class="time-label">
                            <i class="fas fa-hourglass-half"></i>
                            Thời gian mỗi câu hỏi (giây)
                        </label>
                        <input type="number" id="perQuestionTimeInput" min="10" max="600" value="30" class="time-input">
                        <p class="time-description">Thời gian tối đa cho mỗi câu hỏi riêng lẻ</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeTimeSettingsModal()">Hủy</button>
                    <button type="button" class="btn-primary" onclick="saveTimeSettings()">
                        <i class="fas fa-save"></i> Lưu cài đặt
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Close time settings modal
function closeTimeSettingsModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

// Save time settings
function saveTimeSettings() {
    const totalTime = parseInt(document.getElementById('totalTimeInput').value);
    const perQuestionTime = parseInt(document.getElementById('perQuestionTimeInput').value);
    
    if (isNaN(totalTime) || isNaN(perQuestionTime) || totalTime < 1 || perQuestionTime < 10) {
        showError('Vui lòng nhập thời gian hợp lệ');
        return;
    }
    
    // Update the form inputs in quiz selection
    document.getElementById('totalTimeMinutes').value = totalTime;
    document.getElementById('timePerQuestionSeconds').value = perQuestionTime;
    
    showSuccess('Đã cập nhật cài đặt thời gian');
    closeTimeSettingsModal();
}

// Handle quiz set selection
async function onQuizSetSelected() {
    const quizSetId = document.getElementById('selectedQuizSet').value;
    const quizSetInfo = document.getElementById('quizSetInfo');
    const startBtn = document.getElementById('startQuizBtn');
    
    if (!quizSetId) {
        quizSetInfo.style.display = 'none';
        startBtn.disabled = true;
        return;
    }
    
    try {
        // Load quiz set data from database
        const { data: quizSet, error } = await supabase
            .from('quiz_sets')
            .select('*')
            .eq('id', quizSetId)
            .single();
        
        if (error) throw error;
        
        // Update form fields with real data
        const questionCount = quizSet.question_ids?.length || 0;
        const totalTimeMinutes = Math.floor((quizSet.total_time_limit || 1800) / 60);
        const timePerQuestion = quizSet.time_per_question || 120;
        
        document.getElementById('selectedQuestionCount').textContent = questionCount;
        document.getElementById('totalTimeMinutes').value = totalTimeMinutes;
        document.getElementById('timePerQuestionSeconds').value = timePerQuestion;
        
        // Show info and enable start button
        quizSetInfo.style.display = 'block';
        startBtn.disabled = false;
        

        
    } catch (error) {
        console.error('Error loading quiz set:', error);
        showError('Lỗi khi tải thông tin bộ đề');
    }
}

// Start quiz with selected quiz set
async function startQuizWithSet() {
    const quizSetId = document.getElementById('selectedQuizSet').value;
    if (!quizSetId) {
        showError('Vui lòng chọn bộ đề');
        return;
    }
    
    if (!window.currentClassId) {
        showError('Không tìm thấy thông tin lớp học');
        return;
    }
    
    try {
        // Get quiz set to validate it has questions
        const { data: quizSet, error: quizSetError } = await supabase
            .from('quiz_sets')
            .select('question_ids, total_time_limit, time_per_question')
            .eq('id', quizSetId)
            .single();
        
        if (quizSetError) throw quizSetError;
        
        if (!quizSet.question_ids || quizSet.question_ids.length === 0) {
            showError('Bộ đề này chưa có câu hỏi nào. Vui lòng thêm câu hỏi trước khi bắt đầu.');
            return;
        }
        
        // Get time settings from form (these are set by the time settings modal)
        const totalTimeMinutes = parseInt(document.getElementById('totalTimeMinutes').value) || 60;
        const timePerQuestionSeconds = parseInt(document.getElementById('timePerQuestionSeconds').value) || 30;
        

        
        // First, delete any existing active quiz session for this class

        const { error: deleteError } = await supabase
            .from('active_quiz_sessions')
            .delete()
            .eq('class_id', window.currentClassId);
        
        if (deleteError) {
            console.warn('Error deleting existing sessions:', deleteError);
        } else {

        }
        
        // Wait a moment to ensure delete operation completes
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create new active quiz session

        const { error } = await supabase
            .from('active_quiz_sessions')
            .insert({
                class_id: window.currentClassId,
                quiz_set_id: quizSetId,
                status: 'active',
                started_at: new Date().toISOString(),
                total_time_limit: totalTimeMinutes * 60,
                time_per_question: timePerQuestionSeconds,
                question_count: quizSet.question_ids.length
            });
        
        if (error) {
            console.error('Error creating quiz session:', error);
            throw error;
        }
        

        
        // Update UI
        document.getElementById('startQuizBtn').style.display = 'none';
        document.getElementById('stopQuizBtn').style.display = 'flex';
        document.getElementById('quizStatusText').textContent = 'Đang diễn ra';
        
        // Broadcast quiz start to all students via realtime

        const channel = supabase.channel(`class-${window.currentClassId}-quiz`);
        
        const { error: broadcastError } = await channel.send({
            type: 'broadcast',
            event: 'quiz_started',
            payload: {
                class_id: window.currentClassId,
                quiz_set_id: quizSetId,
                total_time_limit: totalTimeMinutes * 60,
                time_per_question: timePerQuestionSeconds,
                question_count: quizSet.question_ids.length,
                started_at: new Date().toISOString()
            }
        });
        
        if (broadcastError) {
            console.error('Broadcast error:', broadcastError);
        } else {

        }
        
        showSuccess('Đã bắt đầu bài thi! Học sinh đang được chuyển vào làm bài.');
        
    } catch (error) {
        console.error('Error starting quiz with set:', error);
        showError('Lỗi khi bắt đầu bài thi: ' + error.message);
    }
}

// Stop quiz
async function stopQuiz() {
    if (!window.currentClassId) {
        showError('Không tìm thấy thông tin lớp học');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('active_quiz_sessions')
            .update({ status: 'completed' })
            .eq('class_id', window.currentClassId);
        
        if (error) throw error;
        
        // Update UI
        document.getElementById('startQuizBtn').style.display = 'flex';
        document.getElementById('stopQuizBtn').style.display = 'none';
        document.getElementById('quizStatusText').textContent = 'Đã dừng';
        
        showSuccess('Đã dừng bài thi!');
        
    } catch (error) {
        console.error('Error stopping quiz:', error);
        showError('Lỗi khi dừng bài thi: ' + error.message);
    }
}

// Student Quiz Functions
let currentQuizSession = null;
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = [];
let quizTimers = { total: null, question: null };

// Start student quiz
async function startStudentQuiz() {
    console.log('startStudentQuiz() function called');
    try {
        // Get current active quiz session
        const { data: session, error: sessionError } = await supabase
            .from('active_quiz_sessions')
            .select(`
                *,
                quiz_sets!inner(*)
            `)
            .eq('status', 'active')
            .single();
        
        if (sessionError || !session) {
            showError('Không tìm thấy bài thi đang hoạt động');
            return;
        }
        
        currentQuizSession = session;
        
        // Load questions
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .in('id', session.quiz_sets.question_ids);
        
        if (questionsError) throw questionsError;
        
        currentQuizQuestions = questions || [];
        currentQuestionIndex = 0;
        studentAnswers = new Array(currentQuizQuestions.length).fill(null);
        
        // Show quiz page

        showPage('quiz-active');

        
        // Start timers
        startQuizTimers();
        
        // Reset audio settings to OFF for quiz
        resetAudioSettingsForQuiz();
        
        // Show first question
        showQuestion(0);
        
    } catch (error) {
        console.error('Error starting student quiz:', error);
        showError('Lỗi khi bắt đầu bài thi: ' + error.message);
    }
}

// Start quiz timers
function startQuizTimers() {
    if (!currentQuizSession) return;
    
    const totalTime = currentQuizSession.total_time_limit || 1800; // 30 minutes default
    const timePerQuestion = currentQuizSession.time_per_question || 120; // 2 minutes default
    
    // Total time countdown
    let totalSeconds = totalTime;
    quizTimers.total = setInterval(() => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        document.getElementById('totalTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (totalSeconds <= 0) {
            finishQuiz();
            return;
        }
        
        totalSeconds--;
        
        // Warning when time is low
        if (totalSeconds <= 60) {
            document.getElementById('totalTimer').classList.add('warning');
        }
    }, 1000);
    
    // Per-question timer
    startQuestionTimer(timePerQuestion);
}

// Start question timer
function startQuestionTimer(seconds) {
    if (quizTimers.question) {
        clearInterval(quizTimers.question);
    }
    
    let questionSeconds = seconds;
    quizTimers.question = setInterval(() => {
        const minutes = Math.floor(questionSeconds / 60);
        const secs = questionSeconds % 60;
        document.getElementById('questionTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (questionSeconds <= 0) {
            // Auto-advance to next question
            nextQuestion();
            return;
        }
        
        questionSeconds--;
        
        // Warning when time is low
        if (questionSeconds <= 10) {
            document.getElementById('questionTimer').classList.add('warning');
        }
    }, 1000);
}

// Show question
function showQuestion(index) {
    if (index >= currentQuizQuestions.length) {
        finishQuiz();
        return;
    }
    
    const question = currentQuizQuestions[index];
    const isLastQuestion = index === currentQuizQuestions.length - 1;
    
    // Update progress
    document.getElementById('questionProgress').textContent = `Câu ${index + 1}/${currentQuizQuestions.length}`;
    document.getElementById('progressFill').style.width = `${((index + 1) / currentQuizQuestions.length) * 100}%`;
    
    // Show question text
    document.getElementById('questionText').textContent = question.text;
    
    // Show options with new grid layout
    const optionsContainer = document.getElementById('questionOptions');
    if (question.type === 'tf') {
        optionsContainer.innerHTML = `
            <div class="option-grid">
                <div class="option-square" onclick="selectAnswer(${index}, true)">
                    <div class="option-content">
                        <div class="option-letter">Đ</div>
                        <div class="option-text">Đúng</div>
                    </div>
                </div>
                <div class="option-square" onclick="selectAnswer(${index}, false)">
                    <div class="option-content">
                        <div class="option-letter">S</div>
                        <div class="option-text">Sai</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        optionsContainer.innerHTML = `
            <div class="option-grid">
                ${question.options.map((option, optionIndex) => `
                    <div class="option-square" onclick="selectAnswer(${index}, ${optionIndex})">
                        <div class="option-content">
                            <div class="option-letter">${String.fromCharCode(65 + optionIndex)}</div>
                            <div class="option-text">${option}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Update buttons
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitQuizBtn');
    
    if (isLastQuestion) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'flex';
    } else {
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
    
    // Reset question timer
    const timePerQuestion = currentQuizSession.time_per_question || 120;
    startQuestionTimer(timePerQuestion);
    
    // Show current answer if already answered
    if (studentAnswers[index] !== null) {
        const selectedOption = optionsContainer.querySelector(`input[value="${studentAnswers[index]}"]`);
        if (selectedOption) {
            selectedOption.checked = true;
            selectedOption.closest('.option-item').classList.add('selected');
        }
    }
}

// Select answer
function selectAnswer(questionIndex, answer) {
    studentAnswers[questionIndex] = answer;
    
    // Get current question to check if answer is correct
    const currentQuestion = currentQuizQuestions[questionIndex];
    let isCorrect = false;
    
    if (currentQuestion.type === 'tf') {
        isCorrect = (answer === currentQuestion.answer);
    } else {
        isCorrect = (answer == currentQuestion.correct_index);
    }
    
    // Update UI with visual feedback for new grid layout
    const optionSquares = document.querySelectorAll('.option-square');
    optionSquares.forEach((square, index) => {
        square.classList.remove('selected', 'correct', 'incorrect');
        
        // Check if this is the selected option
        let isSelected = false;
        if (currentQuestion.type === 'tf') {
            isSelected = (index === 0 && answer === true) || (index === 1 && answer === false);
        } else {
            isSelected = (index === answer);
        }
        
        if (isSelected) {
            square.classList.add('selected');
            
            // Add visual feedback based on correctness
            if (isCorrect) {
                square.classList.add('correct');
                // Play correct sound
                playCorrectSound();
            } else {
                square.classList.add('incorrect');
                // Play incorrect sound
                playIncorrectSound();
            }
        }
    });
    
    // Auto-advance to next question after 1.5 seconds
    setTimeout(() => {
        if (currentQuestionIndex < currentQuizQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        } else {
            finishQuiz();
        }
    }, 1500);
}

// Next question
function nextQuestion() {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    } else {
        finishQuiz();
    }
}

// Finish quiz
async function finishQuiz() {
    try {
        // Clear timers
        if (quizTimers.total) clearInterval(quizTimers.total);
        if (quizTimers.question) clearInterval(quizTimers.question);
        
        // Stop background music
        stopBackgroundMusic();
        
        // Calculate score and correct answers
        let correctCount = 0;
        currentQuizQuestions.forEach((question, index) => {
            const userAnswer = studentAnswers[index];
            if (userAnswer === null) return;
            
            let isCorrect = false;
            if (question.type === 'tf') {
                isCorrect = userAnswer === question.answer;
            } else {
                isCorrect = userAnswer == question.correct_index;
            }
            
            if (isCorrect) correctCount++;
        });
        
        // Calculate percentage score
        const totalQuestions = currentQuizQuestions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        
        // Try to submit to database (but don't fail if it errors)
        try {
            const { error: submitError } = await supabase
                .from('session_participants')
                .upsert({
                    session_id: currentQuizSession?.id,
                    student_id: currentUser?.id,
                    answers: studentAnswers,
                    score: percentage,
                    correct_count: correctCount,
                    total_questions: totalQuestions,
                    completed_at: new Date().toISOString()
                });
            
            if (submitError) {
                console.warn('Could not save to database:', submitError);
            }
        } catch (dbError) {
            console.warn('Database save failed:', dbError);
            // Continue anyway - show results even if save fails
        }
        
        // Show results
        showQuizResults(correctCount, totalQuestions, percentage);
        
    } catch (error) {
        console.error('Error finishing quiz:', error);
        // Still try to show results even if there's an error
        const correctCount = studentAnswers.filter((answer, index) => {
            if (answer === null) return false;
            const question = currentQuizQuestions[index];
            if (question.type === 'tf') {
                return answer === question.answer;
            } else {
                return answer == question.correct_index;
            }
        }).length;
        const totalQuestions = currentQuizQuestions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        showQuizResults(correctCount, totalQuestions, percentage);
    }
}

// Show quiz results
function showQuizResults(correctCount, totalQuestions, percentage) {
    console.log(`Quiz completed: ${correctCount}/${totalQuestions} correct (${percentage}%)`);
    
    // Determine grade and message
    let grade = '';
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
        grade = 'Xuất sắc';
        message = 'Bạn đã làm rất tốt!';
        emoji = '🎉';
    } else if (percentage >= 80) {
        grade = 'Giỏi';
        message = 'Kết quả ấn tượng!';
        emoji = '🌟';
    } else if (percentage >= 70) {
        grade = 'Khá';
        message = 'Làm tốt lắm!';
        emoji = '👏';
    } else if (percentage >= 60) {
        grade = 'Trung bình khá';
        message = 'Cố gắng lên!';
        emoji = '👍';
    } else if (percentage >= 50) {
        grade = 'Trung bình';
        message = 'Cần ôn tập thêm!';
        emoji = '📚';
    } else {
        grade = 'Cần cố gắng';
        message = 'Hãy cố gắng hơn!';
        emoji = '💪';
    }
    
    const resultsHTML = `
        <div class="quiz-results">
            <div class="results-content">
                <div class="results-emoji">${emoji}</div>
                <h2>Kết quả bài thi</h2>
                
                <div class="score-stats">
                    <div class="stat-item">
                        <div class="stat-label">Số câu đúng</div>
                        <div class="stat-value correct">${correctCount}</div>
                    </div>
                    <div class="stat-divider">/</div>
                    <div class="stat-item">
                        <div class="stat-label">Tổng số câu</div>
                        <div class="stat-value total">${totalQuestions}</div>
                    </div>
                </div>
                
                <div class="score-percentage-box">
                    <div class="percentage-label">Điểm số</div>
                    <div class="percentage-value">${percentage}%</div>
                </div>
                
                <div class="grade-box">
                    <div class="grade-label">Xếp loại</div>
                    <div class="grade-value">${grade}</div>
                </div>
                
                <p class="score-message">${message}</p>
                
                <div class="results-actions">
                    <button class="btn-primary" onclick="returnToWaitingRoom()">
                        <i class="fas fa-arrow-left"></i> Quay lại phòng chờ
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('quiz-active-page').innerHTML = resultsHTML;
}

// Return to waiting room
function returnToWaitingRoom() {
    showPage('waiting-room');
}

// Load manage questions
async function loadManageQuestions() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: questions, error } = await supabase
            .from('questions')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderManageQuestionsList(questions || []);
        loadManageCategories(questions || []);
        
    } catch (error) {
        console.error('Error loading manage questions:', error);
        showError('Lỗi khi tải danh sách câu hỏi');
    }
}

// Render manage questions list
function renderManageQuestionsList(questions) {
    const questionsList = document.getElementById('manageQuestionsList');
    if (!questionsList) return;
    
    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center; color: #6b7280;">
                <i class="fas fa-question-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Chưa có câu hỏi nào. Hãy tạo câu hỏi mới!</p>
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = questions.map(question => {
        const isMCQ = question.type === 'mcq';
        const typeText = isMCQ ? '4 lựa chọn' : 'Đúng/Sai';
        const typeClass = isMCQ ? 'manage-question-type' : 'manage-question-type';
        
        return `
            <div class="manage-question-item">
                <div class="manage-question-content">
                    <div class="manage-question-text">${question.text}</div>
                    <div class="manage-question-meta">
                        <span class="${typeClass}">${typeText}</span>
                        <span class="manage-question-category">${question.category || 'Chưa phân loại'}</span>
                        <span>${new Date(question.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                <div class="manage-question-actions">
                    <button class="btn-edit-question" onclick="editQuestion('${question.id}')" title="Sửa câu hỏi">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-question" onclick="deleteQuestion('${question.id}')" title="Xóa câu hỏi">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Load categories for manage tab
function loadManageCategories(questions) {
    const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
    const categorySelect = document.getElementById('manageQuestionCategory');
    
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Tất cả chủ đề</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// Filter manage questions
function filterManageQuestions() {
    const searchTerm = document.getElementById('manageQuestionSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('manageQuestionCategory').value;
    const questionItems = document.querySelectorAll('.manage-question-item');
    
    questionItems.forEach(item => {
        const text = item.querySelector('.manage-question-text').textContent.toLowerCase();
        const category = item.querySelector('.manage-question-category').textContent;
        
        const matchesSearch = text.includes(searchTerm);
        const matchesCategory = !categoryFilter || category === categoryFilter;
        
        if (matchesSearch && matchesCategory) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Refresh manage questions
function refreshManageQuestions() {
    loadManageQuestions();
}

// Edit question
async function editQuestion(questionId) {
    try {
        const { data: question, error } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (error) throw error;
        
        // Switch to new question tab and populate form
        switchTab('new');
        
        // Populate form with existing data
        document.getElementById('newQuestionType').value = question.type;
        document.getElementById('newQuestionText').value = question.text;
        document.getElementById('newQuestionCategory').value = question.category || '';
        
        if (question.type === 'tf') {
            document.getElementById('newTfAnswer').value = question.correct_answer;
        } else {
            const options = question.options || [];
            document.getElementById('newOptionA').value = options[0] || '';
            document.getElementById('newOptionB').value = options[1] || '';
            document.getElementById('newOptionC').value = options[2] || '';
            document.getElementById('newOptionD').value = options[3] || '';
            document.getElementById('newCorrectAnswer').value = question.correct_answer;
        }
        
        // Store question ID for update
        window.editingQuestionId = questionId;
        
        // Change submit button text
        const submitBtn = document.querySelector('#newQuestionForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Cập nhật câu hỏi';
        }
        
        showSuccess('Đã tải dữ liệu câu hỏi để chỉnh sửa');
        
    } catch (error) {
        console.error('Error loading question for edit:', error);
        showError('Lỗi khi tải câu hỏi: ' + error.message);
    }
}

// Delete question
async function deleteQuestion(questionId) {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId);
        
        if (error) throw error;
        
        showSuccess('Đã xóa câu hỏi thành công');
        loadManageQuestions();
        
    } catch (error) {
        console.error('Error deleting question:', error);
        showError('Lỗi khi xóa câu hỏi: ' + error.message);
    }
}

// Switch builder tabs
function switchBuilderTab(tabName) {
    try {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Activate selected tab
        const tabButton = document.querySelector(`[onclick="switchBuilderTab('${tabName}')"]`);
        let tabContent;
        if (tabName === 'manage') {
            tabContent = document.getElementById('manageQuestionsTab');
        } else {
            tabContent = document.getElementById(`${tabName}QuestionTab`);
        }
        


        
        if (tabButton) {
            tabButton.classList.add('active');

        }
        if (tabContent) {
            tabContent.classList.add('active');
            tabContent.style.display = 'block';
            tabContent.style.visibility = 'visible';
            tabContent.style.opacity = '1';

        } else {
            console.error('Tab content not found for:', tabName);
        }
        
        // Load data for manage tab
        if (tabName === 'manage') {

            loadBuilderQuestions();
        }
        

        
    } catch (error) {
        console.error('Error switching builder tab:', error);
    }
}

// Load builder questions
async function loadBuilderQuestions() {
    try {

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {

            return;
        }
        

        
        // Load all questions (temporarily remove user filter to show all)
        const { data: questions, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        


        
        // Test: Add a simple visible element first
        const questionsList = document.getElementById('builderQuestionsList');
        if (questionsList) {
            questionsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #8b5cf6; font-weight: bold; background: #f0f0f0; border-radius: 8px; margin: 1rem 0;">Đang tải câu hỏi...</div>';
            
            setTimeout(() => {
                renderBuilderQuestionsList(questions || []);
                loadBuilderCategories(questions || []);
            }, 1000);
        } else {
            console.error('builderQuestionsList element not found!');
        }
        
    } catch (error) {
        console.error('Error loading builder questions:', error);
        showError('Lỗi khi tải danh sách câu hỏi: ' + error.message);
    }
}

// Render builder questions list
function renderBuilderQuestionsList(questions) {

    const questionsList = document.getElementById('builderQuestionsList');
    if (!questionsList) {
        console.error('builderQuestionsList element not found');
        return;
    }
    

    
    if (questions.length === 0) {

        questionsList.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center; color: #6b7280;">
                <i class="fas fa-question-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Chưa có câu hỏi nào. Hãy tạo câu hỏi mới!</p>
            </div>
        `;
        return;
    }
    
    const htmlContent = questions.map(question => {
        const isMCQ = question.type === 'mcq';
        const typeText = isMCQ ? '4 lựa chọn' : 'Đúng/Sai';
        
        return `
            <div class="manage-question-item">
                <div class="manage-question-content">
                    <div class="manage-question-text">${question.text}</div>
                    <div class="manage-question-meta">
                        <span class="manage-question-type">${typeText}</span>
                        <span class="manage-question-category">${question.category || 'Chưa phân loại'}</span>
                        <span>${new Date(question.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                <div class="manage-question-actions">
                    <button class="btn-edit-question" onclick="editBuilderQuestion('${question.id}')" title="Sửa câu hỏi">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-question" onclick="deleteBuilderQuestion('${question.id}')" title="Xóa câu hỏi">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    


    
    questionsList.innerHTML = htmlContent;
    

}

// Load categories for builder tab
function loadBuilderCategories(questions) {
    const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
    const categorySelect = document.getElementById('builderQuestionCategory');
    

    
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Tất cả chủ đề</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// Filter builder questions
function filterBuilderQuestions() {
    const searchTerm = document.getElementById('builderQuestionSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('builderQuestionCategory').value;
    const questionItems = document.querySelectorAll('#builderQuestionsList .manage-question-item');
    
    questionItems.forEach(item => {
        const text = item.querySelector('.manage-question-text').textContent.toLowerCase();
        const category = item.querySelector('.manage-question-category').textContent;
        
        const matchesSearch = text.includes(searchTerm);
        const matchesCategory = !categoryFilter || category === categoryFilter;
        
        if (matchesSearch && matchesCategory) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Refresh builder questions
function refreshBuilderQuestions() {
    loadBuilderQuestions();
}

// Edit builder question
async function editBuilderQuestion(questionId) {
    try {
        const { data: question, error } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (error) throw error;
        
        // Switch to create tab and populate form
        switchBuilderTab('create');
        
        // Populate form with existing data
        document.getElementById('questionType').value = question.type;
        document.getElementById('questionText').value = question.text;
        document.getElementById('questionCategory').value = question.category || '';
        
        if (question.type === 'tf') {
            document.getElementById('tfAnswer').value = question.correct_answer;
        } else {
            const options = question.options || [];
            document.getElementById('optionA').value = options[0] || '';
            document.getElementById('optionB').value = options[1] || '';
            document.getElementById('optionC').value = options[2] || '';
            document.getElementById('optionD').value = options[3] || '';
            document.getElementById('correctAnswer').value = question.correct_answer;
        }
        
        // Store question ID for update
        window.editingBuilderQuestionId = questionId;
        
        // Change submit button text
        const submitBtn = document.querySelector('#questionForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Cập nhật câu hỏi';
        }
        
        showSuccess('Đã tải dữ liệu câu hỏi để chỉnh sửa');
        
    } catch (error) {
        console.error('Error loading question for edit:', error);
        showError('Lỗi khi tải câu hỏi: ' + error.message);
    }
}

// Delete builder question
async function deleteBuilderQuestion(questionId) {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId);
        
        if (error) throw error;
        
        showSuccess('Đã xóa câu hỏi thành công');
        loadBuilderQuestions();
        
    } catch (error) {
        console.error('Error deleting question:', error);
        showError('Lỗi khi xóa câu hỏi: ' + error.message);
    }
}

// ==================== AUDIO FUNCTIONS ====================

// Audio settings state
let audioSettings = {
    backgroundMusic: false,
    correctSound: false,
    incorrectSound: false
};

// Initialize audio settings from localStorage
function initializeAudioSettings() {
    const savedSettings = localStorage.getItem('quizAudioSettings');
    if (savedSettings) {
        audioSettings = JSON.parse(savedSettings);
    }
    
    // Update toggle switches
    document.getElementById('backgroundMusicToggle').checked = audioSettings.backgroundMusic;
    document.getElementById('correctSoundToggle').checked = audioSettings.correctSound;
    document.getElementById('incorrectSoundToggle').checked = audioSettings.incorrectSound;
    
    // Update settings button icon
    updateSettingsButtonIcon();
}

// Reset audio settings to OFF when starting quiz
function resetAudioSettingsForQuiz() {
    audioSettings.backgroundMusic = false;
    audioSettings.correctSound = false;
    audioSettings.incorrectSound = false;
    saveAudioSettings();
    updateSettingsButtonIcon();

}

// Save audio settings to localStorage
function saveAudioSettings() {
    localStorage.setItem('quizAudioSettings', JSON.stringify(audioSettings));
}

// Update settings button icon based on audio state
function updateSettingsButtonIcon() {
    const settingsBtn = document.getElementById('audioSettingsBtn');
    const icon = settingsBtn.querySelector('i');
    
    if (audioSettings.backgroundMusic || audioSettings.correctSound || audioSettings.incorrectSound) {
        icon.className = 'fas fa-volume-up';
        settingsBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else {
        icon.className = 'fas fa-volume-mute';
        settingsBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}

// Toggle audio settings modal
function toggleAudioSettings() {
    console.log('toggleAudioSettings() called');
    const modal = document.getElementById('audioSettingsModal');

    if (modal) {
        // Move modal to body to ensure it's on top
        document.body.appendChild(modal);
        
        // Remove inline style completely and use class
        modal.removeAttribute('style');
        modal.classList.add('show');
        


        console.log('Modal style attribute:', modal.getAttribute('style'));
        console.log('Modal computed style:', window.getComputedStyle(modal).display);
        console.log('Modal z-index:', window.getComputedStyle(modal).zIndex);
        console.log('Modal position:', window.getComputedStyle(modal).position);
    } else {
        console.error('Audio settings modal not found!');
    }
}

// Close audio settings modal
function closeAudioSettings() {
    const modal = document.getElementById('audioSettingsModal');
    modal.classList.remove('show');
    // Don't set inline style, let CSS handle it
}

// Handle background music toggle
function toggleBackgroundMusic() {
    console.log('toggleBackgroundMusic() called');
    audioSettings.backgroundMusic = document.getElementById('backgroundMusicToggle').checked;

    saveAudioSettings();
    updateSettingsButtonIcon();
    
    if (audioSettings.backgroundMusic) {
        // Enable audio immediately when user toggles
        audioEnabled = true;

        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

// Handle correct sound toggle
function toggleCorrectSound() {
    console.log('toggleCorrectSound() called');
    audioSettings.correctSound = document.getElementById('correctSoundToggle').checked;

    saveAudioSettings();
    updateSettingsButtonIcon();
}

// Handle incorrect sound toggle
function toggleIncorrectSound() {
    console.log('toggleIncorrectSound() called');
    audioSettings.incorrectSound = document.getElementById('incorrectSoundToggle').checked;

    saveAudioSettings();
    updateSettingsButtonIcon();
}

// Play background music
function playBackgroundMusic() {
    if (!audioSettings.backgroundMusic) {

        return;
    }
    
    if (!audioEnabled) {

        return;
    }
    
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {

        backgroundMusic.volume = 0.3; // Lower volume for background music
        
        // Stop any existing playback first
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        
        // Small delay to prevent race condition
        setTimeout(() => {
            const playPromise = backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {

                }).catch(error => {


                    
                    // Use fallback audio
                    if (window.playFallbackbackgroundMusic) {
                        window.playFallbackbackgroundMusic();
                    } else {
                    }
                });
            }
        }, 100); // 100ms delay to prevent race condition
    } else {
        console.error('❌ Background music element not found!');
    }
}

// Stop background music
function stopBackgroundMusic() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

// Play correct sound
function playCorrectSound() {
    if (!audioSettings.correctSound) {

        return;
    }
    
    if (!audioEnabled) {

        return;
    }
    
    const correctSound = document.getElementById('correctSound');
    if (correctSound) {

        correctSound.volume = 0.7;
        
        // Stop any existing playback first
        correctSound.pause();
        correctSound.currentTime = 0;
        
        // Small delay to prevent race condition
        setTimeout(() => {
            const playPromise = correctSound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {

                }).catch(error => {

                    // Use fallback audio
                    if (window.playFallbackcorrectSound) {

                        window.playFallbackcorrectSound();
                    } else {

                    }
                });
            }
        }, 50); // 50ms delay to prevent race condition
    } else {
        console.error('❌ Correct sound element not found!');
    }
}

// Play incorrect sound
function playIncorrectSound() {
    if (!audioSettings.incorrectSound) {

        return;
    }
    
    if (!audioEnabled) {

        return;
    }
    
    const incorrectSound = document.getElementById('incorrectSound');
    if (incorrectSound) {

        incorrectSound.volume = 0.7;
        
        // Stop any existing playback first
        incorrectSound.pause();
        incorrectSound.currentTime = 0;
        
        // Small delay to prevent race condition
        setTimeout(() => {
            const playPromise = incorrectSound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {

                }).catch(error => {

                    // Use fallback audio
                    if (window.playFallbackincorrectSound) {

                        window.playFallbackincorrectSound();
                    } else {

                    }
                });
            }
        }, 50); // 50ms delay to prevent race condition
    } else {
        console.error('❌ Incorrect sound element not found!');
    }
}






// Web Audio API fallback (only when real files are not available)
function playWebAudioFallback(elementId) {

    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different sounds
        let frequency = 440; // A4 note
        if (elementId === 'correctSound') {
            frequency = 523.25; // C5 - higher, more positive
        } else if (elementId === 'incorrectSound') {
            frequency = 349.23; // F4 - lower, more negative
        } else if (elementId === 'backgroundMusic') {
            frequency = 220; // A3 - lower for background
        }
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        // Play for different durations
        let duration = 0.5;
        if (elementId === 'backgroundMusic') {
            duration = 2.0; // Longer for background
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        console.log(`✅ Web Audio fallback created for ${elementId} (${frequency}Hz, ${duration}s)`);
        
    } catch (error) {
        console.error(`❌ Failed to create Web Audio fallback for ${elementId}:`, error);
    }
}

// Global flag to track if audio has been enabled by user interaction
let audioEnabled = false;

// Enable audio after user interaction
function enableAudioAfterInteraction() {
    if (audioEnabled) return;
    
    audioEnabled = true;

    
    // Test all audio files
    
    // Try to play background music if it's enabled
    if (audioSettings.backgroundMusic) {
        playBackgroundMusic();
    }
    
    // Test audio immediately
}

// Test audio immediately when user enables


// Add event listeners for audio toggles
document.addEventListener('DOMContentLoaded', function() {

    
    // Test audio files on page load
    
    // Test audio files immediately
    
    // Add global click listener to enable audio
    document.addEventListener('click', enableAudioAfterInteraction, { once: true });
    document.addEventListener('touchstart', enableAudioAfterInteraction, { once: true });
    document.addEventListener('keydown', enableAudioAfterInteraction, { once: true });
    
    // Background music toggle
    const backgroundToggle = document.getElementById('backgroundMusicToggle');
    if (backgroundToggle) {
        backgroundToggle.addEventListener('change', toggleBackgroundMusic);

    } else {

    }
    
    // Correct sound toggle
    const correctToggle = document.getElementById('correctSoundToggle');
    if (correctToggle) {
        correctToggle.addEventListener('change', toggleCorrectSound);

    } else {

    }
    
    // Incorrect sound toggle
    const incorrectToggle = document.getElementById('incorrectSoundToggle');
    if (incorrectToggle) {
        incorrectToggle.addEventListener('change', toggleIncorrectSound);

    } else {

    }
});

