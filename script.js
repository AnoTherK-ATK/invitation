const inputField = document.getElementById('cmd-input');
const outputDiv = document.getElementById('output');
const inputContainer = document.getElementById('input-container');
const promptElement = document.getElementById('cli-prompt');
const monitor = document.getElementById('monitor');

let isTyping = false;
let currentUser = "guest";
let cwd = "~";

const bootTime = Date.now();

let history = JSON.parse(localStorage.getItem('gradHistory') || '[]');
let historyIndex = history.length;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function scrollDown() {
    monitor.scrollTop = monitor.scrollHeight;
}

async function typeLine(text, delay = 20) {
    const newLine = document.createElement('div');
    newLine.className = 'output-line';
    outputDiv.appendChild(newLine);

    let currentText = '';
    for (let i = 0; i < text.length; i++) {
        currentText += text.charAt(i);
        newLine.innerHTML = currentText + '<span class="cursor"></span>';
        scrollDown();
        await sleep(delay);
    }

    newLine.innerHTML = currentText;
}

async function printHTML(html) {
    const newLine = document.createElement('div');
    newLine.className = 'output-line';
    newLine.innerHTML = html;
    outputDiv.appendChild(newLine);
    scrollDown();
    await sleep(50);
}

async function printPre(text) {
    const el = document.createElement('div');
    el.className = 'output-line';
    el.style.whiteSpace = 'pre';
    el.style.fontFamily = 'inherit';
    el.textContent = text;
    outputDiv.appendChild(el);
    scrollDown();
    await sleep(50);
}

async function printPreHTML(html) {
    const el = document.createElement('div');
    el.className = 'output-line';
    el.style.whiteSpace = 'pre';
    el.style.fontFamily = 'inherit';
    el.innerHTML = html;
    outputDiv.appendChild(el);
    scrollDown();
    await sleep(50);
}

function updatePrompt() {
    promptElement.innerText = `${currentUser}@graduation:${cwd}$`;
}

async function catReadme() {
    await typeLine("--- README ---");
    await typeLine("Welcome to K's Graduation System.");
    await typeLine("Type 'help' for the full command list,");
    await typeLine("'ls' to list files, 'cat event_info.txt' for details,");
    await typeLine("and './rsvp.sh' to confirm your attendance.");
}

async function catEventInfo() {
    await typeLine("Accessing database...", 20);
    await sleep(300);
    await typeLine("========================================");
    await typeLine("🎓 K'S GRADUATION CEREMONY 🎓");
    await typeLine("========================================");
    await typeLine("► Date: Wednesday, April 10, 2026");
    await typeLine("► Time: 09:30 AM");
    await typeLine("► Location: University of Information Technology - VNUHCM");
    await printHTML("► <a href=\"https://maps.app.goo.gl/gqBcMwMLGiyS51px6\" target=\"_blank\">Google Maps</a>");
}

async function catSecret() {
    await typeLine("You found the hidden file ;)");
    await typeLine("Thank you for being part of this journey.");
    await typeLine("It means the world to celebrate with you.");
    await typeLine("                              — K");
}

const FS = {
    '~': {
        dirs: ['photos', 'memories'],
        files: {
            'readme.txt': { render: catReadme },
            'event_info.txt': { render: catEventInfo },
            'rsvp.sh': { exec: true, lines: ['#!/bin/bash', '# Run me with: ./rsvp.sh'] },
            '.secret': { hidden: true, render: catSecret },
        },
    },
    '~/photos': {
        dirs: [],
        files: {
            'ceremony.jpg': { lines: ['[image] ceremony.jpg — 4032x3024', 'Cannot display image in terminal ;)'] },
            'campus.jpg': { lines: ['[image] campus.jpg — 4032x3024', 'Cannot display image in terminal ;)'] },
        },
    },
    '~/memories': {
        dirs: [],
        files: {
            'note.txt': { lines: ['Four years. Countless late nights.', 'Worth every second.'] },
            '.diary': { hidden: true, lines: ['Dear diary, today I finally graduated...'] },
        },
    },
};

function changeDir(target) {
    if (!target || target === '~') { cwd = '~'; return true; }
    if (target === '..') {
        if (cwd !== '~') cwd = cwd.substring(0, cwd.lastIndexOf('/')) || '~';
        return true;
    }
    const node = FS[cwd];
    if (node && node.dirs.includes(target)) {
        cwd = cwd === '~' ? `~/${target}` : `${cwd}/${target}`;
        return true;
    }
    return false;
}

