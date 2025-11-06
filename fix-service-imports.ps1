# Fix all service imports

$services = Get-ChildItem -Path "src\modules" -Recurse -Filter "*Service.js"

foreach ($file in $services) {
    $content = Get-Content $file.FullName -Raw
    
    # Calculate the depth for relative paths
    $relativePath = $file.Directory.FullName -replace [regex]::Escape($PWD.Path + "\src\modules\"), ""
    $parts = $relativePath -split "\\"
    $depth = $parts.Count
    
    # Build correct path
    if ($depth -eq 1) {
        # e.g., auth/authService.js
        $configPath = "../../config"
        $utilsPath = "../../utils"
    } elseif ($depth -eq 2) {
        # e.g., user-management/users/userService.js
        $configPath = "../../../config"
        $utilsPath = "../../../utils"
    } elseif ($depth -eq 3) {
        # Would be rare
        $configPath = "../../../../config"
        $utilsPath = "../../../../utils"
    }
    
    # Replace all config and utils imports
    $content = $content -replace "from '[^']*config/([^']+)'", "from '$configPath/`$1'"
    $content = $content -replace "from '[^']*utils/([^']+)'", "from '$utilsPath/`$1'"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($file.Name) (depth: $depth)"
}

Write-Host "`nDone!"
