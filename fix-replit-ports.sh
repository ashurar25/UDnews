#!/bin/bash
# Fix Replit port configuration for preview

echo "กำลังแก้ไขการตั้งค่าพอร์ต Replit..."

# Create temporary .replit with exposeLocalhost
cp .replit .replit.backup
cat > .replit.temp << 'EOF'
modules = ["nodejs-20", "web"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-25_05"

[deployment]
deploymentTarget = "autoscale"
run = ["npm", "run", "start"]
build = ["npm", "run", "build"]

[[ports]]
localPort = 5000
externalPort = 80
exposeLocalhost = true

[workflows]
runButton = "Project"

[[workflows.workflow]]
name = "Project"
mode = "parallel"
author = "agent"

[[workflows.workflow.tasks]]
task = "workflow.run"
args = "Start application"

[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 5000

[agent]
integrations = ["javascript_log_in_with_replit==1.0.0", "javascript_database==1.0.0"]
EOF

echo "✓ สร้างไฟล์การตั้งค่าพอร์ตใหม่"
echo "URL สำหรับทดสอบ: http://0.0.0.0:5000"