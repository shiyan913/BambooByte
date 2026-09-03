/* =====================================
   BAMBOOBYTE — interactive demo
   HTML + CSS + JavaScript only
===================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const introScreen = $("#introScreen");
const onboarding = $("#onboarding");
const authOverlay = $("#authOverlay");
const appModal = $("#appModal");

let authMode = "login";
let currentQuestion = 1;
let selectedTestAnswer = null;

const defaultUser = {
    name: "Alex",
    email: "",
    goal: "Education",
    level: 4,
    target: "20 min",
    script: "Simplified",
    onboarded: false
};

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("bambooByteUser")) || null;
    } catch {
        return null;
    }
}

function saveUser(user) {
    localStorage.setItem("bambooByteUser", JSON.stringify(user));
}

function getSession() {
    return localStorage.getItem("bambooByteLoggedIn") === "true";
}

function setSession(value) {
    localStorage.setItem("bambooByteLoggedIn", value ? "true" : "false");
}

/* =====================================
   INTRO → LOGIN / APP
===================================== */
window.addEventListener("load", () => {
    setTimeout(() => {
        introScreen.classList.add("hide");
        setTimeout(startApp, 450);
    }, 2100);
});

function startApp() {
    const user = getUser();

    if (!user || !getSession()) {
        authOverlay.classList.remove("hidden");
        return;
    }

    applyUser(user);
    if (!user.onboarded) showOnboarding();
}

/* =====================================
   LOGIN / SIGN UP
===================================== */
const loginTab = $("#loginTab");
const signupTab = $("#signupTab");
const nameField = $("#nameField");
const nameInput = $("#nameInput");
const emailInput = $("#emailInput");
const passwordInput = $("#passwordInput");
const authForm = $("#authForm");
const authSubmit = $("#authSubmit");
const authMessage = $("#authMessage");

function setAuthMode(mode) {
    authMode = mode;
    loginTab.classList.toggle("active", mode === "login");
    signupTab.classList.toggle("active", mode === "signup");
    nameField.classList.toggle("hidden", mode !== "signup");
    authSubmit.textContent = mode === "login" ? "Log in →" : "Create account →";
    passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    authMessage.textContent = "";
}

loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));

authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const stored = getUser();

    if (authMode === "signup") {
        const name = nameInput.value.trim();
        if (!name) {
            authMessage.textContent = "Please enter your name.";
            return;
        }
        const newUser = { ...defaultUser, name, email, password, onboarded: false };
        saveUser(newUser);
        setSession(true);
        authOverlay.classList.add("hidden");
        applyUser(newUser);
        showOnboarding();
        return;
    }

    if (!stored) {
        authMessage.textContent = "No account yet — choose Create account first.";
        return;
    }

    if (stored.email !== email || stored.password !== password) {
        authMessage.textContent = "Email or password does not match this demo account.";
        return;
    }

    setSession(true);
    authOverlay.classList.add("hidden");
    applyUser(stored);
    if (!stored.onboarded) showOnboarding();
});

/* =====================================
   ONBOARDING
===================================== */
const continueButton = $("#continueButton");
const onboardingProgress = $("#onboardingProgress");
const questions = $$(".question");

function showOnboarding() {
    currentQuestion = 1;
    questions.forEach((q, index) => q.classList.toggle("active-question", index === 0));
    onboardingProgress.style.width = "33%";
    continueButton.textContent = "Continue →";
    onboarding.classList.remove("hidden");
}

$$('.answer-option').forEach((option) => {
    option.addEventListener("click", function () {
        const parent = this.parentElement;
        parent.querySelectorAll(".answer-option").forEach((button) => button.classList.remove("selected"));
        this.classList.add("selected");
    });
});