function buildCalendar(month, year, now) {
    const names = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    if (isNaN(month) || isNaN(year) || month < 0 || month > 11) return 'cal: invalid date';

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const title = `${names[month]} ${year}`;
    const pad = Math.max(0, Math.floor((20 - title.length) / 2));

    let out = ' '.repeat(pad) + title + '\n';
    out += 'Su Mo Tu We Th Fr Sa\n';

    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push('  ');
    for (let d = 1; d <= daysInMonth; d++) {
        const dd = String(d).padStart(2, ' ');
        const isToday = now && now.getDate() === d && now.getMonth() === month && now.getFullYear() === year;
        const isEvent = month === 3 && year === 2026 && d === 10;
        if (isEvent || isToday) cells.push(`<span class="file-txt">${dd}</span>`);
        else cells.push(dd);
    }

    let line = '';
    for (let i = 0; i < cells.length; i++) {
        line += cells[i] + ' ';
        if ((i + 1) % 7 === 0) { out += line.replace(/\s+$/, '') + '\n'; line = ''; }
    }
    if (line) out += line.replace(/\s+$/, '') + '\n';
    return out;
}

const commands = {
    ls: {
        desc: 'List files in the current directory',
        usage: 'ls [-a]',
        run: async (args) => {
            const showAll = args.slice(1).some(a => a.includes('a'));
            const node = FS[cwd];
            const parts = [];
            if (showAll) parts.push('<span class="file-sh">.</span>', '<span class="file-sh">..</span>');
            node.dirs.forEach(d => parts.push(`<span class="file-sh">${d}/</span>`));
            Object.entries(node.files).forEach(([name, f]) => {
                if (f.hidden && !showAll) return;
                if (f.exec) parts.push(`<span class="file-sh">${name}</span>`);
                else parts.push(`<span class="file-txt">${name}</span>`);
            });
            await printHTML(parts.join('    '));
        },
    },
    cat: {
        desc: "Read a file's content",
        usage: 'cat [filename]',
        run: async (args) => {
            const file = args[1];
            if (!file) { await typeLine('cat: missing file operand'); return; }
            const node = FS[cwd];
            const f = node.files[file];
            if (!f) {
                if (node.dirs.includes(file)) await typeLine(`cat: ${file}: Is a directory`);
                else await typeLine(`cat: ${file}: No such file or directory`);
                return;
            }
            if (f.render) await f.render();
            else for (const line of f.lines) await typeLine(line);
        },
    },
    cd: {
        desc: 'Change the current directory',
        usage: 'cd [dir]',
        run: async (args) => {
            const target = args[1];
            if (!changeDir(target)) await typeLine(`cd: ${target}: No such file or directory`);
            updatePrompt();
        },
    },
    pwd: {
        desc: 'Print the working directory',
        usage: 'pwd',
        run: async () => {
            const path = cwd === '~' ? `/home/${currentUser}` : `/home/${currentUser}/${cwd.slice(2)}`;
            await typeLine(path);
        },
    },
    whoami: {
        desc: 'Print the current user',
        usage: 'whoami',
        run: async () => { await typeLine(currentUser); },
    },
    su: {
        desc: 'Switch user (log in with your name)',
        usage: 'su [username]',
        run: async (args) => {
            const newName = args[1];
            if (!newName) { await typeLine('su: usage: su [username]'); return; }
            currentUser = newName.toLowerCase();
            cwd = '~';
            updatePrompt();
            await typeLine(`Switching user to ${currentUser}... [OK]`);
        },
    },
    echo: {
        desc: 'Print a line of text',
        usage: 'echo [text]',
        run: async (args) => {
            await typeLine(args.slice(1).join(' '));
        },
    },
    date: {
        desc: 'Print the current date and time',
        usage: 'date',
        run: async () => { await typeLine(new Date().toString()); },
    },
    cal: {
        desc: 'Display a calendar',
        usage: 'cal [month] [year]',
        run: async (args) => {
            const now = new Date();
            let month = now.getMonth();
            let year = now.getFullYear();
            if (args[1]) month = parseInt(args[1], 10) - 1;
            if (args[2]) year = parseInt(args[2], 10);
            await printPreHTML(buildCalendar(month, year, now));
        },
    },
    neofetch: {
        desc: 'Show system info with style',
        usage: 'neofetch',
        run: async () => {
            const art = [
                '          _____',
                '         /\\    \\',
                '        /::\\____\\',
                '       /:::/    /',
                '      /:::/    /',
                '     /:::/    /',
                '    /:::/____/',
                '   /::::\\    \\',
                '  /::::::\\____\\________',
                ' /:::/\\:::::::::::\\    \\',
                '/:::/  |:::::::::::\\____\\',
                '\\::/   |::|~~~|~~~~~',
                ' \\/____|::|   |',
                '       |::|   |',
                '       |::|   |',
                '       |::|   |',
                '       |::|   |',
                '       |::|   |',
                '       \\::|   |',
                '        \\:|   |',
                '         \\|___|',
            ];
            const uptimeMs = Date.now() - bootTime;
            const mins = Math.floor(uptimeMs / 60000);
            const secs = Math.floor((uptimeMs % 60000) / 1000);
            const info = [
                `${currentUser}@graduation`,
                '-------------------',
                'OS: Graduation OS (Ubuntu 22.04 LTS)',
                "Host: K's Graduation Ceremony",
                'Kernel: 5.15.0-grad',
                `Uptime: ${mins}m ${secs}s`,
                'Shell: gradsh 1.0',
                'Event: Apr 10, 2026 09:30 AM',
            ];
            const artWidth = Math.max(...art.map(l => l.length));
            let out = '';
            const rows = Math.max(art.length, info.length);
            for (let i = 0; i < rows; i++) {
                out += (art[i] || '').padEnd(artWidth) + '   ' + (info[i] || '') + '\n';
            }
            await printPre(out);
        },
    },
    history: {
        desc: 'Show command history',
        usage: 'history',
        run: async () => {
            if (!history.length) { await typeLine('(no history yet)'); return; }
            let out = '';
            for (let i = 0; i < history.length; i++) {
                out += String(i + 1).padStart(4) + '  ' + history[i] + '\n';
            }
            await printPre(out.replace(/\n$/, ''));
        },
    },
    help: {
        desc: 'List all available commands',
        usage: 'help',
        run: async () => {
            let out = 'Available commands:\n';
            for (const [name, c] of Object.entries(commands)) {
                if (c.hidden) continue;
                out += '  ' + name.padEnd(12) + c.desc + '\n';
            }
            out += '  ' + './rsvp.sh'.padEnd(12) + 'Execute the RSVP script';
            await printPre(out);
        },
    },
    man: {
        desc: 'Show the manual for a command',
        usage: 'man [command]',
        run: async (args) => {
            const name = args[1];
            if (!name) { await typeLine('What manual page do you want?'); return; }
            const c = commands[name];
            if (!c) { await typeLine(`No manual entry for ${name}`); return; }
            await typeLine(`NAME:  ${name}`);
            await typeLine(`USAGE: ${c.usage}`);
            await typeLine(`DESC:  ${c.desc}`);
        },
    },
    sudo: {
        desc: 'Execute a command as superuser',
        usage: 'sudo [command]',
        run: async () => {
            await typeLine(`${currentUser} is not in the sudoers file. This incident will be reported. ;)`);
        },
    },
    congrats: {
        desc: 'Celebrate!',
        usage: 'congrats',
        hidden: true,
        run: async () => {
            const banner = [
                " _  __     ____    _    ",
                "| |/ /    |  _ \\  / \\   ",
                "| ' /_____| | | |/ _ \\  ",
                "| . \\_____| |_| / ___ \\ ",
                "|_|\\_\\    |____/_/   \\_\\",

            ];
            await printPre(banner.join('\n'));
            await typeLine('Congratulations, Class of 2026! 🎓');
        },
    },
    clear: {
        desc: 'Clear the terminal screen',
        usage: 'clear',
        run: async () => { outputDiv.innerHTML = ''; },
    },
};

