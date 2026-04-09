import { schema } from '../../../packages/topheavy/src/schema/index';
import { Database } from '../../../packages/topheavy/src/orm/index';
import type { WithStoreId } from '../../../packages/topheavy/src/orm/index';
import {
    createLocalStorageCacheAdapter,
    createLocalStorageStorageAdapter,
} from '../../../packages/topheavy/src/orm/localStorage';

// ── Schema ─────────────────────────────────────────────────────────────

const TodoSchema = schema(t => ({
    text: t.str,
    completed: t.bool,
}));

type Todo = typeof TodoSchema.infer;
type TodoItem = WithStoreId<Todo>;

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
        checkbox.addEventListener('change', () => toggle(todo));

        const label = document.createElement('span');
        label.textContent = todo.text;

        const del = document.createElement('button');
        del.className = 'btn-delete';
        del.textContent = 'Delete';
        del.addEventListener('click', () => remove(todo));

        li.append(checkbox, label, del);
        list.appendChild(li);
    }
}

// ── Actions ────────────────────────────────────────────────────────────

async function addTodo(text: string): Promise<void> {
    await db.insert('todos', { text: text.trim(), completed: false });
    await render();
}

async function toggle(todo: TodoItem): Promise<void> {
    await db.Transaction(todo, t => {
        t.completed = !t.completed
    });
    await render();
}

async function remove(todo: TodoItem): Promise<void> {
    await db.delete('todos', todo.$id);
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
