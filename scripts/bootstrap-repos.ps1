# bootstrap-repos.ps1
$repos = @(
    "printprice-os-bootstrap",
    "ppos-shared-infra",
    "ppos-preflight-engine",
    "ppos-preflight-worker",
    "ppos-preflight-service",
    "ppos-core-platform",
    "ppos-shared-contracts",
    "ppos-build-orchestrator",
    "ppos-governance-assurance"
)

$root = Get-Location

foreach ($repo in $repos) {
    $repoPath = Join-Path $root $repo
    Write-Host "-------------------------------------------" -ForegroundColor Cyan
    Write-Host "Processing Repo: $repo" -ForegroundColor Yellow
    
    if (Test-Path $repoPath) {
        Push-Location $repoPath
        
        # Check if it's a git repo
        if (!(Test-Path ".git")) {
            Write-Host "Initializing git repository..."
            git init
            git branch -M main
        }

        # Add all materialization changes
        git add .
        
        # Check if there are changes to commit
        $status = git status --porcelain
        if ($status) {
            Write-Host "Committing changes..."
            git commit -m "Initial bootstrap and materialization (Phase 18.A)"
            
            # Note: We assume the remote 'origin' is already set up as per the user's manual creation
            # If not, this might fail, but it's a good baseline.
            # git push -u origin main
        } else {
            Write-Host "No changes to commit." -ForegroundColor Gray
        }
        
        Pop-Location
    } else {
        Write-Host "Directory $repo not found, skipping." -ForegroundColor Red
    }
}

Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Materialization Bootstrap Complete." -ForegroundColor Green