async function runRsvp() {
    await typeLine("Generating RSVP token...", 30);
    await sleep(400);

    // Tạo đoạn mã JavaScript để thay đổi giao diện DOM
    const jsPayload = `document.body.innerHTML = '<div style="display:flex; height:100vh; width:100vw; background:#000; color:#0f0; justify-content:center; align-items:center; font-family:Consolas, Courier New, monospace; flex-direction:column; text-align:center; box-sizing:border-box; padding:20px; text-shadow: 0 0 10px #0f0;"><h1>[ RSVP CONFIRMED ]</h1><p>System updated. Thank you for accepting the invitation, ${currentUser}!</p><p style="font-size:50px; margin-top:20px;">🎓🎉</p></div>'; console.log('RSVP SUCCESS!');`;

    try {
        // Gọi API để copy vào clipboard
        await navigator.clipboard.writeText(jsPayload);
        await typeLine(`✅ SUCCESS: Confirmation script generated for ${currentUser}!`);
        await typeLine("The script has been copied to your clipboard.");
        await typeLine(" ");
        await typeLine("--- HOW TO EXECUTE ---");
        await typeLine("1. Press F12 to open the Developer Tools (or right-click -> Inspect).");
        await typeLine("2. Navigate to the 'Console' tab.");
        await typeLine("3. Paste the code (Ctrl+V / Cmd+V) and press Enter.");
        await typeLine("Waiting for execution...");
    } catch (err) {
        // Dự phòng nếu trình duyệt chặn quyền copy
        await typeLine("❌ ERROR: Clipboard permission denied.");
        await typeLine("Please manually copy the following code, then paste it in your browser Console (F12):");
        await printHTML(`<span style="color:#aaa;">${jsPayload}</span>`);
    }
}

