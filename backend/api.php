<?php
// Prevent any unwanted output
ob_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Check and create priority column if it doesn't exist
function ensurePriorityColumn() {
    global $conn;
    $checkColumn = "SHOW COLUMNS FROM tasks LIKE 'priority'";
    $result = $conn->query($checkColumn);
    
    if ($result->num_rows === 0) {
        $addColumn = "ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' AFTER status";
        if (!$conn->query($addColumn)) {
            error_log("Failed to add priority column: " . $conn->error);
        }
    }
}

// Call this function when the API starts
ensurePriorityColumn();

// Function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    ob_clean(); // Clear any output buffering
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Get all tasks
function getTasks() {
    global $conn;
    $query = "SELECT * FROM tasks ORDER BY created_at DESC";
    $result = $conn->query($query);
    $tasks = array();

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            array_push($tasks, $row);
        }
    }
    sendJsonResponse($tasks);
}

// Create new task
function createTask($data) {
    global $conn;
    
    if (!isset($data->title) || !isset($data->description) || !isset($data->status) || !isset($data->due_date)) {
        sendJsonResponse(array('success' => false, 'message' => 'Missing required fields'), 400);
    }

    $title = $conn->real_escape_string($data->title);
    $description = $conn->real_escape_string($data->description);
    $status = $conn->real_escape_string($data->status);
    $due_date = $conn->real_escape_string($data->due_date);
    $priority = isset($data->priority) ? $conn->real_escape_string($data->priority) : 'medium';

    $query = "INSERT INTO tasks (title, description, status, priority, due_date, created_at, updated_at) 
              VALUES ('$title', '$description', '$status', '$priority', '$due_date', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

    if ($conn->query($query)) {
        $newTaskId = $conn->insert_id;
        
        // Fetch the newly created task
        $selectQuery = "SELECT * FROM tasks WHERE id = $newTaskId";
        $result = $conn->query($selectQuery);
        $newTask = $result->fetch_assoc();
        
        sendJsonResponse(array(
            'success' => true,
            'message' => 'Task created successfully',
            'task' => $newTask
        ));
    } else {
        error_log("Failed to create task: " . $conn->error);
        sendJsonResponse(array('success' => false, 'message' => 'Failed to create task'), 500);
    }
}

// Update task status
function updateTaskStatus($id, $status) {
    global $conn;
    
    if (!$id || !$status) {
        sendJsonResponse(array('success' => false, 'message' => 'Task ID and status are required'), 400);
    }

    $id = $conn->real_escape_string($id);
    $status = $conn->real_escape_string($status);

    // First check if task exists
    $checkQuery = "SELECT id FROM tasks WHERE id = $id";
    $result = $conn->query($checkQuery);
    if ($result->num_rows === 0) {
        sendJsonResponse(array('success' => false, 'message' => 'Task not found'), 404);
    }

    $query = "UPDATE tasks SET status = '$status', updated_at = CURRENT_TIMESTAMP WHERE id = $id";
    
    if ($conn->query($query)) {
        sendJsonResponse(array('success' => true, 'message' => 'Task status updated successfully'));
    } else {
        error_log("Failed to update task status: " . $conn->error);
        sendJsonResponse(array('success' => false, 'message' => 'Failed to update task status'), 500);
    }
}

// Update task
function updateTask($id, $data) {
    global $conn;
    error_log("Updating task with ID: " . $id);
    error_log("Task data: " . print_r($data, true));

    if (!$id) {
        sendJsonResponse(array('success' => false, 'message' => 'Task ID is required'), 400);
    }

    // Validate required fields
    if (!isset($data->title) || !isset($data->description) || !isset($data->status) || !isset($data->due_date)) {
        error_log("Missing required fields. Data received: " . print_r($data, true));
        sendJsonResponse(array('success' => false, 'message' => 'Missing required fields'), 400);
    }

    $id = $conn->real_escape_string($id);
    $title = $conn->real_escape_string($data->title);
    $description = $conn->real_escape_string($data->description);
    $status = $conn->real_escape_string($data->status);
    $due_date = $conn->real_escape_string($data->due_date);
    $priority = isset($data->priority) ? $conn->real_escape_string($data->priority) : 'medium';

    // First check if task exists
    $checkQuery = "SELECT id FROM tasks WHERE id = $id";
    $result = $conn->query($checkQuery);
    if ($result->num_rows === 0) {
        sendJsonResponse(array('success' => false, 'message' => 'Task not found'), 404);
    }

    $query = "UPDATE tasks SET 
              title = '$title',
              description = '$description',
              status = '$status',
              due_date = '$due_date',
              priority = '$priority',
              updated_at = CURRENT_TIMESTAMP
              WHERE id = $id";
    
    if ($conn->query($query)) {
        // Fetch the updated task
        $selectQuery = "SELECT * FROM tasks WHERE id = $id";
        $result = $conn->query($selectQuery);
        $updatedTask = $result->fetch_assoc();
        
        sendJsonResponse(array(
            'success' => true,
            'message' => 'Task updated successfully',
            'task' => $updatedTask
        ));
    } else {
        error_log("Failed to update task: " . $conn->error);
        sendJsonResponse(array('success' => false, 'message' => 'Failed to update task'), 500);
    }
}

// Delete task
function deleteTask($id) {
    global $conn;
    
    if (!$id) {
        sendJsonResponse(array('success' => false, 'message' => 'Task ID is required'), 400);
    }

    $id = $conn->real_escape_string($id);

    $query = "DELETE FROM tasks WHERE id = $id";
    
    if ($conn->query($query)) {
        sendJsonResponse(array('success' => true, 'message' => 'Task deleted successfully'));
    } else {
        error_log("Failed to delete task: " . $conn->error);
        sendJsonResponse(array('success' => false, 'message' => 'Failed to delete task'), 500);
    }
}

// Handle incoming requests
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getTasks();
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'));
            createTask($data);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'));
            
            // Get the task ID from the URL
            $urlParts = parse_url($_SERVER['REQUEST_URI']);
            parse_str($urlParts['query'] ?? '', $params);
            $taskId = $params['id'] ?? null;
            
            if (isset($data->status) && !isset($data->title)) {
                // If only status is provided, update just the status
                updateTaskStatus($taskId, $data->status);
            } else {
                // Otherwise, update the entire task
                updateTask($taskId, $data);
            }
            break;

        case 'DELETE':
            // Get the task ID from the URL
            $urlParts = parse_url($_SERVER['REQUEST_URI']);
            parse_str($urlParts['query'] ?? '', $params);
            $taskId = $params['id'] ?? null;
            
            deleteTask($taskId);
            break;

        default:
            sendJsonResponse(array('success' => false, 'message' => 'Invalid request method'), 405);
            break;
    }
} catch (Exception $e) {
    error_log("Error in API: " . $e->getMessage());
    sendJsonResponse(array('success' => false, 'message' => 'Server error'), 500);
}

// Clean up
ob_end_clean();
$conn->close();
?>
