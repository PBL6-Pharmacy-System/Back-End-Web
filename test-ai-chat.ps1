# Test AI Chat API

# Đăng nhập để lấy token (thay thế với thông tin đăng nhập của bạn)
$loginUrl = "http://192.168.40.2:3000/api/auth/login"
$loginBody = @{
    email = "customer@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "🔐 Đăng nhập..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token

Write-Host "✅ Token: $($token.Substring(0, 20))..." -ForegroundColor Green

# Test streaming chat
Write-Host "`n🤖 Testing AI Chat Stream..." -ForegroundColor Cyan
$chatUrl = "http://192.168.40.2:3000/api/auth-chat/stream"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$chatBody = @{
    message = "Tôi bị cảm cúm, có thuốc gì phù hợp không?"
} | ConvertTo-Json

Write-Host "📤 Sending message: Tôi bị cảm cúm, có thuốc gì phù hợp không?" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $chatUrl -Method Post -Headers $headers -Body $chatBody -ContentType "application/json"
    Write-Host "✅ Response received:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