async function bootSequence() {
    isTyping = true;
    inputContainer.classList.add('hidden');

    await typeLine("Ubuntu 22.04 LTS graduation tty1", 10);
    await typeLine("Booting system... [OK]", 30);
    await typeLine("Mounting file systems... [OK]", 30);
    await typeLine("Starting Invitation Service... [OK]", 30);
    await printHTML("<br>");
    await typeLine("Welcome to Graduation OS!", 30);
    await typeLine("Type 'help' to see commands, or 'ls' to list files.", 30);

    inputContainer.classList.remove('hidden');
    inputField.focus();
    isTyping = false;
}

inputField.addEventListener('keydown', async function (event) {

    if (event.key === 'ArrowUp' && !isTyping) {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            inputField.value = history[historyIndex];
        }
        return;
    }

    if (event.key === 'ArrowDown' && !isTyping) {
        event.preventDefault();
        if (historyIndex < history.length - 1) {
            historyIndex++;
            inputField.value = history[historyIndex];
        } else {
            historyIndex = history.length;
            inputField.value = '';
        }
        return;
    }

    if (event.key === 'Tab' && !isTyping) {
        event.preventDefault();

        const value = inputField.value;
        if (!value.trim()) return;

        const words = value.split(' ');
        const lastWord = words[words.length - 1].toLowerCase();
        if (lastWord === '') return;

        const node = FS[cwd];
        const fileNames = [...node.dirs, ...Object.keys(node.files).filter(f => !node.files[f].hidden)];
        const cmdNames = [...Object.keys(commands).filter(k => !commands[k].hidden), './rsvp.sh'];
        const pool = words.length === 1 ? [...cmdNames, ...fileNames] : fileNames;
        const matches = pool.filter(item => item.startsWith(lastWord));

        if (matches.length === 1) {
            if (words.length === 1) {
                const m = matches[0];
                const isFile = fileNames.includes(m);
                inputField.value = m + (isFile ? '' : ' ');
            } else {
                words[words.length - 1] = matches[0];
                inputField.value = words.join(' ');
            }
        }
        return;
    }

    if (event.key === 'Enter' && !isTyping) {
        const rawCommand = inputField.value.trim();
        inputField.value = '';

        if (rawCommand) {
            history.push(rawCommand);
            localStorage.setItem('gradHistory', JSON.stringify(history));
        }
        historyIndex = history.length;

        isTyping = true;
        inputContainer.classList.add('hidden');

        await printHTML(`<span class="prompt">${promptElement.innerText}</span> ${rawCommand}`);

        const args = rawCommand.split(/\s+/);
        const cmd = args[0].toLowerCase();

        if (commands[cmd]) {
            await commands[cmd].run(args);
        } else if (cmd === './rsvp.sh' || ((cmd === 'bash' || cmd === 'sh') && args[1] === 'rsvp.sh')) {
            await runRsvp();
        } else if (cmd !== '') {
            await typeLine(`${cmd}: command not found`);
        }

        isTyping = false;
        inputContainer.classList.remove('hidden');
        inputField.focus();
    }
});

monitor.addEventListener('click', () => {
    if (!isTyping) inputField.focus();
});

bootSequence();
