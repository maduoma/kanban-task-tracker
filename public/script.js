// Simple API base URL configuration
const IS_NETLIFY = window.location.hostname.includes('netlify');

// Use the simplified API function instead of the complex one
const API_BASE = IS_NETLIFY ? '/.netlify/functions/simple-api' : 'http://localhost:3000';

// Always use local storage for now until database permissions are fixed
let USE_LOCAL_STORAGE = true;

// Flag to indicate if we've tested the API yet
let API_TESTED = false;

console.log('Environment:', {
  IS_NETLIFY,
  hostname: window.location.hostname,
  API_BASE
});

// Function to get API URL - simplified for the new API
function getApiUrl(path) {
  // Remove leading /api/ if present since API_BASE already points to the API root
  const cleanPath = path.startsWith('/api/') ? path.substring(5) : path;
  // Remove leading slash if present
  const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
  return `${API_BASE}/api/${finalPath}`;
}

// Log API endpoints for debugging
console.log('API Endpoints:', { 
  getTasks: getApiUrl('tasks'),
  createTask: getApiUrl('tasks'),
  deleteTask: getApiUrl('tasks/example-id'),
  moveTask: getApiUrl('tasks/example-id/move')
});

// Also log the raw endpoints for verification
console.log('Raw API endpoints:', {
  base: API_BASE,
  tasks: `${API_BASE}/tasks`
});
const addTaskButton = document.getElementById('add-task-button');
const newTaskInput = document.getElementById('new-task-input');
const addTaskError = document.getElementById('add-task-error');
const columns = document.querySelectorAll('.kanban-column');
// Simple direct approach to confetti
// No canvas element needed, using the global confetti function directly

/**
 * Trigger a celebratory confetti effect when a task is completed
 */
function triggerConfetti() {
  console.log('Attempting to trigger confetti...');
  
  try {
    // Use the global confetti function directly
    if (typeof confetti === 'function') {
      // First burst from the middle
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3']
      });
      
      // Second burst from the left
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 }
        });
      }, 250);
      
      // Third burst from the right
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 }
        });
      }, 400);
      
      console.log('Confetti triggered successfully!');
    } else {
      console.error('Confetti function not available globally');
      // Fallback - try to load confetti dynamically if it's not available
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      script.onload = () => {
        console.log('Confetti loaded dynamically, retrying...');
        setTimeout(triggerConfetti, 100);
      };
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error('Error triggering confetti:', error);
  }
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.classList.add('task-card');
  card.setAttribute('draggable', 'true');
  card.setAttribute('id', task.id);
  card.textContent = task.content;

  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  const delBtn = document.createElement('button');
  delBtn.classList.add('delete-button');
  delBtn.innerHTML = '&times;';
  delBtn.title = 'Delete Task';
  delBtn.onclick = async (e) => {
    e.stopPropagation();
    await deleteTask(task.id);
  };

  card.appendChild(delBtn);
  return card;
}

// Local storage functions for fallback mode
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  console.log('Tasks saved to local storage:', tasks);
}

function getTasksFromLocalStorage() {
  try {
    const tasks = JSON.parse(localStorage.getItem('kanban_tasks')) || [];
    console.log('Tasks loaded from local storage:', tasks);
    return tasks;
  } catch (error) {
    console.error('Error loading tasks from local storage:', error);
    return [];
  }
}

