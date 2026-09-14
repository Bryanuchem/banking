#!/bin/bash

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_BASH="/c/Program Files/Git/git-bash.exe"

launch_git_bash() {
    local title="$1"
    local directory="$2"
    local command="$3"
    local script

    script="$(mktemp --suffix=.sh)"

    cat > "$script" <<EOF
#!/bin/bash

printf '\\033]0;${title}\\007'

cd "$directory" || {
    echo "Could not open: $directory"
    exec bash
}

$command

echo
echo "${title} stopped."
exec bash
EOF

    chmod +x "$script"
    "$GIT_BASH" "$script" &
}

echo "Starting Banking development environment..."
echo

# API
launch_git_bash \
    "Banking API" \
    "$PROJECT/backend" \
    "source .venv/Scripts/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

sleep 1

# Background Worker
launch_git_bash \
    "Banking Worker" \
    "$PROJECT/backend" \
    "source .venv/Scripts/activate && python -m app.jobs.runner"

sleep 1

# Customer Website
launch_git_bash \
    "Banking Customer" \
    "$PROJECT/frontend/customer" \
    "npm run dev -- --host 0.0.0.0 --port 5173"

sleep 1

# Admin Website
launch_git_bash \
    "Banking Admin" \
    "$PROJECT/frontend/admin" \
    "npm run dev -- --host 0.0.0.0 --port 5174"

sleep 3

# API Cloudflare Tunnel
powershell.exe -NoProfile -Command "Start-Process 'C:\Windows\System32\cmd.exe' -ArgumentList '/k','title Banking Customer Cloudflare & cd /d C:\Cloudflared & cloudflared.exe tunnel --url http://localhost:8000'"

sleep 1

# Customer Cloudflare Tunnel
powershell.exe -NoProfile -Command "Start-Process 'C:\Windows\System32\cmd.exe' -ArgumentList '/k','title Banking Customer Cloudflare & cd /d C:\Cloudflared & cloudflared.exe tunnel --url http://localhost:5173'"

sleep 1

# Admin Cloudflare Tunnel
powershell.exe -NoProfile -Command "Start-Process 'C:\Windows\System32\cmd.exe' -ArgumentList '/k','title Banking Admin Cloudflare & cd /d C:\Cloudflared & cloudflared.exe tunnel --url http://localhost:5174'"

echo
echo "Started:"
echo "  API:      http://localhost:8000"
echo "  Worker:   app.jobs.runner"
echo "  Customer: http://localhost:5173"
echo "  Admin:    http://localhost:5174"
echo
echo "Separate CMD windows should now be open for Cloudflare tunnels."
