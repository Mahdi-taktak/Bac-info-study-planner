const SUPABASE_URL = "https://axesulfaweyagvzpfgjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_6Nh30bKyd3FTG--ZGFSMbg_4HthXQQt";

const sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const days = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
];

const times = [
    '06:00–07:00',
    '07:00–08:00',
    '08:00–09:00',
    '09:00–10:00',
    '10:00–11:00',
    '11:00–12:00',
    '12:00–13:00',
    '13:00–14:00',
    '14:00–15:00',
    '15:00–16:00',
    '16:00–17:00',
    '17:00–18:00',
    '18:00–19:00',
    '19:00–20:00',
    '20:00–21:00',
    '21:00–22:00',
    '22:00–23:00',
    '23:00–23:30'
];

const defaultSchedule = {};

let schedule =
    JSON.parse(
        localStorage.getItem('bacSchedule') || 'null'
    ) || defaultSchedule;

let tasks =
    JSON.parse(
        localStorage.getItem('bacTasks') || '[]'
    );

let fun =
    JSON.parse(
        localStorage.getItem('bacFun') || '[]'
    );

let sessions =
    Number(
        localStorage.getItem('bacSessions') || 0
    );

let filter = 'all';

let timerInterval = null;

let remaining = 25 * 60;

let mode = 'focus';

let running = false;


// ==============================
// SAVE
// ==============================

function save(){

    localStorage.setItem(
        'bacSchedule',
        JSON.stringify(schedule)
    );

    localStorage.setItem(
        'bacTasks',
        JSON.stringify(tasks)
    );

    localStorage.setItem(
        'bacFun',
        JSON.stringify(fun)
    );

    localStorage.setItem(
        'bacSessions',
        sessions
    );

    localStorage.setItem(
        'bacNotes',
        document.getElementById('notes').value
    );

    updateStats();
}


// ==============================
// SECURITY
// ==============================