continueButton.addEventListener("click", () => {
    const current = $(`.question[data-question="${currentQuestion}"]`);
    const selected = current.querySelector(".selected");

    if (!selected) {
        alert("Please select an option first.");
        return;
    }

    if (currentQuestion < 3) {
        current.classList.remove("active-question");
        currentQuestion += 1;
        $(`.question[data-question="${currentQuestion}"]`).classList.add("active-question");
        onboardingProgress.style.width = `${(currentQuestion / 3) * 100}%`;
        if (currentQuestion === 3) continueButton.textContent = "Start Learning →";
        return;
    }

    const answers = [...questions].map((q) => q.querySelector(".selected strong")?.textContent.trim());
    const levelMap = { Beginner: 1, Elementary: 2, Intermediate: 4, Advanced: 5 };
    const user = getUser() || { ...defaultUser };
    user.goal = answers[0] || "Education";
    user.level = levelMap[answers[1]] || 1;
    user.target = answers[2] || "20 min";
    user.onboarded = true;
    saveUser(user);
    onboarding.classList.add("hidden");
    applyUser(user);
    openModal(
        "YOUR PLAN IS READY",
        "Welcome to BambooByte 🎋",
        `<span class="lesson-big-char">开始</span><span class="lesson-pinyin">kāi shǐ · begin</span><p>Your learning plan has been personalised for <strong>${escapeHTML(user.goal)}</strong>, at approximately <strong>HSK ${user.level}</strong>, with a daily target of <strong>${escapeHTML(user.target)}</strong>.</p>`,
        "Start learning →",
        () => showPage("learning")
    );
});

/* =====================================
   PAGE NAVIGATION
===================================== */
const navItems = $$(".nav-item");
const pages = $$(".page");
const pageTitle = $("#pageTitle");

