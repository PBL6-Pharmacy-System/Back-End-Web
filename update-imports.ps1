# Script tự động cập nhật import paths sau khi restructure

# Cập nhật Controllers - import service từ cùng thư mục
$controllers = Get-ChildItem -Path "src\modules" -Recurse -Filter "*Controller.js"
foreach ($file in $controllers) {
    $content = Get-Content $file.FullName -Raw
    
    # Update service imports to same directory
    $content = $content -replace "from '\.\./services/(\w+)Service\.js'", "from './$1Service.js'"
    $content = $content -replace "from '\.\./\.\./services/(\w+)Service\.js'", "from './$1Service.js'"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.FullName)"
}

# Cập nhật Services - import db và utils
$services = Get-ChildItem -Path "src\modules" -Recurse -Filter "*Service.js"
foreach ($file in $services) {
    $content = Get-Content $file.FullName -Raw
    
    # Đếm độ sâu của thư mục để tính relative path
    $relativePath = $file.FullName -replace [regex]::Escape($PWD.Path + "\src\modules\"), ""
    $depth = ($relativePath -split "\\").Count - 1
    $prefix = ".." * $depth + "/.."
    
    # Update imports
    $content = $content -replace "from '\.\./config/db\.js'", "from '$prefix/config/db.js'"
    $content = $content -replace "from '\.\./\.\./config/db\.js'", "from '$prefix/config/db.js'"
    $content = $content -replace "from '\.\./utils/(\w+)\.js'", "from '$prefix/utils/`$1.js'"
    $content = $content -replace "from '\.\./\.\./utils/(\w+)\.js'", "from '$prefix/utils/`$1.js'"
    $content = $content -replace "from '\.\./\.\./\.\./utils/(\w+)\.js'", "from '$prefix/utils/`$1.js'"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.FullName)"
}

# Cập nhật Routes
$routes = Get-ChildItem -Path "src\modules" -Recurse -Filter "*Routes.js"
foreach ($file in $routes) {
    $content = Get-Content $file.FullName -Raw
    
    # Đếm độ sâu
    $relativePath = $file.FullName -replace [regex]::Escape($PWD.Path + "\src\modules\"), ""
    $depth = ($relativePath -split "\\").Count - 1
    $prefix = ".." * $depth + "/.."
    
    # Update controller imports to same directory
    $content = $content -replace "from '\.\./controllers/(\w+)Controller\.js'", "from './$1Controller.js'"
    $content = $content -replace "from '\.\./\.\./controllers/(\w+)Controller\.js'", "from './$1Controller.js'"
    
    # Update middleware imports
    $content = $content -replace "from '\.\./middlewares/(\w+)\.middleware\.js'", "from '$prefix/middlewares/`$1.middleware.js'"
    $content = $content -replace "from '\.\./\.\./middlewares/(\w+)\.middleware\.js'", "from '$prefix/middlewares/`$1.middleware.js'"
    $content = $content -replace "from '\.\./\.\./\.\./middlewares/(\w+)\.middleware\.js'", "from '$prefix/middlewares/`$1.middleware.js'"
    
    # Update auth middleware to auth module
    $content = $content -replace "from '$prefix/middlewares/auth\.middleware\.js'", "from '$prefix/modules/auth/auth.middleware.js'"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.FullName)"
}

Write-Host "`nDone! All import paths updated."
