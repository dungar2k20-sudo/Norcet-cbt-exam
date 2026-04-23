// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
const CONFIG = {
  examDuration: 60, // Time in minutes (Change this to your exam time)
  questionTime: 0,  // Per question time (0 = unlimited)
  passingScore: 50, // Percentage needed to pass
  showFeedback: true, // Show correct/wrong immediately after answer? (Usually false for real exams)
};

let state = {
  questions: [],
  currentQIndex: 0,
  userAnswers: {}, // { qIndex: selectedOptionIndex }
  markedQuestions: new Set(),
  startTime: null,
  timerInterval: null,
  timeRemaining: CONFIG.examDuration * 60, // seconds
  userName: '',
  isTestActive: false,
  theme: 'dark'
};

// DOM Elements
const els = {
  login: document.getElementById('login'),
  test: document.getElementById('test'),
  result: document.getElementById('result'),
  review: document.getElementById('review'),
  bottomNav: document.getElementById('bottomNav'),
  rightPanel: document.getElementById('rightPanel'),
  paletteBox: document.getElementById('paletteBox'),
  reportModal: document.getElementById('reportModal'),
  qtext: document.getElementById('qtext'),
  options: document.getElementById('options'),
  qNum: document.getElementById('qNum'),
  qTotal: document.getElementById('qTotal'),
  timerDisp: document.getElementById('timerDisp'),
  timerBar: document.getElementById('timerBar'),
  progressFill: document.getElementById('progressFill'),
  startBtn: document.getElementById('startBtn'),
  usernameInput: document.getElementById('usernameInput'),
  tgPromoBar: document.getElementById('tgPromoBar'),
  notifications: document.getElementById('notifications'),
  confettiCanvas: document.getElementById('confettiCanvas'),
  // Buttons
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  markBtn: document.getElementById('markBtn'),
  submitBtn: document.getElementById('submitBtn'),
  paletteBtn: document.getElementById('paletteBtn'),
  reviewBtn: document.getElementById('reviewBtn'),
  palGrid: document.getElementById('palGrid'),
  reportBtn: document.getElementById('reportBtn'),
  reportClose: document.querySelector('.rep-close'),
  // Telegram
  tgWebApp: window.Telegram?.WebApp
};

// ==========================================
// 2. INITIALIZATION & TELEGRAM SETUP
// ==========================================

async function init() {
  // Initialize Telegram WebApp if available
  if (els.tgWebApp) {
    els.tgWebApp.ready();
    els.tgWebApp.expand();
    
    // Set theme to match our CSS or use Telegram's
    const tgTheme = els.tgWebApp.colorScheme;
    if (tgTheme === 'light') {
      document.body.classList.add('light-mode');
      state.theme = 'light';
    }

    // Try to get user name from Telegram if available
    const user = els.tgWebApp.initDataUnsafe?.user;
    if (user && (user.first_name || user.last_name)) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      els.usernameInput.value = name;
    }

    // Update promo bar link if needed
    els.tgPromoBar.href = els.tgWebApp.initDataUnsafe?.start_param || '#';
  }

  // Load Questions
  try {
    const response = await fetch('questions.json');
    if (!response.ok) throw new Error('Failed to load questions');
    state.questions = await response.json();
    
    // Initialize UI
    document.getElementById('qTotal').textContent = state.questions.length;
    setupEventListeners();
    
    // Check if running in Telegram
    if (els.tgWebApp) {
      els.tgPromoBar.style.display = 'flex';
    }
  } catch (err) {
    showToast('Error loading questions: ' + err.message, 'error');
    console.error(err);
  }
}

function setupEventListeners() {
  // Start Exam
  els.startBtn.addEventListener('click', startExam);

  // Navigation
  els.prevBtn.addEventListener('click', () => changeQuestion(-1));
  els.nextBtn.addEventListener('click', () => changeQuestion(1));
  els.markBtn.addEventListener('click', toggleMark);
  els.submitBtn.addEventListener('click', confirmSubmit);
  
  // Panels
  els.paletteBtn.addEventListener('click', togglePalette);
  els.reviewBtn.addEventListener('click', showReview);
  
  // Palette Grid clicks
  els.palGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('pal-btn')) {
      const idx = parseInt(e.target.dataset.index);
      goToQuestion(idx);
    }
  });

  // Report Modal
  els.reportBtn.addEventListener('click', () => els.reportModal.classList.add('show'));
  els.reportClose.addEventListener('click', () => els.reportModal.classList.remove('show'));
  document.querySelectorAll('.rep-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      showToast(`Reported: ${e.target.dataset.reason}`, 'info');
      els.reportModal.classList.remove('show');
    });
  });

  // Keyboard Shortcuts (Optional)
  document.addEventListener('keydown', (e) => {
    if (!state.isTestActive) return;
    if (e.key === 'ArrowLeft') changeQuestion(-1);
    if (e.key === 'ArrowRight') changeQuestion(1);
    if (e.key === 'Enter') toggleMark();
  });

  // Tab Switching Detection (Anti-cheat)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isTestActive) {
      const badge = document.getElementById('tabBadge');
      badge.classList.add('visible');
      const count = parseInt(document.getElementById('tabCount').textContent) || 0;
      document.getElementById('tabCount').textContent = count + 1;
      showToast('Tab switch detected!', 'error');
    }
  });
}