function esc(s){

    return String(s).replace(
        /[&<>"']/g,

        c => ({
            '&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;',
            "'":'&#39;'
        }[c])
    );

}


// ==============================
// SUBJECT CLASS
// ==============================

function classFor(s){

    s = s.toLowerCase();

    if(s.includes('math'))
        return 'math';

    if(
        s.includes('python') ||
        s.includes('algo')
    )
        return 'algo';

    if(
        s.includes('sti') ||
        s.includes('technologie')
    )
        return 'sti';

    if(
        s.includes('anglais') ||
        s.includes('français') ||
        s.includes('arabe') ||
        s.includes('espagnol') ||
        s.includes('philo')
    )
        return 'lang';

    if(s.includes('sport'))
        return 'sport';

    return 'other';
}


// ==============================
// EMPLOI DU TEMPS
// ==============================

function renderSchedule(){

    let h =
        '<thead><tr><th>Heure</th>';

    h += days
        .map(d => `<th>${d}</th>`)
        .join('');

    h += '</tr></thead><tbody>';

    times.forEach((t,i)=>{

        h += `
            <tr>
                <td class="time">
                    ${t}
                </td>
        `;

        days.forEach((d,j)=>{

            const key = j + '-' + i;

            const value = schedule[key] || '';

            h += `
                <td
                    class="slot ${value ? classFor(value) : ''}"
                    onclick="editSlot('${key}')"
                    title="Cliquer pour modifier"
                >
                    ${
                        value
                        ?
                        `<div class="subject">
                            ${esc(value)}
                        </div>`
                        :
                        '<span style="opacity:.25">＋</span>'
                    }
                </td>
            `;

        });

        h += '</tr>';

    });

    h += '</tbody>';

    document.getElementById(
        'timetable'
    ).innerHTML = h;
}


// ==============================
// EDIT SCHEDULE
// ==============================

function editSlot(key){

    const old =
        schedule[key] || '';

    const value =
        prompt(
            'Matière ou activité (laisser vide pour effacer) :',
            old
        );

    if(value === null)
        return;

    if(value.trim())
        schedule[key] = value.trim();

    else
        delete schedule[key];

    save();

    renderSchedule();
}


// ==============================
// RESET SCHEDULE
// ==============================

function resetSchedule(){

    if(
        confirm(
            'Effacer toutes les cases de ton emploi du temps ?'
        )
    ){

        schedule = {};

        save();

        renderSchedule();
    }
}


// ==============================
// TASKS
// ==============================

function renderTasks(){

    const list =
        tasks.filter(
            t =>
                filter === 'all' ||
                (filter === 'done' && t.done) ||
                (filter === 'open' && !t.done)
        );


    document.getElementById('tasks').innerHTML =
        list.length

        ?

        list.map(t => `

            <div class="task ${t.done ? 'done' : ''}">

                <input
                    type="checkbox"
                    ${t.done ? 'checked' : ''}
                    onchange="toggleTask('${t.id}')"
                >

                <div class="task-main">

                    <div class="task-title">
                        ${esc(t.title)}
                    </div>

                    <div class="task-meta">

                        <span class="tag">
                            ${esc(t.subject)}
                        </span>

                        <span class="tag">
                            ${esc(t.date || 'Sans date')}
                        </span>

                        <span class="tag">
                            ${t.minutes} min
                        </span>

                        <span
                            class="tag ${
                                t.priority === 'Haute'
                                ? 'priority'
                                : ''
                            }"
                        >
                            ${esc(t.priority)}
                        </span>

                    </div>

                </div>

                <button
                    class="danger"
                    onclick="deleteTask('${t.id}')"
                >
                    ✕
                </button>

            </div>

        `).join('')

        :

        `
            <div class="empty">
                Aucune tâche dans cette catégorie.
                Ajoute ta première tâche au-dessus ✨
            </div>
        `;

    updateStats();
}


// ==============================
// ADD TASK
// ==============================

document
    .getElementById('taskForm')
    .addEventListener('submit', e => {

        e.preventDefault();

        tasks.unshift({

            id: Date.now().toString(),

            title:
                document
                    .getElementById('taskTitle')
                    .value
                    .trim(),

            subject:
                document.getElementById(
                    'taskSubject'
                ).value,

            priority:
                document.getElementById(
                    'taskPriority'
                ).value,

            date:
                document.getElementById(
                    'taskDate'
                ).value,

            minutes:
                Number(
                    document.getElementById(
                        'taskMinutes'
                    ).value
                ) || 45,

            done:false

        });

        document.getElementById(
            'taskTitle'
        ).value = '';

        save();

        renderTasks();

    });


// ==============================
// COMPLETE TASK
// ==============================

function toggleTask(id){

    const task =
        tasks.find(t => t.id === id);

    if(task)
        task.done = !task.done;

    save();

    renderTasks();
}


// ==============================
// DELETE TASK
// ==============================

function deleteTask(id){

    tasks =
        tasks.filter(
            t => t.id !== id
        );

    save();

    renderTasks();
}


// ==============================
// TASK FILTER
// ==============================

document
    .querySelectorAll('#taskTabs button')
    .forEach(button => {

        button.onclick = () => {

            filter =
                button.dataset.filter;

            document
                .querySelectorAll(
                    '#taskTabs button'
                )
                .forEach(x =>
                    x.classList.toggle(
                        'active',
                        x === button
                    )
                );

            renderTasks();
        };

    });


// ==============================
// STATISTICS
// ==============================

function updateStats(){

    const done =
        tasks.filter(t => t.done).length;

    const total =
        tasks.length;

    document.getElementById(
        'doneStat'
    ).textContent =
        done + '/' + total;


    const progress =
        total
        ? Math.round(done / total * 100)
        : 0;

    document.getElementById(
        'progressStat'
    ).textContent =
        progress + '%';

    document.getElementById(
        'progressBar'
    ).style.width =
        progress + '%';


    document.getElementById(
        'sessionsStat'
    ).textContent =
        sessions;


    const today =
        new Date()
            .toISOString()
            .slice(0,10);

    const todayDone =
        tasks.filter(
            t =>
                t.done &&
                (!t.date || t.date === today)
        ).length;

    document.getElementById(
        'dailyStat'
    ).textContent =
        todayDone + '/3';

}


// ==============================
// POMODORO
// ==============================

function updateClock(){

    const minutes =
        Math.floor(
            remaining / 60
        );

    const seconds =
        remaining % 60;

    document.getElementById(
        'clock'
    ).textContent =
        String(minutes).padStart(2,'0')
        + ':' +
        String(seconds).padStart(2,'0');

}


function toggleTimer(){

    if(running){

        clearInterval(timerInterval);

        running = false;

        document.getElementById(
            'startBtn'
        ).textContent =
            '▶ Démarrer';

        return;
    }


    running = true;

    document.getElementById(
        'startBtn'
    ).textContent =
        '⏸ Pause';


    timerInterval =
        setInterval(() => {

            remaining--;

            updateClock();


            if(remaining <= 0){

                clearInterval(
                    timerInterval
                );

                running = false;

                if(mode === 'focus'){

                    sessions++;

                    localStorage.setItem(
                        'bacSessions',
                        sessions
                    );
                    save();
                    mode = 'break';

                    remaining =
                        Number(
                            document.getElementById(
                                'breakMin'
                            ).value
                        ) * 60;

                    document.getElementById(
                        'timerMode'
                    ).textContent =
                        'PAUSE';

                }
                else{

                    mode = 'focus';

                    remaining =
                        Number(
                            document.getElementById(
                                'focusMin'
                            ).value
                        ) * 60;

                    document.getElementById(
                        'timerMode'
                    ).textContent =
                        'SESSION DE CONCENTRATION';

                }

                document.getElementById(
                    'startBtn'
                ).textContent =
                    '▶ Démarrer';

                updateClock();

                updateStats();
            }

        },1000);

}


function resetTimer(){

    clearInterval(
        timerInterval
    );

    running = false;

    mode = 'focus';

    remaining =
        Number(
            document.getElementById(
                'focusMin'
            ).value
        ) * 60;

    document.getElementById(
        'timerMode'
    ).textContent =
        'SESSION DE CONCENTRATION';

    document.getElementById(
        'startBtn'
    ).textContent =
        '▶ Démarrer';

    updateClock();
}


function switchTimer(){

    clearInterval(
        timerInterval
    );

    running = false;

    mode =
        mode === 'focus'
        ? 'break'
        : 'focus';

    remaining =
        (
            mode === 'focus'
            ?
            Number(
                document.getElementById(
                    'focusMin'
                ).value
            )
            :
            Number(
                document.getElementById(
                    'breakMin'
                ).value
            )
        ) * 60;

    document.getElementById(
        'timerMode'
    ).textContent =
        mode === 'focus'
        ?
        'SESSION DE CONCENTRATION'
        :
        'PAUSE';

    document.getElementById(
        'startBtn'
    ).textContent =
        '▶ Démarrer';

    updateClock();
}


// ==============================
// GOALS
// ==============================

const goalChecks =
    document.querySelectorAll(
        '[data-goal]'
    );

goalChecks.forEach(check => {

    check.checked =
        localStorage.getItem(
            'goal-' + check.dataset.goal
        ) === 'true';

    check.addEventListener(
        'change',
        () => {

            localStorage.setItem(
                'goal-' + check.dataset.goal,
                check.checked
            );

            updateGoals();

        }
    );

});


function updateGoals(){

    const completed =
        [...goalChecks]
            .filter(c => c.checked)
            .length;

    const total =
        goalChecks.length;

    document.getElementById(
        'goalBar'
    ).style.width =
        (completed / total * 100) + '%';

    document.getElementById(
        'goalText'
    ).textContent =
        completed +
        '/' +
        total +
        ' objectifs accomplis';

}


// ==============================
// FREE TIME
// ==============================

function addFun(){

    const activity =
        document.getElementById(
            'funActivity'
        ).value;

    const minutes =
        Number(
            document.getElementById(
                'funTime'
            ).value
        ) || 60;

    fun.push({

        id:Date.now(),

        activity,

        minutes

    });

    save();

    renderFun();
}


function renderFun(){

    const container =
        document.getElementById(
            'funList'
        );

    if(!fun.length){

        container.innerHTML =
            `
                <div class="empty">
                    Aucun moment de détente ajouté.
                </div>
            `;

        return;
    }


    container.innerHTML =
        fun.map(item => `

            <div class="task">

                <div class="task-main">

                    <div class="task-title">
                        ${esc(item.activity)}
                    </div>

                    <div class="task-meta">

                        <span class="tag">
                            ${item.minutes} minutes
                        </span>

                    </div>

                </div>

                <button
                    class="danger"
                    onclick="deleteFun(${item.id})"
                >
                    ✕
                </button>

            </div>

        `).join('');
}


function deleteFun(id){

    fun =
        fun.filter(
            item => item.id !== id
        );

    save();

    renderFun();
}


// ==============================
// NOTES
// ==============================

const notes =
    document.getElementById(
        'notes'
    );

notes.value =
    localStorage.getItem(
        'bacNotes'
    ) || '';

notes.addEventListener(
    'input',
    save
);


// ==============================
// EXPORT
// ==============================

function exportData(){

    const data = {

        schedule,

        tasks,

        fun,

        sessions,

        notes:notes.value,

        goals:
            [...goalChecks].reduce(
                (obj,check) => {

                    obj[check.dataset.goal] =
                        check.checked;

                    return obj;

                },
                {}
            )

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:'application/json'
            }
        );


    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement('a');

    a.href = url;

    a.download =
        'bac-info-2k27-backup.json';

    a.click();

    URL.revokeObjectURL(url);
}


