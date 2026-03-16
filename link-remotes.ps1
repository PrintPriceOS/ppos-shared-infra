# link-remotes.ps1
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

$orgUrl = "https://github.com/PrintPriceOS"
$root = Get-Location

foreach ($repo in $repos) {
    $repoPath = Join-Path $root $repo
    Write-Host "Linking $repo..." -ForegroundColor Cyan
    
    if (Test-Path $repoPath) {
        Push-Location $repoPath
        
        # Add remote if not already exists
        $remotes = git remote
        if ($remotes -notmatch "origin") {
            git remote add origin "$orgUrl/$repo.git"
            Write-Host "Remote 'origin' added: $orgUrl/$repo.git" -ForegroundColor Green
        } else {
            Write-Host "Remote 'origin' already exists." -ForegroundColor Yellow
        }
        
        Pop-Location
    } else {
        Write-Host "Directory $repo not found." -ForegroundColor Red
    }
}
