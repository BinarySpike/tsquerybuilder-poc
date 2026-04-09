import { schema } from '../../../packages/topheavy/src/schema/index';
import { Database } from '../../../packages/topheavy/src/orm/index';
import {
    createLocalStorageCacheAdapter,
    createLocalStorageStorageAdapter,
} from '../../../packages/topheavy/src/orm/localStorage';

// ── Schema ─────────────────────────────────────────────────────────────

const TodoSchema = schema(t => ({
    id: t.number(),
    text: t.string(),
    completed: t.boolean(),
}));

type Todo = typeof TodoSchema.infer;

// ── Database setup ─────────────────────────────────────────────────────

const cache = createLocalStorageCacheAdapter();
const store = createLocalStorageStorageAdapter();
const db = new Database(cache, store, { tables: { todos: TodoSchema } });

// ── DOM refs ───────────────────────────────────────────────────────────

const input = document.getElementById('input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const list = document.getElementById('list') as HTMLUListElement;
const stats = document.getElementById('stats') as HTMLDivElement;

// ── Auto-increment ID stored in localStorage ───────────────────────────

function nextId(): number {
    const key = 'topheavy:todos:nextId';
    const id = Number(localStorage.getItem(key) ?? '1');
    localStorage.setItem(key, String(id + 1));
    return id;
}

// ── Render ─────────────────────────────────────────────────────────────

async function render(): Promise<void> {
    const todos = await db.query('todos').where('id').greaterThan(0) as Todo[];

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
    const todo: Todo = { id: nextId(), text: text.trim(), completed: false };
    await store.insert('todos', todo);
    await render();
}

async function toggle(todo: Todo): Promise<void> {
    const results = await db.query('todos').where('id').is(todo.id);
    await db.Transaction(results, rows => {
        rows[0].completed = !rows[0].completed;
    });
    await render();
}

async function remove(todo: Todo): Promise<void> {
    // Find the internal store key ($id) by querying the store directly
    const allEntries = await store.find('todos', { conditions: [[['id', 'is', todo.id]]], select: '*' });
    const entry = allEntries[0] as any;
    if (entry?.$id !== undefined) {
        await store.delete('todos', entry.$id);
        await cache.clear('todos');
    }
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