// ==============================
// DATE
// ==============================

document.getElementById(
    'today'
).textContent =
    new Date().toLocaleDateString(
        'fr-FR',
        {
            weekday:'long',
            year:'numeric',
            month:'long',
            day:'numeric'
        }
    );


/* ===== SUPABASE AUTH + CLOUD SAVE ===== */

let currentUser = null;
let cloudReady = false;
let cloudSaveTimer = null;
let loadingUserId = null;

function getGoals() {
    return [...goalChecks].reduce((obj, check) => {
        obj[check.dataset.goal] = check.checked;
        return obj;
    }, {});
}

function saveLocalData() {
    localStorage.setItem('bacSchedule', JSON.stringify(schedule));
    localStorage.setItem('bacTasks', JSON.stringify(tasks));
    localStorage.setItem('bacFun', JSON.stringify(fun));
    localStorage.setItem('bacSessions', String(sessions));
    localStorage.setItem('bacNotes', notes.value);
    localStorage.setItem('bacGoals', JSON.stringify(getGoals()));
}

async function writeCloudData() {
    if (!currentUser || !cloudReady) return;

    const payload = {
        user_id: currentUser.id,
        schedule,
        tasks,
        fun,
        sessions,
        notes: notes.value,
        goals: getGoals(),
        updated_at: new Date().toISOString()
    };

    const { error } = await sb
        .from('student_data')
        .upsert(payload, { onConflict: 'user_id' });

    if (error) {
        document.getElementById('authMessage').textContent =
            'Erreur de synchronisation : ' + error.message;
    } else {
        document.getElementById('authMessage').textContent =
            'Données synchronisées dans le cloud ✓';
    }
}