function showPage(page) {
    navItems.forEach((nav) => nav.classList.toggle("active", nav.dataset.page === page));
    pages.forEach((section) => section.classList.toggle("active-page", section.id === page));

    const user = getUser() || defaultUser;
    const titles = {
        home: `你好, ${user.name}.`,
        learning: "Learn 学习",
        mocktest: "Mock Test 模拟考试",
        advanced: "Advanced 进阶",
        profile: "Your Profile"
    };
    pageTitle.textContent = titles[page];
    window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach((item) => item.addEventListener("click", () => showPage(item.dataset.page)));
$("#avatarButton")?.addEventListener("click", () => showPage("profile"));
$("#viewAllBtn")?.addEventListener("click", () => showPage("learning"));

/* =====================================
   SIMPLIFIED / TRADITIONAL
===================================== */
const simplifiedButton = $("#simplifiedBtn");
const traditionalButton = $("#traditionalBtn");
const profileScript = $("#profileScript");

function switchScript(script) {
    $$(".chinese-text").forEach((text) => {
        text.textContent = text.getAttribute(script === "Traditional" ? "data-traditional" : "data-simplified");
    });
    simplifiedButton.classList.toggle("toggle-active", script === "Simplified");
    traditionalButton.classList.toggle("toggle-active", script === "Traditional");
    if (profileScript) profileScript.textContent = script;

    const user = getUser();
    if (user) {
        user.script = script;
        saveUser(user);
    }
}

simplifiedButton.addEventListener("click", () => switchScript("Simplified"));
traditionalButton.addEventListener("click", () => switchScript("Traditional"));

/* =====================================
   HSK PANDA BAMBOO
===================================== */
const pandaClimber = $("#pandaClimber");
const bambooFill = $("#bambooFill");
const currentHSKText = $("#currentHSKText");
const nextHSKText = $("#nextHSKText");
const hskLabelItems = $$(".hsk-labels span");
const levelButtons = $$(".level-demo-buttons button");

function updateHSKLevel(level, persist = true) {
    const safeLevel = Math.max(1, Math.min(6, Number(level) || 1));
    const fillMap = { 1: 16, 2: 32, 3: 49, 4: 66, 5: 83, 6: 100 };
    const pandaMap = { 1: 8, 2: 24, 3: 41, 4: 58, 5: 75, 6: 92 };

    if (bambooFill) bambooFill.style.height = `${fillMap[safeLevel]}%`;
    if (pandaClimber) pandaClimber.style.bottom = `${pandaMap[safeLevel]}%`;
    if (currentHSKText) currentHSKText.textContent = `HSK ${safeLevel}`;
    if (nextHSKText) nextHSKText.textContent = safeLevel < 6 ? `Keep growing toward HSK ${safeLevel + 1}` : "Top level reached — bamboo mastered! 🎋";

    hskLabelItems.forEach((label) => {
        const labelLevel = Number(label.dataset.level);
        label.classList.remove("current-level", "passed-level", "locked-level");
        if (labelLevel === safeLevel) label.classList.add("current-level");
        else if (labelLevel < safeLevel) label.classList.add("passed-level");
        else label.classList.add("locked-level");
    });

    levelButtons.forEach((button) => button.classList.toggle("active-level-btn", Number(button.dataset.level) === safeLevel));

    if ($("#profileLevel")) $("#profileLevel").textContent = `HSK ${safeLevel}`;

    if (persist) {
        const user = getUser();
        if (user) { user.level = safeLevel; saveUser(user); }
    }
}

levelButtons.forEach((button) => button.addEventListener("click", () => updateHSKLevel(button.dataset.level)));

/* =====================================
   LESSONS / COURSE BUTTONS
===================================== */
const lessonContent = {
    "Everyday Conversations": {
        cn: "最近怎么样？",
        py: "zuì jìn zěn me yàng?",
        en: "How have you been lately?",
        tip: "最近 (zuì jìn) means ‘recently’. 怎么样 (zěn me yàng) means ‘how is it / how are things?’"
    },
    "Ordering Food": {
        cn: "我要这个。",
        py: "wǒ yào zhè ge",
        en: "I want this one.",
        tip: "我要… (wǒ yào...) is a simple way to say ‘I want...’. In polite situations, add 请 (qǐng)."
    },
    "Essential Chinese": {
        cn: "认识你很高兴。",
        py: "rèn shi nǐ hěn gāo xìng",
        en: "Nice to meet you.",
        tip: "认识 (rèn shi) = to know/meet; 高兴 (gāo xìng) = happy."
    },
    "Food & Dining": {
        cn: "这个好吃吗？",
        py: "zhè ge hǎo chī ma?",
        en: "Is this delicious?",
        tip: "吗 (ma) turns a statement into a yes/no question."
    },
    "Travel & Directions": {
        cn: "地铁站在哪里？",
        py: "dì tiě zhàn zài nǎ lǐ?",
        en: "Where is the subway station?",
        tip: "在哪里 (zài nǎ lǐ) means ‘where is...?’"
    },
    "Chinese for Work": {
        cn: "我们开会吧。",
        py: "wǒ men kāi huì ba",
        en: "Let's have a meeting.",
        tip: "吧 (ba) softens a suggestion, similar to ‘let’s...’"
    }
};

function openLesson(name) {
    const lesson = lessonContent[name] || lessonContent["Everyday Conversations"];
    openModal(
        "MINI LESSON",
        name,
        `<span class="lesson-big-char">${lesson.cn}</span><span class="lesson-pinyin">${lesson.py}</span><p><strong>${lesson.en}</strong></p><p>${lesson.tip}</p>`,
        "Lesson complete ✓",
        () => {
            const user = getUser();
            if (user) {
                user.level = Math.min(6, user.level || 1);
                saveUser(user);
            }
        }
    );
}

$("#continueLessonBtn")?.addEventListener("click", () => openLesson("Everyday Conversations"));
$$('.lesson-play[data-lesson]').forEach((button) => button.addEventListener("click", () => openLesson(button.dataset.lesson)));
$$('.course-bottom button[data-course]').forEach((button) => button.addEventListener("click", () => openLesson(button.dataset.course)));

/* =====================================
   MOCK TEST
===================================== */
const testAnswers = $$(".test-answer");
const checkAnswerBtn = $("#checkAnswerBtn");

testAnswers.forEach((answer) => {
    answer.addEventListener("click", function () {
        testAnswers.forEach((option) => option.classList.remove("selected", "correct-answer", "wrong-answer"));
        this.classList.add("selected");
        selectedTestAnswer = this;
        checkAnswerBtn.textContent = "Check Answer";
    });
});

checkAnswerBtn?.addEventListener("click", () => {
    if (!selectedTestAnswer) {
        alert("Choose an answer first.");
        return;
    }

    testAnswers.forEach((answer) => {
        if (answer.dataset.correct === "true") answer.classList.add("correct-answer");
    });

    const correct = selectedTestAnswer.dataset.correct === "true";
    if (!correct) selectedTestAnswer.classList.add("wrong-answer");
    checkAnswerBtn.textContent = correct ? "Correct! ✓" : "See correct answer ↑";

    openModal(
        correct ? "CORRECT" : "KEEP GOING",
        correct ? "很好！ Hěn hǎo!" : "Almost there",
        correct
            ? `<p class="answer-feedback">✅ <strong>我学习中文三年了。</strong> is the best answer.</p><p>The pattern is subject + verb + object + duration + 了 for an action continuing up to now.</p>`
            : `<p class="answer-feedback">The best answer is <strong>A: 我学习中文三年了。</strong></p><p><strong>wǒ xué xí zhōng wén sān nián le</strong> — “I have studied Chinese for three years.”</p>`,
        "Back to test",
        null
    );
});

/* =====================================
   ADVANCED CONTENT
===================================== */
$("#readArticleBtn")?.addEventListener("click", () => {
    openModal(
        "ADVANCED READING",
        "城市生活与传统文化",
        `<span class="lesson-pinyin">chéng shì shēng huó yǔ chuán tǒng wén huà</span><p>随着城市的发展，越来越多的年轻人开始重新关注传统文化。茶文化、书法和传统服装逐渐成为现代生活的一部分。</p><p><strong>Key words:</strong></p><ul><li>随着 · suí zhe · along with</li><li>传统文化 · chuán tǒng wén huà · traditional culture</li><li>逐渐 · zhú jiàn · gradually</li></ul>`,
        "Done",
        null
    );
});

$$('.clickable-card[data-popup]').forEach((card) => {
    card.addEventListener("click", () => {
        if (card.dataset.popup === "grammar") {
            openModal("GRAMMAR", "不但……而且……", `<span class="lesson-pinyin">bù dàn... ér qiě...</span><p>Use this structure for <strong>“not only... but also...”</strong></p><p>Example: 他不但会说中文，而且会写汉字。<br><small>tā bù dàn huì shuō zhōng wén, ér qiě huì xiě hàn zì.</small></p>`, "Got it", null);
        } else {
            openModal("IDIOM", "画蛇添足", `<span class="lesson-pinyin">huà shé tiān zú</span><p>Literally: “draw a snake and add feet.” It means ruining something by adding unnecessary details.</p>`, "Got it", null);
        }
    });
});

/* =====================================
   SETTINGS / PROFILE / LOGOUT
===================================== */
$("#settingsBtn")?.addEventListener("click", () => {
    const user = getUser() || defaultUser;
    openModal(
        "SETTINGS",
        "Learning preferences",
        `<p><strong>Current script:</strong> ${escapeHTML(user.script || "Simplified")}</p><p><strong>Daily target:</strong> ${escapeHTML(user.target || "20 min")}</p><p>You can change simplified/traditional Chinese with the 简 / 繁 switch at the top. Your choices are saved automatically in this browser.</p>`,
        "Close",
        null
    );
});

$("#logoutBtn")?.addEventListener("click", () => {
    setSession(false);
    closeModal();
    showPage("home");
    authForm.reset();
    setAuthMode("login");
    authOverlay.classList.remove("hidden");
});

/* =====================================
   MODAL
===================================== */
let modalActionCallback = null;

function openModal(eyebrow, title, body, actionLabel = "Close", callback = null) {
    $("#modalEyebrow").textContent = eyebrow;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = body;
    $("#modalAction").textContent = actionLabel;
    modalActionCallback = callback;
    appModal.classList.remove("hidden");
}

function closeModal() {
    appModal.classList.add("hidden");
    modalActionCallback = null;
}

$("#modalClose")?.addEventListener("click", closeModal);
$("#modalAction")?.addEventListener("click", () => {
    const callback = modalActionCallback;
    closeModal();
    if (callback) callback();
});
appModal?.addEventListener("click", (event) => { if (event.target === appModal) closeModal(); });

/* =====================================
   APPLY SAVED USER TO UI
===================================== */
function applyUser(user) {
    const cleanName = user.name || "Learner";
    const initial = cleanName.charAt(0).toUpperCase();

    pageTitle.textContent = `你好, ${cleanName}.`;
    $("#avatarButton").textContent = initial;
    $(".profile-avatar").textContent = initial;
    $("#profileName").textContent = cleanName;
    $("#profileSummary").textContent = `Learning Chinese for ${String(user.goal || "Education").toLowerCase()} • ${user.target || "20 min"}/day`;
    $("#profileGoal").textContent = user.goal || "Education";
    $("#profileTarget").textContent = String(user.target || "20 min").replace(" min", " minutes");

    switchScript(user.script || "Simplified");
    updateHSKLevel(user.level || 1, false);
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
