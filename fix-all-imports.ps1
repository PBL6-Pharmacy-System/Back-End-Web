# Fix all imports in Routes files completely

$routes = Get-ChildItem -Path "src\modules" -Recurse -Filter "*Routes.js"

foreach ($file in $routes) {
    $content = Get-Content $file.FullName -Raw
    
    # Calculate the depth for relative paths
    $relativePath = $file.Directory.FullName -replace [regex]::Escape($PWD.Path + "\src\modules\"), ""
    $parts = $relativePath -split "\\"
    $depth = $parts.Count
    
    # Auth middleware path
    if ($depth -eq 1) {
        # Same level as auth module (e.g., auth/)
        $authPath = "./auth.middleware.js"
        $middlewarePath = "../../middlewares"
    } elseif ($depth -eq 2) {
        # One level down (e.g., user-management/users/)
        $authPath = "../../auth/auth.middleware.js"
        $middlewarePath = "../../../middlewares"
    } elseif ($depth -eq 3) {
        # Two levels down (would be rare)
        $authPath = "../../../auth/auth.middleware.js"
        $middlewarePath = "../../../../middlewares"
    }
    
    # Replace all auth middleware imports
    $content = $content -replace "from '[^']*auth\.middleware\.js'", "from '$authPath'"
    
    # Replace all other middleware imports
    $content = $content -replace "from '[^']*middlewares/([^']+)'", "from '$middlewarePath/`$1'"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($file.Name) (depth: $depth, auth: $authPath)"
}

Write-Host "`nDone!"