async function renderAllTasks() {
  console.log('Fetching all tasks...');
  try {
    let tasks = [];
    
    if (!USE_LOCAL_STORAGE) {
      try {
        const res = await fetch(getApiUrl('tasks'));
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Error fetching tasks: ${res.status} ${res.statusText}`, errorText);
          throw new Error('API unavailable');
        }
        tasks = await res.json();
        console.log('Tasks fetched successfully from API:', tasks);
      } catch (apiError) {
        console.warn('API unavailable, falling back to local storage:', apiError);
        USE_LOCAL_STORAGE = true;
        tasks = getTasksFromLocalStorage();
      }
    } else {
      tasks = getTasksFromLocalStorage();
      console.log('Using local storage for tasks:', tasks);
    }
    
    // Clear existing tasks
    columns.forEach(col => col.querySelectorAll('.task-card').forEach(c => c.remove()));
  
    // Column mapping from database to UI
    const columnMap = {
      'TODO': 'todo',
      'IN_PROGRESS': 'inprogress',  // This is the key fix - mapping IN_PROGRESS to inprogress
      'DONE': 'done'
    };
    
    tasks.forEach(task => {
      // Use the mapping to get the correct column ID
      const columnId = columnMap[task.column] || task.column.toLowerCase();
      const col = document.getElementById(columnId);
      
      if (col) {
        col.appendChild(createTaskCard(task));
      } else {
        console.error(`Column not found for task: ${task.id}, column: ${task.column}`);
      }
    });
  } catch (error) {
    console.error('Error rendering tasks:', error);
    // Last resort fallback - show a user-friendly error
    addTaskError.textContent = 'Could not load tasks. Working in offline mode.';
    addTaskError.classList.remove('hidden');
    addTaskError.style.color = 'orange';
  }
}

async function addTask() {
  console.log('Add Task button clicked');
  const text = newTaskInput.value.trim();
  if (!text) {
    console.log('No text entered');
    return addTaskError.classList.remove('hidden');
  }
  addTaskError.classList.add('hidden');

  // Show loading state
  addTaskButton.disabled = true;
  addTaskButton.textContent = 'Adding...';
  addTaskError.textContent = '';
  
  try {
    // Generate a new task object
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newTask = {
      id: taskId,
      content: text,
      column: 'TODO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // If using local storage, add task directly
    if (USE_LOCAL_STORAGE) {
      console.log('Adding task to local storage:', newTask);
      const tasks = getTasksFromLocalStorage();
      tasks.push(newTask);
      saveTasksToLocalStorage(tasks);
      
      // Update UI
      document.getElementById('todo').appendChild(createTaskCard(newTask));
      newTaskInput.value = '';
      
      // Show success message
      addTaskError.textContent = 'Task added successfully (offline mode)!';
      addTaskError.classList.remove('hidden');
      addTaskError.style.color = 'green';
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        addTaskError.classList.add('hidden');
        addTaskError.style.color = 'red';
      }, 3000);
      
      return;
    }
    
    // Try API first
    try {
      // Use the dedicated create-task function
      const timestamp = new Date().getTime();
      const apiUrl = `/.netlify/functions/create-task?t=${timestamp}`;
      console.log('Sending POST request to:', apiUrl, 'with data:', { content: text });
      
      const requestBody = JSON.stringify({ content: text });
      console.log('Request body:', requestBody);
      
      // Make the request with explicit mode and credentials
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: requestBody,
        mode: 'cors',
        credentials: 'same-origin'
      });

      console.log('Response received');
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        // Get the raw text response for debugging
        const rawText = await res.text();
        console.log('Raw error response:', rawText);
        throw new Error(`API error: ${res.status}`);
      }
      
      const responseData = await res.json();
      console.log('New task created via API:', responseData);
      
      // Update UI
      document.getElementById('todo').appendChild(createTaskCard(responseData));
      newTaskInput.value = '';
      
      // Show success message
      addTaskError.textContent = 'Task added successfully!';
      addTaskError.classList.remove('hidden');
      addTaskError.style.color = 'green';
    } catch (apiError) {
      console.error('API error, falling back to local storage:', apiError);
      
      // Switch to local storage mode
      USE_LOCAL_STORAGE = true;
      
      // Add task to local storage
      const tasks = getTasksFromLocalStorage();
      tasks.push(newTask);
      saveTasksToLocalStorage(tasks);
      
      // Update UI
      document.getElementById('todo').appendChild(createTaskCard(newTask));
      newTaskInput.value = '';
      
      // Show fallback success message
      addTaskError.textContent = 'Task added in offline mode (API unavailable)';
      addTaskError.classList.remove('hidden');
      addTaskError.style.color = 'orange';
    }
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      addTaskError.classList.add('hidden');
      addTaskError.style.color = 'red';
    }, 3000);
  } catch (error) {
    console.error('Error adding task:', error);
    addTaskError.textContent = `Failed to add task: ${error.message}`;
    addTaskError.classList.remove('hidden');
  } finally {
    // Reset button state
    addTaskButton.disabled = false;
    addTaskButton.textContent = 'Add Task';
  }
}

async function deleteTask(id) {
  try {
    if (USE_LOCAL_STORAGE) {
      // Delete from local storage
      console.log(`Deleting task ${id} from local storage`);
      const tasks = getTasksFromLocalStorage();
      const updatedTasks = tasks.filter(task => task.id !== id);
      saveTasksToLocalStorage(updatedTasks);
      
      // Remove from UI
      const elem = document.getElementById(id);
      if (elem) elem.remove();
      
      console.log(`Task ${id} deleted successfully from local storage`);
      return;
    }
    
    // Try API first
    try {
      const apiUrl = getApiUrl(`tasks/${id}`);
      console.log(`Deleting task ${id} at URL: ${apiUrl}`);
      const response = await fetch(apiUrl, { method: 'DELETE' });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error deleting task: ${response.status}`, errorText);
        throw new Error(`Failed to delete task: ${response.status}`);
      }
      
      console.log(`Task ${id} deleted successfully via API`);
      const elem = document.getElementById(id);
      if (elem) elem.remove();
    } catch (apiError) {
      console.error('API error, falling back to local storage:', apiError);
      
      // Switch to local storage mode
      USE_LOCAL_STORAGE = true;
      
      // Delete from local storage
      const tasks = getTasksFromLocalStorage();
      const updatedTasks = tasks.filter(task => task.id !== id);
      saveTasksToLocalStorage(updatedTasks);
      
      // Remove from UI
      const elem = document.getElementById(id);
      if (elem) elem.remove();
      
      console.log(`Task ${id} deleted from local storage after API failure`);
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task. Please check the console for details.');
  }
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = e.target;
  e.dataTransfer.setData('text/plain', e.target.id);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  const col = e.target.closest('.kanban-column');
  if (col) col.classList.add('drag-over');
}

