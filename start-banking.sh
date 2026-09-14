#!/bin/bash

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_BASH="/c/Program Files/Git/git-bash.exe"
API_TUNNEL_LOG="$(mktemp --suffix=-banking-api-cloudflare.log)"

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

upsert_env_var() {
    local file="$1"
    local key="$2"
    local value="$3"

    mkdir -p "$(dirname "$file")"
    touch "$file"

    if grep -q "^${key}=" "$file"; then
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
        if [ -s "$file" ]; then
            printf '\n' >> "$file"
        fi
        printf '%s=%s\n' "$key" "$value" >> "$file"
    fi
}

wait_for_api_tunnel() {
    local attempts=0
    local url=""

    while [ "$attempts" -lt 60 ]; do
        if [ -f "$API_TUNNEL_LOG" ]; then
            url="$(
                grep -Eo \
                    'https://[A-Za-z0-9-]+\.trycloudflare\.com' \
                    "$API_TUNNEL_LOG" \
                    | head -n 1
            )"
        fi

        if [ -n "$url" ]; then
            printf '%s' "$url"
            return 0
        fi

        attempts=$((attempts + 1))
        sleep 1
    done

    return 1
}

echo "Starting Banking development environment..."
echo

# 1. FastAPI
launch_git_bash \
    "Banking API" \
    "$PROJECT/backend" \
    "source .venv/Scripts/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

sleep 1

# 2. Background worker
launch_git_bash \
    "Banking Worker" \
    "$PROJECT/backend" \
    "source .venv/Scripts/activate && python -m app.jobs.runner"

sleep 1

# 3. API Cloudflare tunnel.
# It opens in Git Bash so its output can also be captured for the Vite env files.
launch_git_bash \
    "Banking API Cloudflare - 8000" \
    "/c/Cloudflared" \
    "./cloudflared.exe tunnel --url http://localhost:8000 2>&1 | tee \"$API_TUNNEL_LOG\""

echo "Waiting for the API Cloudflare URL..."

API_CLOUDFLARE_ORIGIN="$(wait_for_api_tunnel)"

if [ -z "$API_CLOUDFLARE_ORIGIN" ]; then
    echo
    echo "Could not detect the API Quick Tunnel URL."
    echo "Check the Banking API Cloudflare window."
    echo "Customer and admin were not started because their remote API URL would be missing."
    exit 1
fi

API_CLOUDFLARE_URL="${API_CLOUDFLARE_ORIGIN}/api/v1"

# Keep the ordinary VITE_API_BASE_URL untouched.
# Only this second preview URL is inserted/updated.
upsert_env_var \
    "$PROJECT/frontend/customer/.env" \
    "VITE_CLOUDFLARE_URL" \
    "$API_CLOUDFLARE_URL"

upsert_env_var \
    "$PROJECT/frontend/admin/.env" \
    "VITE_CLOUDFLARE_URL" \
    "$API_CLOUDFLARE_URL"

echo "API tunnel detected:"
echo "  $API_CLOUDFLARE_URL"
echo

# 4. Customer website
launch_git_bash \
    "Banking Customer - 5173" \
    "$PROJECT/frontend/customer" \
    "npm run dev -- --host 0.0.0.0 --port 5173"

sleep 1

# 5. Admin website
launch_git_bash \
    "Banking Admin - 5174" \
    "$PROJECT/frontend/admin" \
    "npm run dev -- --host 0.0.0.0 --port 5174"

sleep 3

# 6. Customer Cloudflare tunnel in its own CMD window.
powershell.exe -NoProfile -Command "Start-Process 'C:\Windows\System32\cmd.exe' -ArgumentList '/k','title Banking Customer Cloudflare & cd /d C:\Cloudflared & cloudflared.exe tunnel --url http://localhost:5173'"

sleep 1

# 7. Admin Cloudflare tunnel in its own CMD window.
powershell.exe -NoProfile -Command "Start-Process 'C:\Windows\System32\cmd.exe' -ArgumentList '/k','title Banking Admin Cloudflare & cd /d C:\Cloudflared & cloudflared.exe tunnel --url http://localhost:5174'"

echo
echo "Started:"
echo "  API:             http://localhost:8000"
echo "  API Cloudflare:  $API_CLOUDFLARE_ORIGIN"
echo "  Worker:          app.jobs.runner"
echo "  Customer:        http://localhost:5173"
echo "  Admin:           http://localhost:5174"
echo
echo "VITE_CLOUDFLARE_URL was updated in both frontend .env files."
echo "The existing VITE_API_BASE_URL values were left unchanged."
echo "Separate CMD windows are open for the customer and admin preview tunnels."
