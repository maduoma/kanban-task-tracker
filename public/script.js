// Simple API base URL configuration
const IS_NETLIFY = window.location.hostname.includes('netlify');
const API_BASE = IS_NETLIFY ? '/.netlify/functions/api' : '';

console.log('Environment:', {
  IS_NETLIFY,
  hostname: window.location.hostname,
  API_BASE
});

// Simple function to get API URL
function getApiUrl(path) {
  return `${API_BASE}${path}`;
}

// Log API endpoints for debugging
console.log('API Endpoints:', { 
  getTasks: getApiUrl('/api/tasks'),
  createTask: getApiUrl('/api/tasks'),
  deleteTask: getApiUrl('/api/tasks/example-id'),
  moveTask: getApiUrl('/api/tasks/example-id/move')
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

async function renderAllTasks() {
  console.log('Fetching all tasks...');
  try {
    const res = await fetch(getApiUrl('/api/tasks'));
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error fetching tasks: ${res.status} ${res.statusText}`, errorText);
      return;
    }
    const tasks = await res.json();
    console.log('Tasks fetched successfully:', tasks);
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

  // Add a timestamp to avoid caching issues
  const timestamp = new Date().getTime();
  const apiUrl = `${getApiUrl('/api/tasks')}?t=${timestamp}`;
  console.log('Sending POST request to:', apiUrl, 'with data:', { content: text });
  
  try {
    // Show loading state
    addTaskButton.disabled = true;
    addTaskButton.textContent = 'Adding...';
    addTaskError.textContent = '';
    
    // Log the full request details
    const requestBody = JSON.stringify({ content: text });
    console.log('Request body:', requestBody);
    console.log('Request body length:', requestBody.length);
    
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
    console.log('Response status text:', res.statusText);
    console.log('Response type:', res.type);
    console.log('Response URL:', res.url);
    console.log('Response headers:', [...res.headers.entries()].reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {}));
    
    // Get the raw text response
    const rawText = await res.text();
    console.log('Raw response text:', rawText);
    console.log('Raw response length:', rawText.length);
    
    // Try to detect if it's HTML instead of JSON
    const isHtml = rawText.trim().startsWith('<!DOCTYPE html>') || 
                  rawText.trim().startsWith('<html>') ||
                  rawText.includes('<body');
    
    if (isHtml) {
      console.error('Received HTML instead of JSON. This might be a server error page or redirect');
      throw new Error('Server returned HTML instead of JSON');
    }
    
    let responseData;
    try {
      // Try to parse as JSON
      responseData = JSON.parse(rawText);
      console.log('Successfully parsed response as JSON:', responseData);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      // Not valid JSON, create an error object with more details
      responseData = { 
        content: rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''), 
        error: 'Response was not JSON',
        parseError: e.message
      };
      throw new Error(`Failed to parse response as JSON: ${e.message}`);
    }
    
    if (!res.ok) {
      throw new Error(responseData?.error || `API error: ${res.status} - ${res.statusText}`);
    }

    console.log('New task created:', responseData);
    document.getElementById('todo').appendChild(createTaskCard(responseData));
    newTaskInput.value = '';
    
    // Show success message
    addTaskError.textContent = 'Task added successfully!';
    addTaskError.classList.remove('hidden');
    addTaskError.style.color = 'green';
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      addTaskError.classList.add('hidden');
      addTaskError.style.color = 'red';
    }, 3000);
  } catch (error) {
    console.error('Error adding task:', error);
    addTaskError.textContent = `Failed to add task: ${error.message}`;
    addTaskError.classList.remove('hidden');
    
    // Try direct API health check
    try {
      const healthCheckUrl = getApiUrl('/api/health');
      console.log('Checking API health at:', healthCheckUrl);
      fetch(healthCheckUrl)
        .then(res => res.text())
        .then(text => console.log('Health check response:', text))
        .catch(err => console.error('Health check failed:', err));
    } catch (healthError) {
      console.error('Error checking API health:', healthError);
    }
  } finally {
    // Reset button state
    addTaskButton.disabled = false;
    addTaskButton.textContent = 'Add Task';
  }
}

async function deleteTask(id) {
  try {
    const apiUrl = getApiUrl(`/api/tasks/${id}`);
    console.log(`Deleting task ${id} at URL: ${apiUrl}`);
    const response = await fetch(apiUrl, { method: 'DELETE' });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error deleting task: ${response.status}`, errorText);
      throw new Error(`Failed to delete task: ${response.status}`);
    }
    
    console.log(`Task ${id} deleted successfully`);
    const elem = document.getElementById(id);
    if (elem) elem.remove();
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
    try {
      // First update the UI immediately for better user experience
      const after = getDragAfterElement(col, e.clientY);
      after ? col.insertBefore(draggedItem, after) : col.appendChild(draggedItem);
      
      // Then make the API call to persist the change
      console.log(`Moving task to ${newCol}`);
      const apiUrl = getApiUrl(`/api/tasks/${draggedItem.id}/move`);
      console.log(`Moving task at URL: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: newCol }),
      });
      
      // Check if the response is valid JSON
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(responseData?.error || `API error: ${response.status}`);
      }
      
      // Trigger confetti AFTER successful API call
      if (newCol === 'DONE') {
        console.log('Task moved to DONE column, triggering confetti...');
        triggerConfetti();
      }
    } catch (error) {
      console.error('Error moving task:', error);
      // Don't show alert to user, just log the error
      console.warn('API call failed but UI was updated anyway for better UX');
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

document.addEventListener('DOMContentLoaded', renderAllTasks);

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