// ==========================================
// 3. EXAM LOGIC
// ==========================================

function startExam() {
  const name = els.usernameInput.value.trim();
  if (!name) {
    showToast('Please enter your name', 'error');
    return;
  }
  state.userName = name;
  state.isTestActive = true;
  state.startTime = Date.now();
  
  // UI Updates
  els.login.style.display = 'none';
  els.test.style.display = 'block';
  els.bottomNav.classList.add('visible');
  els.rightPanel.classList.add('visible');
  document.body.classList.add('test-active');
  
  // Start Timer
  startTimer();
  
  // Load First Question
  renderQuestion(0);
  updatePalette();
  
  // Telegram: Send data if available
  if (els.tgWebApp) {
    els.tgWebApp.sendData(JSON.stringify({ event: 'exam_started', user: state.userName }));
  }
}

function startTimer() {
  updateTimerDisplay();
  els.timerBar.style.width = '100%';
  els.timerBar.style.background = 'var(--green)';
  
  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    updateTimerDisplay();
    
    // Update Progress Bar
    const total = CONFIG.examDuration * 60;
    const pct = (state.timeRemaining / total) * 100;
    els.timerBar.style.width = `${pct}%`;
    
    if (state.timeRemaining <= 60) {
      els.timerBar.style.background = 'var(--red)';
      els.timerDisp.classList.add('timer-warn');
    }

    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(state.timeRemaining / 60);
  const s = state.timeRemaining % 60;
  els.timerDisp.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function renderQuestion(index) {
  if (index < 0 || index >= state.questions.length) return;
  
  state.currentQIndex = index;
  const q = state.questions[index];
  
  // Update Meta
  document.getElementById('qNum').textContent = index + 1;
  document.getElementById('markedCount').textContent = state.markedQuestions.size;
  
  // Render Question Text
  els.qtext.innerHTML = q.question;
  
  // Render Image if exists
  const imgBox = document.getElementById('imgBox');
  if (q.image) {
    imgBox.innerHTML = `<img src="${q.image}" alt="Question Image">`;
    imgBox.classList.add('visible');
  } else {
    imgBox.classList.remove('visible');
  }
  
  // Render Options
  els.options.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];
  
  q.options.forEach((opt, i) => {
    const btn = document.createElement('div');
    btn.className = 'opt';
    if (state.userAnswers[index] === i) btn.classList.add('selected');
    
    btn.innerHTML = `
      <span class="opt-label">${labels[i] || i+1}</span>
      <span class="opt-text">${opt}</span>
    `;
    
    btn.onclick = () => selectOption(index, i);
    els.options.appendChild(btn);
  });
  
  // Update Progress Bar
  const progressPct = ((index + 1) / state.questions.length) * 100;
  els.progressFill.style.width = `${progressPct}%`;
  
  // Update Palette Active State
  updatePalette();
}

function selectOption(qIndex, optIndex) {
  state.userAnswers[qIndex] = optIndex;
  renderQuestion(qIndex); // Re-render to show selection
}

function changeQuestion(delta) {
  const newIndex = state.currentQIndex + delta;
  if (newIndex >= 0 && newIndex < state.questions.length) {
    renderQuestion(newIndex);
  }
}

function goToQuestion(index) {
  renderQuestion(index);
  togglePalette(); // Close palette if open
}

function toggleMark() {
  const idx = state.currentQIndex;
  if (state.markedQuestions.has(idx)) {
    state.markedQuestions.delete(idx);
    showToast('Mark removed', 'info');
  } else {
    state.markedQuestions.add(idx);
    showToast('Marked for review', 'info');
  }
  renderQuestion(idx); // Update marked count
  updatePalette();
}

