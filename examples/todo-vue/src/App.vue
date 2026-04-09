<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { schema } from '@topheavy/schema';
import { Database } from '@topheavy/orm';
import {
    createLocalStorageCacheAdapter,
    createLocalStorageStorageAdapter,
} from '@topheavy/orm/localStorage';
import type { RepositoryItem } from '@topheavy/orm';

// ── Schema ─────────────────────────────────────────────────────────────

const TodoSchema = schema(t => ({
    text: t.str,
    completed: t.bool,
}));

type Todo = RepositoryItem<typeof TodoSchema.infer>;

// ── Database setup ─────────────────────────────────────────────────────

const db = new Database({
    cache: createLocalStorageCacheAdapter(),
    store: createLocalStorageStorageAdapter(),
    tables: { todos: TodoSchema },
});

// ── State ───────────────────────────────────────────────────────────────

const todos = ref<Todo[]>([]);
const inputText = ref('');

const done = computed(() => todos.value.filter(t => t.completed).length);
const total = computed(() => todos.value.length);
const addDisabled = computed(() => inputText.value.trim().length === 0);

// ── Load ────────────────────────────────────────────────────────────────

async function load(): Promise<void> {
    todos.value = await db.query('todos');
}

// ── Actions ─────────────────────────────────────────────────────────────

async function addTodo(): Promise<void> {
    const text = inputText.value.trim();
    if (!text) return;
    await db.insert('todos', { text, completed: false });
    inputText.value = '';
    await load();
}

async function toggleTodo(todo: Todo): Promise<void> {
    await db.Transaction(todo, t => { t.completed = !t.completed; });
    await load();
}

async function deleteTodo(todo: Todo): Promise<void> {
    await db.delete(todo);
    await load();
}

async function onKeydown(e: KeyboardEvent): Promise<void> {
    if (e.key === 'Enter') await addTodo();
}

async function iWin(): Promise<void> {
    await db.Transaction(todos.value, ts => {
        ts.forEach(t => t.completed = true);
    })
}

// ── Init ────────────────────────────────────────────────────────────────

onMounted(load);
</script>

<template>
    <h1>Todo List</h1>
    <p class="subtitle">Persisted via <code>localStorage</code> using topheavy ORM</p>
    <button class="btn-add" @click="iWin">Click to Win</button>

    <div class="add-row">
        <input
            v-model="inputText"
            type="text"
            placeholder="What needs to be done?"
            @keydown="onKeydown"
        />
        <button class="btn-add" :disabled="addDisabled" @click="addTodo">Add</button>
    </div>

    <div class="stats">{{ total === 0 ? '' : `${done} / ${total} completed` }}</div>

    <ul>
        <li v-if="total === 0" class="empty">No todos yet — add one above.</li>
        <li v-for="todo in todos" :key="(todo as any).$id" :class="{ done: todo.completed }">
            <input type="checkbox" :checked="todo.completed" @change="toggleTodo(todo)" />
            <span>{{ todo.text }}</span>
            <button class="btn-delete" @click="deleteTodo(todo)">Delete</button>
        </li>
    </ul>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }

body {
    font-family: system-ui, sans-serif;
    max-width: 520px;
    margin: 48px auto;
    padding: 0 16px;
    color: #1a1a1a;
}

h1 { font-size: 1.5rem; margin-bottom: 4px; }
.subtitle { color: #666; font-size: 0.875rem; margin-bottom: 24px; }

.add-row {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
}

input[type="text"] {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
}

input[type="text"]:focus {
    outline: none;
    border-color: #4f46e5;
}

button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
}

.btn-add { background: #4f46e5; color: #fff; }
.btn-add:hover { background: #4338ca; }
.btn-add:disabled { background: #a5b4fc; cursor: default; }

.stats {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 12px;
}

ul { list-style: none; padding: 0; margin: 0; }

li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
    background: #fff;
}

li.done span { text-decoration: line-through; color: #aaa; }

li span { flex: 1; font-size: 0.95rem; }

.btn-delete {
    background: none;
    color: #dc2626;
    padding: 2px 8px;
    border: 1px solid #fca5a5;
    font-size: 0.8rem;
}

.btn-delete:hover { background: #fee2e2; }

.empty { color: #aaa; font-size: 0.9rem; padding: 16px 0; }
</style>