function handleDragLeave(e) {
  const col = e.target.closest('.kanban-column');
  if (col) col.classList.remove('drag-over');
}

async function handleDrop(e) {
  e.preventDefault();
  const col = e.target.closest('.kanban-column');
  if (!col || !draggedItem) return;

  const columnMap = {
    todo: 'TODO',
    inprogress: 'IN_PROGRESS',
    done: 'DONE',
  };

  const newCol = columnMap[col.id];
  const currCol = columnMap[draggedItem.parentElement.id];

  if (newCol !== currCol) {
    // First update the UI immediately for better user experience
    const after = getDragAfterElement(col, e.clientY);
    after ? col.insertBefore(draggedItem, after) : col.appendChild(draggedItem);
    
    try {
      if (USE_LOCAL_STORAGE) {
        // Update in local storage
        console.log(`Moving task ${draggedItem.id} to ${newCol} in local storage`);
        const tasks = getTasksFromLocalStorage();
        const taskIndex = tasks.findIndex(task => task.id === draggedItem.id);
        
        if (taskIndex !== -1) {
          tasks[taskIndex].column = newCol;
          tasks[taskIndex].updatedAt = new Date().toISOString();
          saveTasksToLocalStorage(tasks);
          console.log(`Task moved successfully in local storage`);
          
          // Trigger confetti for DONE column
          if (newCol === 'DONE') {
            console.log('Task moved to DONE column, triggering confetti...');
            triggerConfetti();
          }
        }
        
        return;
      }
      
      // Try API first
      try {
        console.log(`Moving task to ${newCol}`);
        const apiUrl = getApiUrl(`tasks/${draggedItem.id}/move`);
        console.log(`Moving task at URL: ${apiUrl}`);
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ column: newCol }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error moving task: ${response.status}`, errorText);
          throw new Error(`Failed to move task: ${response.status}`);
        }
        
        console.log('Task moved successfully via API');
        
        // Trigger confetti AFTER successful API call
        if (newCol === 'DONE') {
          console.log('Task moved to DONE column, triggering confetti...');
          triggerConfetti();
        }
      } catch (apiError) {
        console.error('API error, falling back to local storage:', apiError);
        
        // Switch to local storage mode
        USE_LOCAL_STORAGE = true;
        
        // Update in local storage
        const tasks = getTasksFromLocalStorage();
        const taskIndex = tasks.findIndex(task => task.id === draggedItem.id);
        
        if (taskIndex !== -1) {
          tasks[taskIndex].column = newCol;
          tasks[taskIndex].updatedAt = new Date().toISOString();
          saveTasksToLocalStorage(tasks);
          console.log(`Task moved successfully in local storage after API failure`);
          
          // Trigger confetti for DONE column
          if (newCol === 'DONE') {
            console.log('Task moved to DONE column, triggering confetti...');
            triggerConfetti();
          }
        }
      }
    } catch (error) {
      console.error('Error moving task:', error);
      // Don't show alert to user, just log the error
      console.warn('UI was updated anyway for better UX');
    }
  }

  columns.forEach((c) => c.classList.remove('drag-over'));
}


function getDragAfterElement(container, y) {
  return [...container.querySelectorAll('.task-card:not(.dragging)')].reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset
        ? { offset, element: child }
        : closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

addTaskButton.addEventListener('click', addTask);
newTaskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

columns.forEach(col => {
  col.addEventListener('dragover', handleDragOver);
  col.addEventListener('dragleave', handleDragLeave);
  col.addEventListener('drop', handleDrop);
});

document.addEventListener('DOMContentLoaded', async () => {
  // Skip API testing since we're using local storage by default
  console.log('Using local storage for task persistence');
  API_TESTED = true;
  
  // Render tasks from local storage
  await renderAllTasks();
});

// Export functions for testing
if (typeof window !== 'undefined') {
  window.triggerConfetti = triggerConfetti;
  window.createTaskCard = createTaskCard;
  window.renderAllTasks = renderAllTasks;
  window.addTask = addTask;
  window.deleteTask = deleteTask;
  window.handleDragStart = handleDragStart;
  window.handleDragEnd = handleDragEnd;
  window.handleDragOver = handleDragOver;
  window.handleDragLeave = handleDragLeave;
  window.handleDrop = handleDrop;
  window.getDragAfterElement = getDragAfterElement;
}

// For module exports in testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    triggerConfetti,
    createTaskCard,
    renderAllTasks,
    addTask,
    deleteTask,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getDragAfterElement
  };
}
