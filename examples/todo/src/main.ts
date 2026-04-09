import { schema } from '@topheavy/schema';
import { Database } from '@topheavy/orm';
import {
    createLocalStorageCacheAdapter,
    createLocalStorageStorageAdapter,
} from '@topheavy/orm/localStorage';

// ── Schema ─────────────────────────────────────────────────────────────

const TodoSchema = schema(t => ({
    text: t.str,
    completed: t.bool,
}));

// ── Database setup ─────────────────────────────────────────────────────

const db = new Database(
    createLocalStorageCacheAdapter(),
    createLocalStorageStorageAdapter(),
    { tables: { todos: TodoSchema } },
);

// ── DOM refs ───────────────────────────────────────────────────────────

const input = document.getElementById('input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const list = document.getElementById('list') as HTMLUListElement;
const stats = document.getElementById('stats') as HTMLDivElement;

// ── Render ─────────────────────────────────────────────────────────────

async function render(): Promise<void> {
    const todos = await db.query('todos');

    const total = todos.length;
    const done = todos.filter(t => t.completed).length;
    stats.textContent = total === 0 ? '' : `${done} / ${total} completed`;

    if (total === 0) {
        list.innerHTML = '<li class="empty">No todos yet — add one above.</li>';
        return;
    }

    list.innerHTML = '';
    for (const todo of todos) {
        const li = document.createElement('li');
        if (todo.completed) li.classList.add('done');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', async () => {
            await db.Transaction(todo, t => { t.completed = !t.completed; });
            await render();
        });

        const label = document.createElement('span');
        label.textContent = todo.text;

        const del = document.createElement('button');
        del.className = 'btn-delete';
        del.textContent = 'Delete';
        del.addEventListener('click', async () => {
            await db.delete(todo);
            await render();
        });

        li.append(checkbox, label, del);
        list.appendChild(li);
    }
}

// ── Actions ────────────────────────────────────────────────────────────

async function addTodo(text: string): Promise<void> {
    await db.insert('todos', { text: text.trim(), completed: false });
    await render();
}

// ── Wire up input ──────────────────────────────────────────────────────

input.addEventListener('input', () => {
    addBtn.disabled = input.value.trim().length === 0;
});

input.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && input.value.trim()) {
        await addTodo(input.value);
        input.value = '';
        addBtn.disabled = true;
    }
});

addBtn.addEventListener('click', async () => {
    if (input.value.trim()) {
        await addTodo(input.value);
        input.value = '';
        addBtn.disabled = true;
    }
});

// ── Initial render ─────────────────────────────────────────────────────

render();