function updatePalette() {
  els.palGrid.innerHTML = '';
  state.questions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'pal-btn';
    btn.dataset.index = i;
    btn.textContent = i + 1;
    
    if (state.userAnswers.hasOwnProperty(i)) {
      btn.style.color = 'var(--green)';
      btn.style.borderColor = 'var(--green)';
    }
    if (state.markedQuestions.has(i)) {
      btn.style.color = 'var(--yellow)';
      btn.style.borderColor = 'var(--yellow)';
    }
    if (i === state.currentQIndex) {
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
    }
    
    els.palGrid.appendChild(btn);
  });
}

function togglePalette() {
  els.paletteBox.classList.toggle('open');
}

function showReview() {
  // Simple review implementation
  els.test.style.display = 'none';
  els.bottomNav.classList.remove('visible');
  els.review.style.display = 'block';
  
  const container = document.getElementById('review-inner');
  container.innerHTML = '<h3>Review coming soon - Full logic to be added</h3>';
}

function confirmSubmit() {
  if (confirm(`Submit exam? You have answered ${Object.keys(state.userAnswers).length} out of ${state.questions.length} questions.`)) {
    submitExam();
  }
}

function submitExam() {
  clearInterval(state.timerInterval);
  state.isTestActive = false;
  
  // Calculate Score
  let score = 0;
  state.questions.forEach((q, i) => {
    if (state.userAnswers[i] === q.correct) {
      score++;
    }
  });
  
  const total = state.questions.length;
  const percentage = Math.round((score / total) * 100);
  
  // Show Results
  els.test.style.display = 'none';
  els.bottomNav.classList.remove('visible');
  els.result.style.display = 'block';
  document.body.classList.remove('test-active');
  
  const resultInner = document.getElementById('result-inner');
  resultInner.innerHTML = `
    <div class="scorecard">
      <div class="score-num">${percentage}%</div>
      <div class="acc-num">${score} / ${total}</div>
      <div class="acc-label">Correct Answers</div>
    </div>
    <div class="stat">
      <span>Student: ${state.userName}</span>
      <span>${state.timeRemaining}s left</span>
    </div>
    <div class="result-btns">
      <button class="btn btn-blue" onclick="location.reload()">Retake Exam</button>
      <button class="btn btn-gray" onclick="shareResult()">Share Result</button>
    </div>
  `;
  
  // Telegram: Send Result
  if (els.tgWebApp) {
    const resultData = {
      event: 'exam_completed',
      user: state.userName,
      score: score,
      total: total,
      percentage: percentage
    };
    els.tgWebApp.sendData(JSON.stringify(resultData));
    // Optionally close the app
    // els.tgWebApp.close(); 
  }
  
  // Confetti
  if (percentage >= CONFIG.passingScore) {
    startConfetti();
  }
}

function shareResult() {
  // Calculate correct answers
  let correctCount = 0;
  state.questions.forEach((q, i) => {
    if (state.userAnswers[i] === q.correct) {
      correctCount++;
    }
  });

  const total = state.questions.length;
  const percentage = Math.round((correctCount / total) * 100);
  
  // Create the text message
  const text = `I scored ${correctCount} out of ${total} (${percentage}%) on the NORCET CBT Exam!`;

  // Send to Telegram if available, otherwise alert
  if (els.tgWebApp) {
    try {
      els.tgWebApp.sendData(JSON.stringify({ event: 'share', text: text }));
    } catch (e) {
      alert(text);
    }
  } else {
    alert(text);
  }
}

// ==========================================
// 4. UTILITIES
// ==========================================

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
    <div class="message">${msg}</div>
    <button class="close-btn">×</button>
  `;
  
  const closeBtn = toast.querySelector('.close-btn');
  closeBtn.onclick = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  };
  
  els.notifications.appendChild(toast);
  setTimeout(() => toast.classList.add('hide'), 3000);
}

// Simple Confetti Effect
function startConfetti() {
  const ctx = els.confettiCanvas.getContext('2d');
  els.confettiCanvas.width = window.innerWidth;
  els.confettiCanvas.height = window.innerHeight;
  
  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * els.confettiCanvas.width,
      y: Math.random() * els.confettiCanvas.height - els.confettiCanvas.height,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      size: Math.random() * 5 + 2,
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 6.2
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, els.confettiCanvas.width, els.confettiCanvas.height);
    particles.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.angle) * 2;
      if (p.y > els.confettiCanvas.height) p.y = -10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Start App
init();