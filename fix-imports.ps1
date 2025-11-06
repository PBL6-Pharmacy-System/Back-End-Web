# Fix all broken controller imports in Routes files

$routes = Get-ChildItem -Path "src\modules" -Recurse -Filter "*Routes.js"
foreach ($file in $routes) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix broken controller imports
    $content = $content -replace "from '\./\.js'", "from './$($file.BaseName -replace 'Routes$', 'Controller').js'"
    
    # Fix auth middleware imports
    $content = $content -replace "from '\.\./\.\./modules/auth/auth\.middleware\.js'", "from '../../auth/auth.middleware.js'"
    
    # Fix other middleware imports
    $relativePath = $file.FullName -replace [regex]::Escape($PWD.Path + "\src\modules\"), ""
    $depth = ($relativePath -split "\\").Count - 1
    $prefix = "../" * $depth + ".."
    
    $content = $content -replace "from '\.\./\.\./middlewares/", "from '$prefix/middlewares/"
    $content = $content -replace "from '\.\./\.\./\.\./middlewares/", "from '$prefix/middlewares/"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "`nDone! All routes files fixed."
