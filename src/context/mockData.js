export const MOCK_ROOMS = [
  {
    id: "room_a1b2c3",
    name: "React Dashboard UI",
    language: "javascript",
    role: "Owner",
    owner: "You",
    members: 3,
    lastEdited: "2 hours ago",
    description: "Building the main dashboard components and layout system.",
  },
  {
    id: "room_d4e5f6",
    name: "Python Data Scraper",
    language: "python",
    role: "Editor",
    owner: "alice@dev.io",
    members: 2,
    lastEdited: "Yesterday",
    description: "Web scraping pipeline for collecting product pricing data.",
  },
  {
    id: "room_g7h8i9",
    name: "C++ Algorithm Study",
    language: "cpp",
    role: "Viewer",
    owner: "bob@code.dev",
    members: 5,
    lastEdited: "3 days ago",
    description: "Competitive programming practice — dynamic programming patterns.",
  },
];

export const MOCK_USERS = [
  { id: 1, name: "You",   initials: "YO", color: "#6c63ff", status: "typing"  },
  { id: 2, name: "Alice", initials: "AL", color: "#ff6b9d", status: "idle"    },
  { id: 3, name: "Bob",   initials: "BO", color: "#4da6ff", status: "viewing" },
];

export const STARTER_CODE = {
  javascript: `// CollabCode — JavaScript Workspace
// Start coding and collaborate in real-time!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example usage
const result = fibonacci(10);
console.log(\`fibonacci(10) = \${result}\`); // 55

// Explore modern JS features
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);
console.log('Doubled:', doubled);
`,
  python: `# CollabCode — Python Workspace
# Start coding and collaborate in real-time!

def fibonacci(n):
    """Return the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
result = fibonacci(10)
print(f"fibonacci(10) = {result}")  # 55

# List comprehension example
nums = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in nums]
print("Doubled:", doubled)
`,
  cpp: `// CollabCode — C++ Workspace
// Start coding and collaborate in real-time!

#include <iostream>
#include <vector>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    // Example usage
    int result = fibonacci(10);
    cout << "fibonacci(10) = " << result << endl; // 55

    // Vector example
    vector<int> nums = {1, 2, 3, 4, 5};
    for (int n : nums) {
        cout << n * 2 << " ";
    }
    cout << endl;

    return 0;
}
`,
};

export const LANGUAGE_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  cpp: "C++",
};