/* Cette fonction remplace la fonction save() précédente. */
function save() {
    saveLocalData();
    updateStats();

    if (currentUser && cloudReady) {
        clearTimeout(cloudSaveTimer);
        cloudSaveTimer = setTimeout(writeCloudData, 700);
    }
}

function updateAuthUI() {
    const loggedIn = !!currentUser;

    document.getElementById('authStatus').textContent =
        loggedIn
            ? 'Connecté : ' + currentUser.email
            : 'Non connecté';

    document.getElementById('loginBtn').hidden = loggedIn;
    document.getElementById('signupBtn').hidden = loggedIn;
    document.getElementById('logoutBtn').hidden = !loggedIn;

    document.getElementById('authEmail').disabled = loggedIn;
    document.getElementById('authPassword').disabled = loggedIn;
}

async function loadUserData(user) {
    cloudReady = false;

    const { data, error } = await sb
        .from('student_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (data) {
        schedule = data.schedule || {};
        tasks = Array.isArray(data.tasks) ? data.tasks : [];
        fun = Array.isArray(data.fun) ? data.fun : [];
        sessions = Number(data.sessions) || 0;
        notes.value = data.notes || '';

        const goals = data.goals || {};

        goalChecks.forEach(check => {
            check.checked = !!goals[check.dataset.goal];
        });
    } else {
        // Nouveau compte : données vierges, sans reprendre celles d'un autre compte.
        schedule = {};
        tasks = [];
        fun = [];
        sessions = 0;
        notes.value = '';

        goalChecks.forEach(check => {
            check.checked = false;
        });
    }

    saveLocalData();

    renderSchedule();
    renderTasks();
    renderFun();
    updateGoals();
    updateClock();
    updateStats();

    cloudReady = true;

    document.getElementById('authMessage').textContent = data
        ? 'Tes données ont été chargées ✓'
        : 'Nouveau compte : données vierges ✓';
}

