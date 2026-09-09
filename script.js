
/* MULTI-PAGE MODE: each navigation item loads a real HTML document. */
if (window.BAMBOO_MULTIPAGE) {
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const map = {
    'index.html':'home','learning.html':'learning','lesson.html':'learning',
    'unit-essential.html':'learning','unit-food.html':'learning','unit-travel.html':'learning','unit-work.html':'learning',
    'unit-shopping.html':'learning','unit-campus.html':'learning','unit-health.html':'learning','unit-culture.html':'learning',
    'mocktest.html':'mocktest','mocktest-hsk1.html':'mocktest','mocktest-hsk2.html':'mocktest','mocktest-hsk3.html':'mocktest',
    'mocktest-hsk4.html':'mocktest','mocktest-hsk5.html':'mocktest','mocktest-hsk6.html':'mocktest',
    'advanced.html':'advanced','grammar.html':'advanced','reading.html':'advanced','idioms.html':'advanced',
    'about.html':'about','profile.html':'profile','settings.html':'profile'
  };
  window.__bambooInitialPage = map[file] || 'home';
}
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
   DYNAMIC DATE FUNCTION
===================================== */
function updateCurrentDate() {
    const dateLabel = $("#currentDateLabel");
    if (!dateLabel) return;

    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options).toUpperCase();
    
    // Formats into: "THURSDAY • SEPTEMBER 3"
    dateLabel.textContent = formattedDate.replace(',', ' •');
}

/* =====================================
   GOOGLE SIGN-IN INTEGRATION
===================================== */
window.handleGoogleLogin = function(response) {
    try {
        // Decode JWT Payload
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const stored = getUser() || { ...defaultUser };

        const googleUser = {
            ...stored,
            name: payload.name || stored.name || "Learner",
            email: payload.email || stored.email,
            avatar: payload.picture || stored.avatar,
            onboarded: stored.onboarded !== undefined ? stored.onboarded : true
        };

        saveUser(googleUser);
        setSession(true);
        authOverlay.classList.add("hidden");
        applyUser(googleUser);

        if (!googleUser.onboarded) {
            showOnboarding();
        }
    } catch (error) {
        console.error("Google Sign-In failed:", error);
    }
};

/* =====================================
   EDIT PROFILE MODAL LOGIC
===================================== */
const editProfileBtn = $("#editProfileBtn");
const editProfileModal = $("#editProfileModal");
const closeProfileModalBtn = $("#closeProfileModalBtn");
const editProfileForm = $("#editProfileForm");

const editNameInput = $("#editNameInput");
const editGoalSelect = $("#editGoalSelect");
const editTargetSelect = $("#editTargetSelect");

const editAvatarInput = $("#editAvatarInput");
const editAvatarPreview = $("#editAvatarPreview");
let tempAvatarBase64 = null;

editAvatarInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            tempAvatarBase64 = event.target.result;
            if (editAvatarPreview) {
                editAvatarPreview.innerHTML = `<img src="${tempAvatarBase64}" alt="Preview" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
        };
        reader.readAsDataURL(file);
    }
});

editProfileBtn?.addEventListener("click", () => {
    const user = getUser() || defaultUser;
    
    if (editNameInput) editNameInput.value = user.name || "";
    if (editGoalSelect) editGoalSelect.value = user.goal || "Education";
    if (editTargetSelect) editTargetSelect.value = user.target || "20 min";

    tempAvatarBase64 = user.avatar || null;
    if (editAvatarPreview) {
        if (user.avatar) {
            editAvatarPreview.innerHTML = `<img src="${user.avatar}" alt="Preview" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            editAvatarPreview.textContent = (user.name || "A").charAt(0).toUpperCase();
        }
    }

    editProfileModal?.classList.remove("hidden");
});

closeProfileModalBtn?.addEventListener("click", () => {
    editProfileModal?.classList.add("hidden");
});

editProfileForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = getUser() || { ...defaultUser };
    if (editNameInput) user.name = editNameInput.value.trim() || user.name;
    if (editGoalSelect) user.goal = editGoalSelect.value;
    if (editTargetSelect) user.target = editTargetSelect.value;

    if (tempAvatarBase64) {
        user.avatar = tempAvatarBase64;
    }

    saveUser(user);
    applyUser(user);

    editProfileModal?.classList.add("hidden");
});

/* =====================================
   INTRO → LOGIN / APP
===================================== */
window.addEventListener("load", () => {
    updateCurrentDate(); // Render active date
    setTimeout(() => {
        introScreen?.classList.add("hide");
        setTimeout(startApp, 450);
    }, 2100);
});