async function handleAuthSession(session) {
    const user = session?.user || null;

    if (!user) {
        currentUser = null;
        cloudReady = false;
        loadingUserId = null;

        schedule = {};
        tasks = [];
        fun = [];
        sessions = 0;
        notes.value = '';

        goalChecks.forEach(check => {
            check.checked = false;
        });

        renderSchedule();
        renderTasks();
        renderFun();
        updateGoals();
        updateClock();
        updateStats();
        updateAuthUI();
        return;
    }

    if (currentUser?.id === user.id && cloudReady) {
        updateAuthUI();
        return;
    }

    if (loadingUserId === user.id) return;

    loadingUserId = user.id;
    currentUser = user;
    cloudReady = false;
    updateAuthUI();

    // Clear previous account data while the new account loads.
    schedule = {};
    tasks = [];
    fun = [];
    sessions = 0;
    notes.value = '';

    goalChecks.forEach(check => {
        check.checked = false;
    });

    renderSchedule();
    renderTasks();
    renderFun();
    updateGoals();
    updateClock();
    updateStats();

    document.getElementById('authMessage').textContent =
        'Chargement de tes données...';

    try {
        await loadUserData(user);
    } catch (error) {
        cloudReady = false;
        document.getElementById('authMessage').textContent =
            'Erreur de chargement : ' + error.message;
    } finally {
        if (loadingUserId === user.id) loadingUserId = null;
    }
}
/* Connexion */
document.getElementById('authForm').addEventListener(
    'submit',
    async event => {
        event.preventDefault();

        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;

        const message = document.getElementById('authMessage');
        message.textContent = 'Connexion...';

        const { error } = await sb.auth.signInWithPassword({
            email,
            password
        });

        message.textContent = error
            ? 'Erreur : ' + error.message
            : 'Connexion réussie...';
    }
);

/* Création de compte */
document.getElementById('signupBtn').addEventListener(
    'click',
    async () => {
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const message = document.getElementById('authMessage');

        if (!email || password.length < 6) {
            message.textContent =
                'Entre un e-mail valide et un mot de passe de 6 caractères minimum.';
            return;
        }

        message.textContent = 'Création du compte...';

        const { data, error } = await sb.auth.signUp({
            email,
            password
        });

        if (error) {
            message.textContent = 'Erreur : ' + error.message;
        } else if (!data.session) {
            message.textContent =
                'Compte créé ! Vérifie ton e-mail pour confirmer ton inscription.';
        } else {
            message.textContent = 'Compte créé avec succès ✓';
        }
    }
);

/* Déconnexion */
document.getElementById('logoutBtn').addEventListener(
    'click',
    async () => {
        const { error } = await sb.auth.signOut();

        document.getElementById('authMessage').textContent = error
            ? 'Erreur : ' + error.message
            : 'Déconnexion réussie.';
    }
);

/* Charger automatiquement la session existante */

sb.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
        if (event === 'PASSWORD_RECOVERY') {
            document.getElementById('resetPasswordPanel').hidden = false;
            document.getElementById('authMessage').textContent =
                'Entre ton nouveau mot de passe.';
        }

        handleAuthSession(session);
    }, 0);
});
/* Synchroniser les cases des objectifs */
goalChecks.forEach(check => {
    check.addEventListener('change', save);
});

/* Mot de passe oublié */
document.getElementById('forgotPasswordBtn').addEventListener(
    'click',
    async () => {
        const email = document.getElementById('authEmail').value.trim();
        const message = document.getElementById('authMessage');

        if (!email) {
            message.textContent =
                'Entre ton adresse e-mail d’abord.';
            return;
        }

        message.textContent = 'Envoi du lien de récupération...';

        const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000'
        });

        message.textContent = error
            ? 'Erreur : ' + error.message
            : 'Vérifie ta boîte e-mail pour le lien de récupération.';
    }
);

document.getElementById('saveNewPasswordBtn').addEventListener(
    'click',
    async () => {
        const password = document.getElementById('newPassword').value;
        const message = document.getElementById('authMessage');

        if (password.length < 6) {
            message.textContent =
                'Le mot de passe doit contenir au moins 6 caractères.';
            return;
        }

        message.textContent = 'Modification en cours...';

        const { error } = await sb.auth.updateUser({
            password: password
        });

        if (error) {
            message.textContent = 'Erreur : ' + error.message;
        } else {
            message.textContent =
                'Mot de passe modifié avec succès !';

            document.getElementById('resetPasswordPanel').hidden = true;
            document.getElementById('newPassword').value = '';
        }
    }
);

// ==============================
// START
// ==============================

renderSchedule();

renderTasks();

renderFun();

updateGoals();

updateClock();

updateStats();
document.getElementById('saveNewPasswordBtn').addEventListener(
    'click',
    async () => {
        const password = document.getElementById('newPassword').value;
        const message = document.getElementById('authMessage');

        if (password.length < 6) {
            message.textContent =
                'Le mot de passe doit contenir au moins 6 caractères.';
            return;
        }

        message.textContent = 'Modification en cours...';

        const { error } = await sb.auth.updateUser({
            password: password
        });

        if (error) {
            message.textContent = 'Erreur : ' + error.message;
        } else {
            message.textContent = 'Mot de passe modifié avec succès !';
            document.getElementById('resetPasswordPanel').hidden = true;
            document.getElementById('newPassword').value = '';
        }
    }
);