function startApp() {
    const user = getUser();

    if (!user || !getSession()) {
        authOverlay?.classList.remove("hidden");
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
    loginTab?.classList.toggle("active", mode === "login");
    signupTab?.classList.toggle("active", mode === "signup");
    nameField?.classList.toggle("hidden", mode !== "signup");
    if (authSubmit) authSubmit.textContent = mode === "login" ? "Log in →" : "Create account →";
    if (passwordInput) passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    if (authMessage) authMessage.textContent = "";
}

loginTab?.addEventListener("click", () => setAuthMode("login"));
signupTab?.addEventListener("click", () => setAuthMode("signup"));

authForm?.addEventListener("submit", (event) => {
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
        authOverlay?.classList.add("hidden");
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
    authOverlay?.classList.add("hidden");
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
    if (onboardingProgress) onboardingProgress.style.width = "33%";
    if (continueButton) continueButton.textContent = "Continue →";
    onboarding?.classList.remove("hidden");
}

$$('.answer-option').forEach((option) => {
    option.addEventListener("click", function () {
        const parent = this.parentElement;
        parent.querySelectorAll(".answer-option").forEach((button) => button.classList.remove("selected"));
        this.classList.add("selected");
    });
});

continueButton?.addEventListener("click", () => {
    const current = $(`.question[data-question="${currentQuestion}"]`);
    const selected = current?.querySelector(".selected");

    if (!selected) {
        alert("Please select an option first.");
        return;
    }

    if (currentQuestion < 3) {
        current.classList.remove("active-question");
        currentQuestion += 1;
        $(`.question[data-question="${currentQuestion}"]`).classList.add("active-question");
        if (onboardingProgress) onboardingProgress.style.width = `${(currentQuestion / 3) * 100}%`;
        if (currentQuestion === 3 && continueButton) continueButton.textContent = "Start Learning →";
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
    onboarding?.classList.add("hidden");
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
   SPA ROUTER
   One HTML document + hash-based client routing.
   Examples: #home, #learning, #mocktest, #advanced, #profile
===================================== */
const navItems = $$(".nav-item");
const pages = $$(".page");
const pageTitle = $("#pageTitle");
const routeAnnouncer = $("#routeAnnouncer");
const validRoutes = new Set(["home", "learning", "mocktest", "advanced", "about", "profile"]);

function getRouteFromHash() {
    const route = window.location.hash.replace(/^#\/?/, "").split("/")[0].toLowerCase();
    return validRoutes.has(route) ? route : "home";
}

function renderRoute(page, { scroll = true } = {}) {
    const route = validRoutes.has(page) ? page : "home";

    navItems.forEach((nav) => {
        const active = nav.dataset.page === route;
        nav.classList.toggle("active", active);
        if (active) nav.setAttribute("aria-current", "page");
        else nav.removeAttribute("aria-current");
    });

    // Only hide/show sections in the old SPA version.
    // In multi-page mode each HTML file is already its own page, so hiding
    // sections here would make standalone unit/test/profile pages disappear.
    if (!window.BAMBOO_MULTIPAGE) {
        pages.forEach((section) => {
            const active = section.id === route;
            section.classList.toggle("active-page", active);
            section.setAttribute("aria-hidden", active ? "false" : "true");
        });
    }

    const user = getUser() || defaultUser;
    const titles = {
        home: `你好, ${user.name}.`,
        learning: "Learn 学习",
        mocktest: "Mock Test 模拟考试",
        advanced: "Advanced 进阶",
        about: "About Us",
        profile: "Your Profile"
    };

    const title = titles[route] || titles.home;
    if (pageTitle) pageTitle.textContent = title;
    document.title = `${title.replace(/\s+/g, " ")} | Bamboo Byte`;
    document.body.dataset.route = route;
    if (routeAnnouncer) routeAnnouncer.textContent = `${title} view`;

    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function navigateTo(page, { replace = false } = {}) {
    const route = validRoutes.has(page) ? page : "home";
    const nextHash = `#${route}`;

    if (window.location.hash === nextHash) {
        renderRoute(route);
        return;
    }

    if (replace) {
        history.replaceState(null, "", nextHash);
        renderRoute(route, { scroll: false });
    } else {
        window.location.hash = route;
    }
}

// Back/forward browser buttons now work because every SPA view has its own hash route.
if (!window.BAMBOO_MULTIPAGE) window.addEventListener("hashchange", () => renderRoute(getRouteFromHash()));

// Backward-compatible name used by the rest of the existing BambooByte code.
function showPage(page) {
    if (window.BAMBOO_MULTIPAGE) {
        const files = {home:'index.html', learning:'learning.html', mocktest:'mocktest.html', advanced:'advanced.html', about:'about.html', profile:'profile.html'};
        window.location.href = files[page] || 'index.html';
        return;
    }
    navigateTo(page);
}

if (!window.BAMBOO_MULTIPAGE) navItems.forEach((item) => item.addEventListener("click", () => navigateTo(item.dataset.page)));
$("#avatarButton")?.addEventListener("click", () => showPage("profile"));
$("#viewAllBtn")?.addEventListener("click", () => showPage("learning"));

// Initialise the SPA route without requesting another HTML document.
if (!window.BAMBOO_MULTIPAGE) {
    if (!window.location.hash || !validRoutes.has(getRouteFromHash())) navigateTo("home", { replace: true });
    else renderRoute(getRouteFromHash(), { scroll: false });
}

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
    simplifiedButton?.classList.toggle("toggle-active", script === "Simplified");
    traditionalButton?.classList.toggle("toggle-active", script === "Traditional");
    if (profileScript) profileScript.textContent = script;

    const user = getUser();
    if (user) {
        user.script = script;
        saveUser(user);
    }
}

simplifiedButton?.addEventListener("click", () => switchScript("Simplified"));
traditionalButton?.addEventListener("click", () => switchScript("Traditional"));

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

/* ====================================
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
    },
    "Shopping & Money": {cn:"这个多少钱？", py:"zhè ge duō shǎo qián?", en:"How much is this?", tip:"多少钱 (duō shǎo qián) is the standard way to ask a price."},
    "Campus Chinese": {cn:"今天有课吗？", py:"jīn tiān yǒu kè ma?", en:"Do we have class today?", tip:"有课 (yǒu kè) means to have class."},
    "Health & Emergencies": {cn:"我有点不舒服。", py:"wǒ yǒu diǎn bù shū fu", en:"I feel a little unwell.", tip:"有点 (yǒu diǎn) softens a negative or uncomfortable condition."},
    "Culture & Social Life": {cn:"周末一起出去吧。", py:"zhōu mò yì qǐ chū qù ba", en:"Let’s go out together this weekend.", tip:"一起 (yì qǐ) means together; 吧 makes the invitation sound friendly."}
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
$$('.lesson-play[data-lesson]').forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); openLesson(button.dataset.lesson); }));
$$('.course-bottom button[data-course]').forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); openLesson(button.dataset.course); }));

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
        if (checkAnswerBtn) checkAnswerBtn.textContent = "Check Answer";
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
const advancedGrammarPatterns = [{"pattern": "不但……而且……", "pinyin": "bù dàn... ér qiě...", "meaning": "not only... but also...", "example": "他不但会说中文，而且会写汉字。", "examplePinyin": "tā bù dàn huì shuō zhōng wén, ér qiě huì xiě hàn zì."}, {"pattern": "虽然……但是……", "pinyin": "suī rán... dàn shì...", "meaning": "although... but...", "example": "虽然很累，但是她还是完成了作业。", "examplePinyin": "suī rán hěn lèi, dàn shì tā hái shì wán chéng le zuò yè."}, {"pattern": "因为……所以……", "pinyin": "yīn wèi... suǒ yǐ...", "meaning": "because... therefore...", "example": "因为下雨，所以我们没出去。", "examplePinyin": "yīn wèi xià yǔ, suǒ yǐ wǒ men méi chū qù."}, {"pattern": "如果……就……", "pinyin": "rú guǒ... jiù...", "meaning": "if... then...", "example": "如果你有时间，我们就一起吃饭。", "examplePinyin": "rú guǒ nǐ yǒu shí jiān, wǒ men jiù yì qǐ chī fàn."}, {"pattern": "只要……就……", "pinyin": "zhǐ yào... jiù...", "meaning": "as long as... then...", "example": "只要坚持练习，就会进步。", "examplePinyin": "zhǐ yào jiān chí liàn xí, jiù huì jìn bù."}, {"pattern": "只有……才……", "pinyin": "zhǐ yǒu... cái...", "meaning": "only if... then...", "example": "只有认真复习，才容易通过考试。", "examplePinyin": "zhǐ yǒu rèn zhēn fù xí, cái róng yì tōng guò kǎo shì."}, {"pattern": "即使……也……", "pinyin": "jí shǐ... yě...", "meaning": "even if... still...", "example": "即使很忙，他也每天学习中文。", "examplePinyin": "jí shǐ hěn máng, tā yě měi tiān xué xí zhōng wén."}, {"pattern": "无论……都……", "pinyin": "wú lùn... dōu...", "meaning": "no matter... all/still...", "example": "无论遇到什么问题，她都很冷静。", "examplePinyin": "wú lùn yù dào shén me wèn tí, tā dōu hěn lěng jìng."}, {"pattern": "一边……一边……", "pinyin": "yì biān... yì biān...", "meaning": "do two actions at the same time", "example": "他一边听音乐，一边做作业。", "examplePinyin": "tā yì biān tīng yīn yuè, yì biān zuò zuò yè."}, {"pattern": "一……就……", "pinyin": "yī... jiù...", "meaning": "as soon as...", "example": "我一到家就给你打电话。", "examplePinyin": "wǒ yí dào jiā jiù gěi nǐ dǎ diàn huà."}, {"pattern": "越……越……", "pinyin": "yuè... yuè...", "meaning": "the more... the more...", "example": "中文越学越有意思。", "examplePinyin": "zhōng wén yuè xué yuè yǒu yì si."}, {"pattern": "越来越……", "pinyin": "yuè lái yuè...", "meaning": "more and more...", "example": "天气越来越冷了。", "examplePinyin": "tiān qì yuè lái yuè lěng le."}, {"pattern": "又……又……", "pinyin": "yòu... yòu...", "meaning": "both... and...", "example": "这家餐厅又便宜又好吃。", "examplePinyin": "zhè jiā cān tīng yòu pián yi yòu hǎo chī."}, {"pattern": "既……又……", "pinyin": "jì... yòu...", "meaning": "both... and...", "example": "这个方法既简单又有效。", "examplePinyin": "zhè ge fāng fǎ jì jiǎn dān yòu yǒu xiào."}, {"pattern": "不是……而是……", "pinyin": "bú shì... ér shì...", "meaning": "not... but rather...", "example": "问题不是太难，而是时间不够。", "examplePinyin": "wèn tí bú shì tài nán, ér shì shí jiān bú gòu."}, {"pattern": "与其……不如……", "pinyin": "yǔ qí... bù rú...", "meaning": "rather than... it is better to...", "example": "与其担心，不如马上开始准备。", "examplePinyin": "yǔ qí dān xīn, bù rú mǎ shàng kāi shǐ zhǔn bèi."}, {"pattern": "宁可……也不……", "pinyin": "nìng kě... yě bù...", "meaning": "would rather... than...", "example": "我宁可走路，也不坐这么挤的车。", "examplePinyin": "wǒ nìng kě zǒu lù, yě bù zuò zhè me jǐ de chē."}, {"pattern": "除了……以外……", "pinyin": "chú le... yǐ wài...", "meaning": "besides/except...", "example": "除了中文以外，她还会说日语。", "examplePinyin": "chú le zhōng wén yǐ wài, tā hái huì shuō rì yǔ."}, {"pattern": "除了……就是……", "pinyin": "chú le... jiù shì...", "meaning": "nothing but / either... or...", "example": "周末他除了看书，就是运动。", "examplePinyin": "zhōu mò tā chú le kàn shū, jiù shì yùn dòng."}, {"pattern": "连……都/也……", "pinyin": "lián... dōu/yě...", "meaning": "even...", "example": "这个字太难了，连老师都想了一会儿。", "examplePinyin": "zhè ge zì tài nán le, lián lǎo shī dōu xiǎng le yí huìr."}, {"pattern": "不仅……还……", "pinyin": "bù jǐn... hái...", "meaning": "not only... also...", "example": "这个课程不仅实用，还很有趣。", "examplePinyin": "zhè ge kè chéng bù jǐn shí yòng, hái hěn yǒu qù."}, {"pattern": "先……再……", "pinyin": "xiān... zài...", "meaning": "first... then...", "example": "先把课文读一遍，再回答问题。", "examplePinyin": "xiān bǎ kè wén dú yí biàn, zài huí dá wèn tí."}, {"pattern": "一方面……另一方面……", "pinyin": "yì fāng miàn... lìng yì fāng miàn...", "meaning": "on one hand... on the other hand...", "example": "一方面我想工作，另一方面我也想继续学习。", "examplePinyin": "yì fāng miàn wǒ xiǎng gōng zuò, lìng yì fāng miàn wǒ yě xiǎng jì xù xué xí."}, {"pattern": "既然……就……", "pinyin": "jì rán... jiù...", "meaning": "since... then...", "example": "既然来了，就多待几天吧。", "examplePinyin": "jì rán lái le, jiù duō dāi jǐ tiān ba."}, {"pattern": "由于……因此……", "pinyin": "yóu yú... yīn cǐ...", "meaning": "due to... therefore...", "example": "由于天气不好，因此比赛被取消了。", "examplePinyin": "yóu yú tiān qì bù hǎo, yīn cǐ bǐ sài bèi qǔ xiāo le."}, {"pattern": "之所以……是因为……", "pinyin": "zhī suǒ yǐ... shì yīn wèi...", "meaning": "the reason why... is because...", "example": "他之所以进步快，是因为每天都练习。", "examplePinyin": "tā zhī suǒ yǐ jìn bù kuài, shì yīn wèi měi tiān dōu liàn xí."}, {"pattern": "不管……都……", "pinyin": "bù guǎn... dōu...", "meaning": "regardless of...", "example": "不管多忙，我都要吃早饭。", "examplePinyin": "bù guǎn duō máng, wǒ dōu yào chī zǎo fàn."}, {"pattern": "哪怕……也……", "pinyin": "nǎ pà... yě...", "meaning": "even if...", "example": "哪怕只有十分钟，我也会复习。", "examplePinyin": "nǎ pà zhǐ yǒu shí fēn zhōng, wǒ yě huì fù xí."}, {"pattern": "尽管……可是……", "pinyin": "jǐn guǎn... kě shì...", "meaning": "although... nevertheless...", "example": "尽管任务很难，可是大家没有放弃。", "examplePinyin": "jǐn guǎn rèn wu hěn nán, kě shì dà jiā méi yǒu fàng qì."}, {"pattern": "不论……还是……都……", "pinyin": "bù lùn... hái shì... dōu...", "meaning": "whether... or...", "example": "不论晴天还是雨天，他都跑步。", "examplePinyin": "bù lùn qíng tiān hái shì yǔ tiān, tā dōu pǎo bù."}, {"pattern": "一旦……就……", "pinyin": "yí dàn... jiù...", "meaning": "once... then...", "example": "一旦决定了，就不要轻易改变。", "examplePinyin": "yí dàn jué dìng le, jiù bú yào qīng yì gǎi biàn."}, {"pattern": "直到……才……", "pinyin": "zhí dào... cái...", "meaning": "not until...", "example": "直到晚上十二点，他才写完报告。", "examplePinyin": "zhí dào wǎn shang shí èr diǎn, tā cái xiě wán bào gào."}, {"pattern": "自从……以来……", "pinyin": "zì cóng... yǐ lái...", "meaning": "since...", "example": "自从来北京以来，我认识了很多朋友。", "examplePinyin": "zì cóng lái běi jīng yǐ lái, wǒ rèn shi le hěn duō péng you."}, {"pattern": "随着……", "pinyin": "suí zhe...", "meaning": "as/along with...", "example": "随着科技的发展，生活变得更方便了。", "examplePinyin": "suí zhe kē jì de fā zhǎn, shēng huó biàn de gèng fāng biàn le."}, {"pattern": "对于……来说……", "pinyin": "duì yú... lái shuō...", "meaning": "as far as... is concerned", "example": "对于初学者来说，发音很重要。", "examplePinyin": "duì yú chū xué zhě lái shuō, fā yīn hěn zhòng yào."}, {"pattern": "在……看来……", "pinyin": "zài... kàn lái...", "meaning": "in someone's view", "example": "在我看来，这个计划很实际。", "examplePinyin": "zài wǒ kàn lái, zhè ge jì huà hěn shí jì."}, {"pattern": "根据……", "pinyin": "gēn jù...", "meaning": "according to...", "example": "根据调查，大多数学生喜欢这种方法。", "examplePinyin": "gēn jù diào chá, dà duō shù xué sheng xǐ huan zhè zhǒng fāng fǎ."}, {"pattern": "通过……", "pinyin": "tōng guò...", "meaning": "through/by means of...", "example": "通过每天练习，她的口语进步很快。", "examplePinyin": "tōng guò měi tiān liàn xí, tā de kǒu yǔ jìn bù hěn kuài."}, {"pattern": "为了……", "pinyin": "wèi le...", "meaning": "in order to...", "example": "为了提高听力，我每天听中文播客。", "examplePinyin": "wèi le tí gāo tīng lì, wǒ měi tiān tīng zhōng wén bō kè."}, {"pattern": "以便……", "pinyin": "yǐ biàn...", "meaning": "so that / in order to...", "example": "请写清楚一点，以便大家理解。", "examplePinyin": "qǐng xiě qīng chu yì diǎn, yǐ biàn dà jiā lǐ jiě."}, {"pattern": "以免……", "pinyin": "yǐ miǎn...", "meaning": "so as to avoid...", "example": "早点出门，以免迟到。", "examplePinyin": "zǎo diǎn chū mén, yǐ miǎn chí dào."}, {"pattern": "甚至……", "pinyin": "shèn zhì...", "meaning": "even / to the extent that...", "example": "他忙得甚至忘了吃饭。", "examplePinyin": "tā máng de shèn zhì wàng le chī fàn."}, {"pattern": "反而……", "pinyin": "fǎn ér...", "meaning": "instead / contrary to expectation", "example": "我以为会很难，做起来反而很简单。", "examplePinyin": "wǒ yǐ wéi huì hěn nán, zuò qǐ lái fǎn ér hěn jiǎn dān."}, {"pattern": "毕竟……", "pinyin": "bì jìng...", "meaning": "after all...", "example": "别对自己要求太高，毕竟你才刚开始。", "examplePinyin": "bié duì zì jǐ yāo qiú tài gāo, bì jìng nǐ cái gāng kāi shǐ."}, {"pattern": "难怪……", "pinyin": "nán guài...", "meaning": "no wonder...", "example": "难怪他中文这么好，原来他在中国住了十年。", "examplePinyin": "nán guài tā zhōng wén zhè me hǎo, yuán lái tā zài zhōng guó zhù le shí nián."}, {"pattern": "看来……", "pinyin": "kàn lái...", "meaning": "it seems / apparently...", "example": "看来今天要下雨了。", "examplePinyin": "kàn lái jīn tiān yào xià yǔ le."}, {"pattern": "可见……", "pinyin": "kě jiàn...", "meaning": "it can be seen that...", "example": "他每天都复习，可见他很重视这次考试。", "examplePinyin": "tā měi tiān dōu fù xí, kě jiàn tā hěn zhòng shì zhè cì kǎo shì."}, {"pattern": "值得……", "pinyin": "zhí de...", "meaning": "be worth...", "example": "这本书值得再读一遍。", "examplePinyin": "zhè běn shū zhí de zài dú yí biàn."}, {"pattern": "不得不……", "pinyin": "bù dé bù...", "meaning": "have no choice but to...", "example": "因为航班取消了，我们不得不改计划。", "examplePinyin": "yīn wèi háng bān qǔ xiāo le, wǒ men bù dé bù gǎi jì huà."}, {"pattern": "未必……", "pinyin": "wèi bì...", "meaning": "not necessarily...", "example": "贵的东西未必适合你。", "examplePinyin": "guì de dōng xi wèi bì shì hé nǐ."}];

const advancedReadings = [{"title": "城市生活与传统文化", "pinyin": "chéng shì shēng huó yǔ chuán tǒng wén huà", "text": "随着城市的发展，越来越多的年轻人开始重新关注传统文化。茶文化、书法和传统服装逐渐成为现代生活的一部分。", "meaning": "As cities develop, more young people are rediscovering traditional culture. Tea culture, calligraphy and traditional clothing are gradually becoming part of modern life."}, {"title": "人工智能改变生活", "pinyin": "rén gōng zhì néng gǎi biàn shēng huó", "text": "近年来，人工智能发展迅速。它不仅改变了人们的工作方式，也影响了学习、交通和医疗等领域。", "meaning": "In recent years, AI has developed rapidly, changing how people work and affecting education, transport and healthcare."}, {"title": "年轻人的消费观", "pinyin": "nián qīng rén de xiāo fèi guān", "text": "现在的年轻人在消费时越来越重视体验和品质。他们愿意为喜欢的事物花钱，同时也更关注性价比。", "meaning": "Young people increasingly value experience and quality when spending, while also paying attention to value for money."}, {"title": "北京的四季", "pinyin": "běi jīng de sì jì", "text": "北京四季分明。春天风大，夏天炎热，秋天天气凉爽，而冬天常常寒冷干燥。", "meaning": "Beijing has four distinct seasons: windy springs, hot summers, cool autumns, and cold, dry winters."}, {"title": "网络学习的新趋势", "pinyin": "wǎng luò xué xí de xīn qū shì", "text": "网络课程让学习变得更加灵活。学生可以根据自己的时间安排课程，也能接触到来自不同地区的老师。", "meaning": "Online courses make learning more flexible and give students access to teachers from different places."}, {"title": "健康生活从小事开始", "pinyin": "jiàn kāng shēng huó cóng xiǎo shì kāi shǐ", "text": "保持健康并不一定需要复杂的方法。规律睡眠、适量运动和均衡饮食都是重要的生活习惯。", "meaning": "Staying healthy does not require complicated methods; regular sleep, exercise and balanced meals all matter."}, {"title": "旅行让我们看见不同的世界", "pinyin": "lǚ xíng ràng wǒ men kàn jiàn bù tóng de shì jiè", "text": "旅行不仅能让人放松，还能帮助我们了解不同地区的文化、历史和生活方式。", "meaning": "Travel can be relaxing while helping us understand the culture, history and lifestyles of different places."}, {"title": "共享单车与城市交通", "pinyin": "gòng xiǎng dān chē yǔ chéng shì jiāo tōng", "text": "共享单车为短距离出行提供了方便，也鼓励更多人选择环保的交通方式。", "meaning": "Shared bicycles make short trips convenient and encourage environmentally friendly transport."}, {"title": "中国茶文化", "pinyin": "zhōng guó chá wén huà", "text": "在中国，喝茶不仅是一种生活习惯，也包含着丰富的文化意义。不同地区有不同的茶叶和饮茶方式。", "meaning": "In China, tea drinking is both a daily habit and a rich cultural tradition, with regional varieties and customs."}, {"title": "社交媒体与沟通", "pinyin": "shè jiāo méi tǐ yǔ gōu tōng", "text": "社交媒体让人与人之间的联系更加方便，但过度使用也可能影响注意力和面对面的交流。", "meaning": "Social media makes communication easier, but excessive use can affect attention and face-to-face interaction."}, {"title": "大学生如何管理时间", "pinyin": "dà xué shēng rú hé guǎn lǐ shí jiān", "text": "大学生活比较自由，因此时间管理非常重要。提前安排任务可以减少压力，也能提高学习效率。", "meaning": "University life is flexible, so planning tasks in advance can reduce stress and improve study efficiency."}, {"title": "保护环境从日常做起", "pinyin": "bǎo hù huán jìng cóng rì cháng zuò qǐ", "text": "环保并不是遥远的话题。少用一次性用品、节约用水和乘坐公共交通都能产生积极影响。", "meaning": "Environmental protection starts with daily choices such as reducing disposable products, saving water and using public transport."}];

const advancedIdioms = [{"idiom": "画蛇添足", "pinyin": "huà shé tiān zú", "meaning": "to ruin something by adding unnecessary details", "example": "这份设计已经很好了，再加太多东西反而是画蛇添足。"}, {"idiom": "一举两得", "pinyin": "yì jǔ liǎng dé", "meaning": "to achieve two goals with one action", "example": "骑自行车既能锻炼又能省钱，真是一举两得。"}, {"idiom": "井井有条", "pinyin": "jǐng jǐng yǒu tiáo", "meaning": "neat and well organized", "example": "她把项目安排得井井有条。"}, {"idiom": "全力以赴", "pinyin": "quán lì yǐ fù", "meaning": "to give it your all", "example": "为了这次比赛，我们会全力以赴。"}, {"idiom": "坚持不懈", "pinyin": "jiān chí bú xiè", "meaning": "to persevere without giving up", "example": "学习语言需要坚持不懈。"}, {"idiom": "熟能生巧", "pinyin": "shú néng shēng qiǎo", "meaning": "practice makes perfect", "example": "多练习汉字，熟能生巧。"}, {"idiom": "入乡随俗", "pinyin": "rù xiāng suí sú", "meaning": "when in Rome, do as the Romans do", "example": "来到新的国家生活，要学会入乡随俗。"}, {"idiom": "百闻不如一见", "pinyin": "bǎi wén bù rú yí jiàn", "meaning": "seeing once is better than hearing a hundred times", "example": "大家都说长城壮观，真是百闻不如一见。"}, {"idiom": "自相矛盾", "pinyin": "zì xiāng máo dùn", "meaning": "to contradict oneself", "example": "他的两个解释自相矛盾。"}, {"idiom": "亡羊补牢", "pinyin": "wáng yáng bǔ láo", "meaning": "better late than never; fix a problem after a loss", "example": "现在开始复习还不晚，亡羊补牢也有用。"}, {"idiom": "守株待兔", "pinyin": "shǒu zhū dài tù", "meaning": "to wait passively for luck", "example": "成功不能靠守株待兔。"}, {"idiom": "刻舟求剑", "pinyin": "kè zhōu qiú jiàn", "meaning": "to use an outdated method despite changed circumstances", "example": "时代已经变了，不能再刻舟求剑。"}, {"idiom": "掩耳盗铃", "pinyin": "yǎn ěr dào líng", "meaning": "to deceive oneself", "example": "不看成绩并不能解决问题，这只是掩耳盗铃。"}, {"idiom": "对牛弹琴", "pinyin": "duì niú tán qín", "meaning": "to address the wrong audience", "example": "跟完全不感兴趣的人讲这个话题，简直是对牛弹琴。"}, {"idiom": "杯弓蛇影", "pinyin": "bēi gōng shé yǐng", "meaning": "to be frightened by imaginary fears", "example": "事情没那么严重，别杯弓蛇影。"}, {"idiom": "狐假虎威", "pinyin": "hú jiǎ hǔ wēi", "meaning": "to bully others by relying on someone powerful", "example": "他只是狐假虎威，并没有真正的权力。"}, {"idiom": "滥竽充数", "pinyin": "làn yú chōng shù", "meaning": "to pass oneself off as competent", "example": "团队合作不能滥竽充数，每个人都要负责。"}, {"idiom": "塞翁失马", "pinyin": "sài wēng shī mǎ", "meaning": "a setback may turn into a blessing", "example": "虽然没拿到那个机会，但塞翁失马，焉知非福。"}, {"idiom": "叶公好龙", "pinyin": "yè gōng hào lóng", "meaning": "to claim to like something but fear the real thing", "example": "他说喜欢冒险，真的要去时却退缩了，真是叶公好龙。"}, {"idiom": "愚公移山", "pinyin": "yú gōng yí shān", "meaning": "determination can overcome great difficulties", "example": "只要有愚公移山的精神，再难的目标也能慢慢实现。"}, {"idiom": "胸有成竹", "pinyin": "xiōng yǒu chéng zhú", "meaning": "to have a well-thought-out plan", "example": "她准备得很充分，上台前已经胸有成竹。"}, {"idiom": "雪中送炭", "pinyin": "xuě zhōng sòng tàn", "meaning": "to offer help when it is most needed", "example": "我最困难的时候他来帮忙，真是雪中送炭。"}, {"idiom": "锦上添花", "pinyin": "jǐn shàng tiān huā", "meaning": "to make something good even better", "example": "这个小动画让网站锦上添花。"}, {"idiom": "一目了然", "pinyin": "yí mù liǎo rán", "meaning": "clear at a glance", "example": "这个图表很简单，数据一目了然。"}, {"idiom": "一心一意", "pinyin": "yì xīn yí yì", "meaning": "wholeheartedly; with full attention", "example": "学习的时候要一心一意。"}, {"idiom": "三心二意", "pinyin": "sān xīn èr yì", "meaning": "half-hearted; indecisive", "example": "做决定时不要三心二意。"}, {"idiom": "四面八方", "pinyin": "sì miàn bā fāng", "meaning": "from all directions", "example": "游客从四面八方来到北京。"}, {"idiom": "五花八门", "pinyin": "wǔ huā bā mén", "meaning": "all kinds of; a great variety", "example": "网上的学习方法五花八门。"}, {"idiom": "七上八下", "pinyin": "qī shàng bā xià", "meaning": "very nervous or unsettled", "example": "等考试结果时，我心里七上八下。"}, {"idiom": "九牛一毛", "pinyin": "jiǔ niú yì máo", "meaning": "a tiny amount compared with the whole", "example": "这点费用对大项目来说只是九牛一毛。"}, {"idiom": "十全十美", "pinyin": "shí quán shí měi", "meaning": "perfect in every way", "example": "世界上很少有十全十美的计划。"}, {"idiom": "不可思议", "pinyin": "bù kě sī yì", "meaning": "unbelievable; incredible", "example": "她三个月就进步这么多，真不可思议。"}, {"idiom": "理所当然", "pinyin": "lǐ suǒ dāng rán", "meaning": "as a matter of course", "example": "别把别人的帮助看成理所当然。"}, {"idiom": "不知不觉", "pinyin": "bù zhī bù jué", "meaning": "without realizing it", "example": "不知不觉，我已经学了两个小时。"}, {"idiom": "大吃一惊", "pinyin": "dà chī yì jīng", "meaning": "to be greatly surprised", "example": "听到这个消息，我大吃一惊。"}, {"idiom": "得心应手", "pinyin": "dé xīn yìng shǒu", "meaning": "to handle something with ease", "example": "练习久了，她使用这个软件越来越得心应手。"}, {"idiom": "恍然大悟", "pinyin": "huǎng rán dà wù", "meaning": "to suddenly understand", "example": "老师解释以后，我才恍然大悟。"}, {"idiom": "脚踏实地", "pinyin": "jiǎo tà shí dì", "meaning": "down-to-earth and practical", "example": "学习要脚踏实地，不能只追求速度。"}, {"idiom": "聚精会神", "pinyin": "jù jīng huì shén", "meaning": "to concentrate fully", "example": "上课时大家都聚精会神地听讲。"}, {"idiom": "名副其实", "pinyin": "míng fù qí shí", "meaning": "to live up to one's name", "example": "这家店的面真的很好吃，名副其实。"}, {"idiom": "迫不及待", "pinyin": "pò bù jí dài", "meaning": "unable to wait; eager", "example": "我迫不及待地想看看最后的网页。"}, {"idiom": "轻而易举", "pinyin": "qīng ér yì jǔ", "meaning": "easy to accomplish", "example": "对他来说，这道题轻而易举。"}, {"idiom": "取长补短", "pinyin": "qǔ cháng bǔ duǎn", "meaning": "to learn from others' strengths and offset weaknesses", "example": "小组成员应该互相学习，取长补短。"}, {"idiom": "日新月异", "pinyin": "rì xīn yuè yì", "meaning": "changing rapidly with each passing day", "example": "科技的发展日新月异。"}, {"idiom": "实事求是", "pinyin": "shí shì qiú shì", "meaning": "to seek truth from facts", "example": "做研究应该实事求是。"}, {"idiom": "随机应变", "pinyin": "suí jī yìng biàn", "meaning": "to adapt to changing circumstances", "example": "旅行中遇到变化要学会随机应变。"}, {"idiom": "无论如何", "pinyin": "wú lùn rú hé", "meaning": "in any case; no matter what", "example": "无论如何，我都会按时完成任务。"}, {"idiom": "心满意足", "pinyin": "xīn mǎn yì zú", "meaning": "fully satisfied", "example": "看到最终成果，大家都心满意足。"}, {"idiom": "异口同声", "pinyin": "yì kǒu tóng shēng", "meaning": "to say the same thing in unison", "example": "老师问大家喜不喜欢这个活动，同学们异口同声地说喜欢。"}, {"idiom": "有条不紊", "pinyin": "yǒu tiáo bù wěn", "meaning": "methodical and orderly", "example": "即使很忙，她还是有条不紊地处理工作。"}];

function makeAdvancedLibrary(items, type) {
    return `<div class="grammar-library">${items.map((item, index) => {
        const title = type === "reading" ? item.title : item.idiom;
        const detail = type === "reading"
            ? `<p class="grammar-example">${item.text}</p><p><strong>English:</strong> ${item.meaning}</p>`
            : `<p><strong>Meaning:</strong> ${item.meaning}</p><p class="grammar-example">${item.example}</p>`;
        return `<details class="grammar-item" ${index === 0 ? "open" : ""}>
            <summary><span class="grammar-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${title}</strong><small>${item.pinyin}</small></span></summary>
            <div class="grammar-detail">${detail}</div>
        </details>`;
    }).join("")}</div>`;
}

$("#readArticleBtn")?.addEventListener("click", (event) => {
    event.stopPropagation();
    openModal("READING LIBRARY · 12", "高级阅读", makeAdvancedLibrary(advancedReadings, "reading"), "Done", null);
});

$$('.clickable-card[data-popup]').forEach((card) => {
    card.addEventListener("click", () => {
        if (card.dataset.popup === "grammar") {
            const grammarHTML = `<div class="grammar-library">${advancedGrammarPatterns.map((item, index) => `
                <details class="grammar-item" ${index === 0 ? "open" : ""}>
                    <summary><span class="grammar-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${item.pattern}</strong><small>${item.pinyin}</small></span></summary>
                    <div class="grammar-detail"><p><strong>Meaning:</strong> ${item.meaning}</p><p class="grammar-example">${item.example}<br><small>${item.examplePinyin}</small></p></div>
                </details>`).join("")}</div>`;
            openModal("GRAMMAR LIBRARY · 50", "高级语法库", grammarHTML, "Done", null);
        } else if (card.dataset.popup === "reading") {
            openModal("READING LIBRARY · 12", "高级阅读", makeAdvancedLibrary(advancedReadings, "reading"), "Done", null);
        } else if (card.dataset.popup === "idiom") {
            openModal("IDIOM LIBRARY · 50", "成语库", makeAdvancedLibrary(advancedIdioms, "idiom"), "Done", null);
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
    authForm?.reset();
    setAuthMode("login");
    authOverlay?.classList.remove("hidden");
});

/* =====================================
   MODAL
===================================== */
let modalActionCallback = null;

function openModal(eyebrow, title, body, actionLabel = "Close", callback = null) {
    if ($("#modalEyebrow")) $("#modalEyebrow").textContent = eyebrow;
    if ($("#modalTitle")) $("#modalTitle").textContent = title;
    if ($("#modalBody")) $("#modalBody").innerHTML = body;
    if ($("#modalAction")) $("#modalAction").textContent = actionLabel;
    modalActionCallback = callback;
    appModal?.classList.remove("hidden");
}

function closeModal() {
    appModal?.classList.add("hidden");
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
    if (!user) return;

    updateCurrentDate(); // Sync current date on UI refresh

    const cleanName = user.name || "Learner";
    const initial = cleanName.charAt(0).toUpperCase();

    // Update Header and Page Titles
    if (pageTitle) pageTitle.textContent = `你好, ${cleanName}.`;
    
    // Profile Fields Updates
    if ($("#profileName")) $("#profileName").textContent = cleanName;
    if ($("#profileSummary")) $("#profileSummary").textContent = `Learning Chinese for ${String(user.goal || "Education").toLowerCase()} • ${user.target || "20 min"}/day`;
    if ($("#profileGoal")) $("#profileGoal").textContent = user.goal || "Education";
    if ($("#profileTarget")) $("#profileTarget").textContent = String(user.target || "20 min").replace(" min", " minutes");

    // Avatar Rendering Logic
    const avatarButton = $("#avatarButton");
    const profileAvatarText = $("#profileAvatarText");
    const profileAvatarImg = $("#profileAvatarImg");

    if (user.avatar) {
        if (profileAvatarImg) {
            profileAvatarImg.src = user.avatar;
            profileAvatarImg.classList.remove("hidden");
        }
        if (profileAvatarText) profileAvatarText.classList.add("hidden");

        if (avatarButton) {
            avatarButton.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
        }
    } else {
        if (profileAvatarText) {
            profileAvatarText.textContent = initial;
            profileAvatarText.classList.remove("hidden");
        }
        if (profileAvatarImg) profileAvatarImg.classList.add("hidden");

        if (avatarButton) {
            avatarButton.textContent = initial;
        }
    }

    switchScript(user.script || "Simplified");
    updateHSKLevel(user.level || 1, false);

    // Keep the current page/title in sync after login, signup, or profile edits.
    // In multi-page mode, use the route that matches the current HTML file instead of the URL hash.
    const currentRoute = window.BAMBOO_MULTIPAGE ? (window.__bambooInitialPage || "home") : getRouteFromHash();
    renderRoute(currentRoute, { scroll: false });
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}